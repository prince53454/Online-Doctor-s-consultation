const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const { sendDoctorApprovalStatus } = require('../services/emailService');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalDoctors,
      pendingApprovals,
      totalPatients,
      totalAppointments,
      activeAppointments,
      completedAppointments,
      cancelledAppointments,
      recentAppointments,
      revenue,
      todayAppointments
    ] = await Promise.all([
      Doctor.countDocuments({ isApproved: true }),
      Doctor.countDocuments({ isApproved: false }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.find()
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
        .populate('patient', 'name avatar')
        .sort('-createdAt')
        .limit(10)
        .lean(),
      Appointment.aggregate([
        { $match: { 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      Appointment.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    const monthlyStats = await Appointment.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$payment.amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const specDistribution = await Doctor.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalDoctors, pendingApprovals, totalPatients, totalAppointments,
        activeAppointments, completedAppointments, cancelledAppointments,
        totalRevenue: revenue[0]?.total || 0, todayAppointments
      },
      recentAppointments, monthlyStats, specDistribution
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/doctors/pending
// @desc    Get pending doctor approvals
// @access  Private (Admin)
router.get('/doctors/pending', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: false })
      .populate('user', 'name email avatar phone')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/admin/doctors/:id/approve
// @desc    Approve/reject doctor and send email notification
// @access  Private (Admin)
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const { approved } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved: approved },
      { new: true }
    ).populate('user', 'name email avatar');

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Send email notification
    sendDoctorApprovalStatus(doctor, approved).catch(console.error);

    res.json({
      success: true,
      message: approved ? 'Doctor approved successfully' : 'Doctor rejected',
      doctor
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/doctors
// @desc    Get all doctors
// @access  Private (Admin)
router.get('/doctors', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    let query = {};

    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (status === 'featured') query.isFeatured = true;

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('user', 'name email avatar phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Doctor.countDocuments(query)
    ]);

    res.json({
      success: true,
      doctors,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/admin/doctors/:id/feature
// @desc    Toggle doctor featured status
// @access  Private (Admin)
router.put('/doctors/:id/feature', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    doctor.isFeatured = !doctor.isFeatured;
    await doctor.save();

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin)
router.get('/appointments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    let query = {};

    if (status) query.status = status;
    if (date) {
      const targetDate = new Date(date);
      query.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name email avatar' } })
        .populate('patient', 'name email avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    res.json({
      success: true,
      appointments,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/toggle-active
// @desc    Toggle user active status
// @access  Private (Admin)
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
