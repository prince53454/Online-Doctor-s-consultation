const express = require('express');
const mongoose = require('mongoose');
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
  const reservedItems = [];
  try {
    const { pharmacyId, items, prescriptionUrl, deliveryAddress, notes } = req.body;

    if (!Array.isArray(items) || !items.length || items.some(item => !item || typeof item.medicineId !== 'string' || !mongoose.isValidObjectId(item.medicineId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
      return res.status(400).json({ success: false, error: 'Provide medicines with positive integer quantities' });
    }
    if (!deliveryAddress || !['fullName', 'phone', 'address', 'city', 'pincode'].every(key => typeof deliveryAddress[key] === 'string' && deliveryAddress[key].trim())) {
      return res.status(400).json({ success: false, error: 'Complete delivery address is required' });
    }
    if (!/^[1-9]\d{5}$/.test(deliveryAddress.pincode.trim()) || !/^(?:\+91[ -]?)?[6-9]\d{9}$/.test(deliveryAddress.phone.trim())) {
      return res.status(400).json({ success: false, error: 'Enter a valid phone number and six-digit pincode' });
    }
    if (pharmacyId && !mongoose.isValidObjectId(pharmacyId)) {
      return res.status(400).json({ success: false, error: 'Invalid pharmacy ID' });
    }
    const medicineIds = [...new Set(items.map(item => item.medicineId.toLowerCase()))];
    if (medicineIds.length !== items.length) {
      return res.status(400).json({ success: false, error: 'Duplicate medicines are not allowed' });
    }
    const pharmacy = await Pharmacy.findOne({
      ...(pharmacyId ? { _id: pharmacyId } : {}),
      isOnline: true,
      medicines: { $all: medicineIds }
    });
    if (!pharmacy) return res.status(404).json({ success: false, error: 'Pharmacy not found' });

    // Build order items with current prices
    const orderItems = [];
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) return res.status(404).json({ success: false, error: `Medicine not found: ${item.medicineId}` });
      if (!medicine.inStock || medicine.stockCount < item.quantity) return res.status(400).json({ success: false, error: `${medicine.name} is out of stock` });

      if ((medicine.requirePrescription || medicine.prescriptionRequired) && (!prescriptionUrl || !/^https:\/\//.test(prescriptionUrl))) {
        return res.status(400).json({ success: false, error: 'Upload a valid prescription for prescription medicines' });
      }

      orderItems.push({
        medicine: medicine._id,
        name: medicine.name,
        price: medicine.discountPrice ?? medicine.price,
        quantity: item.quantity,
        prescriptionRequired: medicine.requirePrescription || medicine.prescriptionRequired,
        prescriptionUploaded: !!prescriptionUrl
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= pharmacy.freeDeliveryAbove ? 0 : pharmacy.deliveryFee;
    const totalAmount = subtotal + deliveryFee;

    const estimatedDelivery = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

    const order = new PharmacyOrder({
      patient: req.user.id,
      pharmacy: pharmacy._id,
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

    // The stock condition and decrement happen in one write, so simultaneous
    // checkouts cannot both buy the last unit. Roll back on a later failure.
    for (const item of orderItems) {
      const reserved = await Medicine.findOneAndUpdate({
        _id: item.medicine, inStock: true, stockCount: { $gte: item.quantity }
      }, { $inc: { stockCount: -item.quantity, totalSold: item.quantity } });
      if (!reserved) {
        const error = new Error(`${item.name} no longer has enough stock`);
        error.statusCode = 409;
        throw error;
      }
      reservedItems.push(item);
    }
    await order.save();
    reservedItems.length = 0;
    // A reporting counter must not turn a successfully saved order into a failure.
    await Pharmacy.findByIdAndUpdate(pharmacy._id, { $inc: { totalOrders: 1 } })
      .catch(error => console.error('Pharmacy order counter update failed:', error.message));

    res.status(201).json({ success: true, order });
  } catch (err) {
    const rollback = await Promise.allSettled(reservedItems.map(item => Medicine.findByIdAndUpdate(item.medicine,
      { $inc: { stockCount: item.quantity, totalSold: -item.quantity } })));
    rollback.filter(result => result.status === 'rejected').forEach(result => console.error('Inventory rollback failed:', result.reason));
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
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
    if (order.payment.status !== 'pending' || order.payment.razorpayOrderId || order.checkoutLocked || order.status !== 'pending') {
      return res.status(409).json({ success: false, error: 'Only unpaid orders with no payment in progress can be cancelled. Contact support for a paid order.' });
    }
    const cancelled = await PharmacyOrder.findOneAndUpdate({
      _id: order._id, patient: req.user.id, status: 'pending',
      'payment.status': 'pending', 'payment.razorpayOrderId': { $exists: false }, checkoutLocked: { $ne: true }
    }, {
      $set: { status: 'cancelled', cancelReason: reason },
      $push: { statusHistory: { status: 'cancelled', note: reason || 'Cancelled by patient' } }
    }, { new: true });
    if (!cancelled) return res.status(409).json({ success: false, error: 'Order changed; refresh before trying again' });

    // Restore stock
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stockCount: item.quantity, totalSold: -item.quantity } });
    }

    res.json({ success: true, order: cancelled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// RAZORPAY PAYMENT FOR PHARMACY ORDERS
// ==========================================

// POST /api/pharmacy/orders/:id/pay - Create Razorpay order for pharmacy
router.post('/orders/:id/pay', protect, async (req, res) => {
  let claimedOrderId;
  try {
    const order = await PharmacyOrder.findOne({ _id: req.params.id, patient: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.payment.status !== 'pending' || order.status !== 'pending') {
      return res.status(409).json({ success: false, error: 'Order is not eligible for payment' });
    }
    const configured = razorpayService.isRazorpayConfigured();
    if (!configured && process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Razorpay payments are not configured' });
    }
    // Reopening checkout uses the same provider order, rather than charging a
    // second order after a dismissed dialog or a lost HTTP response.
    if (configured && order.payment.razorpayOrderId) {
      return res.json({ success: true, order: {
        id: order.payment.razorpayOrderId, amount: Math.round(order.totalAmount * 100), currency: 'INR'
      }, pharmacyOrder: order, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
    }
    const claimed = await PharmacyOrder.findOneAndUpdate({
      _id: order._id, status: 'pending', 'payment.status': 'pending', checkoutLocked: { $ne: true }
    }, { $set: { checkoutLocked: true } }, { new: true });
    if (!claimed) return res.status(409).json({ success: false, error: 'Order changed or payment is already starting; please retry' });
    claimedOrderId = order._id;
    if (!configured) {
      const paid = await PharmacyOrder.findOneAndUpdate({
        _id: order._id, status: 'pending', 'payment.status': 'pending'
      }, { $set: {
        payment: { method: 'razorpay', status: 'completed',
          razorpayOrderId: 'mock_pharma_' + order._id, razorpayPaymentId: 'mock_pharma_pay_' + order._id,
          paidAt: new Date(), amount: order.totalAmount }, status: 'confirmed'
      }, $push: { statusHistory: { status: 'confirmed', note: 'Payment completed (mock)' } } }, { new: true });
      if (!paid) throw new Error('Order changed during payment');
      claimedOrderId = null;
      return res.json({ success: true, order: { id: 'mock_order', amount: Math.round(order.totalAmount * 100), currency: 'INR' }, pharmacyOrder: paid, mock: true });
    }
    const rzpOrder = await razorpayService.createOrder({
      amount: order.totalAmount, receipt: `pharma_${order._id}`,
      notes: { pharmacyOrderId: order._id.toString(), patientId: req.user.id }
    });
    const updated = await PharmacyOrder.findOneAndUpdate({
      _id: order._id, status: 'pending', 'payment.status': 'pending'
    }, { $set: { 'payment.razorpayOrderId': rzpOrder.id } }, { new: true });
    if (!updated) throw new Error('Order changed during payment');
    claimedOrderId = null;
    res.json({ success: true, order: rzpOrder, pharmacyOrder: updated, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    if (claimedOrderId) await PharmacyOrder.updateOne({ _id: claimedOrderId, 'payment.status': 'pending' }, { $set: { checkoutLocked: false } });
    console.error('Pharmacy payment error:', err.message);
    res.status(500).json({ success: false, error: 'Payment failed' });
  }
});

// POST /api/pharmacy/orders/:id/verify - Verify a captured payment and its amount.
router.post('/orders/:id/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await PharmacyOrder.findOne({ _id: req.params.id, patient: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!razorpayService.isRazorpayConfigured()) {
      return res.status(process.env.NODE_ENV === 'production' ? 503 : 400).json({ success: false, error: 'Razorpay payments are not configured' });
    }
    if (order.status === 'cancelled' || order.payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(409).json({ success: false, error: 'Payment order does not match an eligible pharmacy order' });
    }
    const { verified } = razorpayService.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!verified) return res.status(400).json({ success: false, error: 'Payment verification failed' });
    if (order.payment.status === 'completed' && order.payment.razorpayPaymentId === razorpay_payment_id) {
      return res.json({ success: true, order });
    }
    if (order.payment.status !== 'pending' || order.status !== 'pending') {
      return res.status(409).json({ success: false, error: 'Order payment has already been processed' });
    }
    const payment = await razorpayService.fetchPayment(razorpay_payment_id);
    if (!razorpayService.isCapturedPaymentForOrder({ payment, orderId: razorpay_order_id, amount: order.totalAmount })) {
      return res.status(400).json({ success: false, error: 'Payment is not captured for the exact order amount' });
    }
    const paid = await PharmacyOrder.findOneAndUpdate({
      _id: order._id, status: 'pending', 'payment.status': 'pending', 'payment.razorpayOrderId': razorpay_order_id
    }, { $set: {
      payment: { method: 'razorpay', status: 'completed', razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id, paidAt: new Date(), amount: order.totalAmount },
      status: 'confirmed'
    }, $push: { statusHistory: { status: 'confirmed', note: 'Payment verified' } } }, { new: true });
    if (!paid) return res.status(409).json({ success: false, error: 'Order changed during verification; refresh your orders' });
    res.json({ success: true, order: paid });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

module.exports = router;
