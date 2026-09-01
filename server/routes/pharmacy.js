const express = require('express');
const router = express.Router();
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const PharmacyOrder = require('../models/PharmacyOrder');
const { protect } = require('../middleware/auth');
const razorpayService = require('../services/razorpayService');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// GET /api/pharmacy - List all pharmacies
router.get('/', async (req, res) => {
  try {
    const { city, search, sortBy = 'rating' } = req.query;
    const query = { isOnline: true };

    if (city) query.city = new RegExp(city, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = -1;
    else if (sortBy === 'delivery') sortOptions.totalOrders = -1;
    else if (sortBy === 'delivery-fee') sortOptions.deliveryFee = 1;

    const pharmacies = await Pharmacy.find(query).sort(sortOptions).limit(50);
    res.json({ success: true, count: pharmacies.length, pharmacies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/medicines - Search medicines across all pharmacies
router.get('/medicines', async (req, res) => {
  try {
    const { search, category, sortBy, minPrice, maxPrice } = req.query;
    const query = { inStock: true };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { genericName: new RegExp(search, 'i') },
        { composition: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    if (category) query.category = category;
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    const sortOptions = {};
    if (sortBy === 'price-low') sortOptions.price = 1;
    else if (sortBy === 'price-high') sortOptions.price = -1;
    else if (sortBy === 'popular') sortOptions.totalSold = -1;
    else if (sortBy === 'rating') sortOptions.rating = -1;
    else sortOptions.totalSold = -1;

    const medicines = await Medicine.find(query).sort(sortOptions).limit(100);
    res.json({ success: true, count: medicines.length, medicines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/categories - Medicine categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Medicine.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$price' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/popular - Popular medicines
router.get('/popular', async (req, res) => {
  try {
    const medicines = await Medicine.find({ inStock: true })
      .sort({ totalSold: -1 })
      .limit(20);
    res.json({ success: true, medicines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/prescription-required - Medicines requiring prescription
router.get('/prescription-required', async (req, res) => {
  try {
    const medicines = await Medicine.find({ requirePrescription: true, inStock: true })
      .sort({ totalSold: -1 })
      .limit(50);
    res.json({ success: true, medicines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/:id - Pharmacy details
router.get('/:id', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id)
      .populate('medicines');
    if (!pharmacy) return res.status(404).json({ success: false, error: 'Pharmacy not found' });
    res.json({ success: true, pharmacy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/:id/medicines - Medicines in a specific pharmacy
router.get('/:id/medicines', async (req, res) => {
  try {
    const { category, search, sortBy } = req.query;
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) return res.status(404).json({ success: false, error: 'Pharmacy not found' });

    let query = { _id: { $in: pharmacy.medicines }, inStock: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { genericName: new RegExp(search, 'i') }
      ];
    }

    const sortOptions = {};
    if (sortBy === 'price-low') sortOptions.price = 1;
    else if (sortBy === 'price-high') sortOptions.price = -1;
    else if (sortBy === 'popular') sortOptions.totalSold = -1;
    else sortOptions.name = 1;

    const medicines = await Medicine.find(query).sort(sortOptions);
    res.json({ success: true, count: medicines.length, medicines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PROTECTED ROUTES (Patient)
// ==========================================

// POST /api/pharmacy/orders - Create a pharmacy order
router.post('/orders', protect, async (req, res) => {
  try {
    const { pharmacyId, items, prescriptionUrl, deliveryAddress, notes } = req.body;

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) return res.status(404).json({ success: false, error: 'Pharmacy not found' });

    // Build order items with current prices
    const orderItems = [];
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) return res.status(404).json({ success: false, error: `Medicine not found: ${item.medicineId}` });
      if (!medicine.inStock) return res.status(400).json({ success: false, error: `${medicine.name} is out of stock` });

      orderItems.push({
        medicine: medicine._id,
        name: medicine.name,
        price: medicine.discountPrice || medicine.price,
        quantity: item.quantity || 1,
        prescriptionRequired: medicine.requirePrescription,
        prescriptionUploaded: !!prescriptionUrl
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= pharmacy.freeDeliveryAbove ? 0 : pharmacy.deliveryFee;
    const totalAmount = subtotal + deliveryFee;

    const estimatedDelivery = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

    const order = new PharmacyOrder({
      patient: req.user.id,
      pharmacy: pharmacyId,
      items: orderItems,
      prescriptionUrl,
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryAddress,
      notes,
      estimatedDelivery,
      statusHistory: [{ status: 'pending', note: 'Order placed' }]
    });

    await order.save();
    await Pharmacy.findByIdAndUpdate(pharmacyId, { $inc: { totalOrders: 1 } });

    // Update stock
    for (const item of orderItems) {
      await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stockCount: -item.quantity, totalSold: item.quantity } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pharmacy/orders/my - Patient's pharmacy orders
router.get('/orders/my', protect, async (req, res) => {
  try {
    const orders = await PharmacyOrder.find({ patient: req.user.id })
      .populate('pharmacy', 'name avatar phone')
      .populate('items.medicine', 'name image dosageForm strength')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/pharmacy/orders/:id/cancel - Cancel a pharmacy order
router.put('/orders/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await PharmacyOrder.findOne({ _id: req.params.id, patient: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    order.cancelReason = reason;
    order.statusHistory.push({ status: 'cancelled', note: reason || 'Cancelled by patient' });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stockCount: item.quantity, totalSold: -item.quantity } });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// RAZORPAY PAYMENT FOR PHARMACY ORDERS
// ==========================================

// POST /api/pharmacy/orders/:id/pay - Create Razorpay order for pharmacy
router.post('/orders/:id/pay', protect, async (req, res) => {
  try {
    const order = await PharmacyOrder.findOne({ _id: req.params.id, patient: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (!razorpayService.isRazorpayConfigured()) {
      order.payment = {
        method: 'razorpay',
        status: 'completed',
        razorpayOrderId: 'mock_pharma_' + Date.now(),
        razorpayPaymentId: 'mock_pharma_pay_' + Date.now(),
        paidAt: new Date(),
        amount: order.totalAmount
      };
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment completed (mock)' });
      await order.save();

      return res.json({
        success: true,
        order: { id: 'mock_order', amount: order.totalAmount * 100, currency: 'INR' },
        pharmacyOrder: order,
        mock: true
      });
    }

    const rzpOrder = await razorpayService.createOrder({
      amount: order.totalAmount,
      receipt: `pharma_${order._id}`,
      notes: { pharmacyOrderId: order._id.toString(), patientId: req.user.id }
    });

    res.json({
      success: true,
      order: rzpOrder,
      pharmacyOrder: order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Pharmacy payment error:', err);
    res.status(500).json({ success: false, error: 'Payment failed' });
  }
});

// POST /api/pharmacy/orders/:id/verify - Verify payment for pharmacy
router.post('/orders/:id/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await PharmacyOrder.findOne({ _id: req.params.id, patient: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (razorpayService.isRazorpayConfigured()) {
      const { verified } = razorpayService.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
      if (!verified) return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    order.payment = {
      method: 'razorpay',
      status: 'completed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: new Date(),
      amount: order.totalAmount
    };
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment verified' });
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

module.exports = router;
