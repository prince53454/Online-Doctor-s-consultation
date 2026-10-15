const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Transaction, DoctorEarnings, Payout } = require('../models/Revenue');
const Doctor = require('../models/Doctor');
const revenueService = require('../services/revenueService');

// ══════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════

// @route   GET /api/revenue/admin/dashboard
// @desc    Admin revenue overview with charts
// @access  Private (Admin)
router.get('/admin/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const data = await revenueService.getAdminDashboardData();
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Revenue dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load revenue data' });
  }
});

// @route   GET /api/revenue/admin/transactions
// @desc    All transactions with filters
// @access  Private (Admin)
router.get('/admin/transactions', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, doctorId, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
        .populate('patient', 'name avatar')
        .populate('appointment', 'appointmentType date timeSlot')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    // Summary for the filter
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$totalAmount' },
          totalPlatformFee: { $sum: '$platformFee' },
          totalDoctorShare: { $sum: '$doctorShare' },
          totalRefunds: { $sum: '$refundAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      transactions,
      summary: summary[0] || { totalCollected: 0, totalPlatformFee: 0, totalDoctorShare: 0, totalRefunds: 0, count: 0 },
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/revenue/admin/payouts
// @desc    All payouts
// @access  Private (Admin)
router.get('/admin/payouts', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    let query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payout.countDocuments(query)
    ]);

    res.json({
      success: true,
      payouts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/revenue/admin/payout/:doctorId
// @desc    Process payout for a doctor
// @access  Private (Admin)
router.post('/admin/payout/:doctorId', protect, authorize('admin'), async (req, res) => {
  try {
    const payout = await revenueService.processPayout(req.params.doctorId, req.user.id);

    // Simulate bank transfer (in production, integrate with Razorpay/Stripe Connect)
    payout.status = 'completed';
    payout.processedAt = new Date();
    payout.reference = `PAY-${Date.now()}`;
    payout.notes = req.body.notes || 'Payout processed';
    await payout.save();

    res.json({ success: true, payout, message: `₹${payout.amount} payout processed successfully` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Payout failed' });
  }
});

// @route   PUT /api/revenue/admin/payout/:id/status
// @desc    Update payout status
// @access  Private (Admin)
router.put('/admin/payout/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, reference, notes } = req.body;
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { status, reference, notes, processedAt: status === 'completed' ? new Date() : undefined },
      { new: true }
    ).populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!payout) return res.status(404).json({ success: false, error: 'Payout not found' });

    // If paid, mark transactions as paid
    if (status === 'completed') {
      await Transaction.updateMany(
        { _id: { $in: payout.transactions } },
        { payoutStatus: 'paid', paidAt: new Date() }
      );
    }

    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/revenue/admin/earnings/:doctorId
// @desc    View any doctor's earnings (admin)
// @access  Private (Admin)
router.get('/admin/earnings/:doctorId', protect, authorize('admin'), async (req, res) => {
  try {
    const data = await revenueService.getDoctorEarnings(req.params.doctorId);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════
// DOCTOR ROUTES
// ══════════════════════════════════════════════════════════════

// @route   GET /api/revenue/doctor/earnings
// @desc    Doctor's own earnings dashboard
// @access  Private (Doctor)
router.get('/doctor/earnings', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const data = await revenueService.getDoctorEarnings(doctor._id);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/revenue/doctor/transactions
// @desc    Doctor's transaction history
// @access  Private (Doctor)
router.get('/doctor/transactions', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const { page = 1, limit = 20, status } = req.query;
    let query = { doctor: doctor._id };
    if (status) query.payoutStatus = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('patient', 'name avatar')
        .populate({ path: 'appointment', select: 'appointmentType date timeSlot' })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/revenue/doctor/payouts
// @desc    Doctor's payout history
// @access  Private (Doctor)
router.get('/doctor/payouts', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const payouts = await Payout.find({ doctor: doctor._id })
      .sort('-createdAt')
      .limit(20)
      .lean();

    res.json({ success: true, payouts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
