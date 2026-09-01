const express = require('express');
const router = express.Router();
const Lab = require('../models/Lab');
const LabOrder = require('../models/LabOrder');
const { protect: auth } = require('../middleware/auth');

// GET /api/labs - List all labs with filters
router.get('/', async (req, res) => {
  try {
    const { city, search, category, sortBy = 'rating' } = req.query;
    const query = { isActive: true };

    if (city) query.city = new RegExp(city, 'i');
    if (category) query['tests.category'] = category;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'tests.name': new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = -1;
    else if (sortBy === 'price') sortOptions['tests.price'] = 1;
    else if (sortBy === 'bookings') sortOptions.totalBookings = -1;

    const labs = await Lab.find(query).sort(sortOptions).limit(50);
    res.json({ success: true, count: labs.length, labs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs/categories - Get all test categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Lab.aggregate([
      { $unwind: '$tests' },
      { $group: { _id: '$tests.category', count: { $sum: 1 }, minPrice: { $min: '$tests.price' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs/popular-tests - Get popular tests across all labs
router.get('/popular-tests', async (req, res) => {
  try {
    const labs = await Lab.find({ isActive: true }).limit(20);
    const allTests = [];
    labs.forEach(lab => {
      lab.tests.forEach(test => {
        if (test.popular) {
          allTests.push({ ...test.toObject(), labId: lab._id, labName: lab.name, labCity: lab.city });
        }
      });
    });
    allTests.sort((a, b) => a.price - b.price);
    res.json({ success: true, tests: allTests.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs/:id - Get lab details
router.get('/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });
    res.json({ success: true, lab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs/:id/tests - Get tests for a specific lab
router.get('/:id/tests', async (req, res) => {
  try {
    const { category, search, sortBy } = req.query;
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });

    let tests = lab.tests;
    if (category) tests = tests.filter(t => t.category === category);
    if (search) tests = tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'price-low') tests.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') tests.sort((a, b) => b.price - a.price);
    else if (sortBy === 'popular') tests.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));

    res.json({ success: true, count: tests.length, tests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/labs/orders - Create a lab test order
router.post('/orders', auth, async (req, res) => {
  try {
    const { labId, tests, appointmentDate, appointmentTime, homeCollection, collectionAddress, notes } = req.body;

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ success: false, error: 'Lab not found' });

    // Build order tests from lab's test catalog
    const orderTests = tests.map(t => {
      const labTest = lab.tests.id(t.testId);
      if (!labTest) throw new Error(`Test not found: ${t.testId}`);
      return {
        testId: labTest._id,
        name: labTest.name,
        category: labTest.category,
        price: labTest.discountPrice || labTest.price,
        fastingRequired: labTest.fastingRequired,
        reportTime: labTest.reportTime
      };
    });

    const totalAmount = orderTests.reduce((sum, t) => sum + t.price, 0);
    const homeCollectionFee = homeCollection ? lab.homeCollectionFee : 0;
    const finalAmount = totalAmount + homeCollectionFee;

    const order = new LabOrder({
      patient: req.user.id,
      lab: labId,
      tests: orderTests,
      totalAmount,
      homeCollectionFee,
      finalAmount,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      homeCollection: !!homeCollection,
      collectionAddress: homeCollection ? collectionAddress : undefined,
      notes,
      statusHistory: [{ status: 'pending', note: 'Order placed' }]
    });

    await order.save();

    // Update lab booking count
    await Lab.findByIdAndUpdate(labId, { $inc: { totalBookings: 1 } });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs/orders/my - Get patient's lab orders
router.get('/orders/my', auth, async (req, res) => {
  try {
    const orders = await LabOrder.find({ patient: req.user.id })
      .populate('lab', 'name address city avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/labs/orders/:id/cancel - Cancel a lab order
router.put('/orders/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await LabOrder.findOne({ _id: req.params.id, patient: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (['completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.statusHistory.push({ status: 'cancelled', note: reason || 'Cancelled by patient' });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
