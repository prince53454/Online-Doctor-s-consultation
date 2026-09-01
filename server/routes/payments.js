const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const LabOrder = require('../models/LabOrder');
const { protect } = require('../middleware/auth');
const razorpayService = require('../services/razorpayService');
const { isStripeConfigured } = require('../services/stripeService');
const { sendPaymentReceipt, sendAppointmentConfirmation, sendDoctorBookingNotification } = require('../services/emailService');
const revenueService = require('../services/revenueService');
const { notifyPaymentReceived } = require('../services/notificationService');

// @route   GET /api/payments/config
// @desc    Get available payment providers
// @access  Public
router.get('/config', (req, res) => {
  res.json({
    success: true,
    razorpay: {
      configured: razorpayService.isRazorpayConfigured(),
      keyId: process.env.RAZORPAY_KEY_ID || null // Public key only
    },
    stripe: {
      configured: isStripeConfigured()
    }
  });
});

// ==========================================
// RAZORPAY PAYMENT ROUTES
// ==========================================

// @route   POST /api/payments/razorpay/create-order
// @desc    Create Razorpay order for appointment
// @access  Private
router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('patient', 'name email');

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    if (appointment.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const amount = appointment.payment.amount;

    if (!razorpayService.isRazorpayConfigured()) {
      // Mock mode — auto-confirm
      appointment.payment.status = 'completed';
      appointment.payment.paidAt = new Date();
      appointment.payment.razorpayOrderId = 'mock_order_' + Date.now();
      appointment.payment.razorpayPaymentId = 'mock_pay_' + Date.now();
      appointment.status = 'confirmed';
      await appointment.save();

      sendAppointmentConfirmation(appointment, appointment.patient, appointment.doctor).catch(() => {});
      sendDoctorBookingNotification(appointment, appointment.patient, appointment.doctor).catch(() => {});
      sendPaymentReceipt(appointment, appointment.patient, appointment.doctor).catch(() => {});
      revenueService.recordTransaction(appointment).catch(console.error);

      const io = req.app.get('io');
      notifyPaymentReceived(io, appointment, appointment.doctor).catch(console.error);

      return res.json({
        success: true,
        order: { id: 'mock_order', amount: amount * 100, currency: 'INR' },
        appointment,
        razorpayKeyId: null,
        mock: true
      });
    }

    const order = await razorpayService.createOrder({
      amount,
      receipt: `apt_${appointment._id}`,
      notes: { appointmentId: appointment._id.toString(), patientId: req.user.id }
    });

    res.json({
      success: true,
      order,
      appointment,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ success: false, error: 'Payment order creation failed' });
  }
});

// @route   POST /api/payments/razorpay/verify
// @desc    Verify Razorpay payment and confirm appointment
// @access  Private
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpayService.isRazorpayConfigured()) {
      return res.status(400).json({ success: false, error: 'Payment already processed in mock mode' });
    }

    const { verified } = razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('patient', 'name email');

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    appointment.payment.status = 'completed';
    appointment.payment.paidAt = new Date();
    appointment.payment.razorpayOrderId = razorpay_order_id;
    appointment.payment.razorpayPaymentId = razorpay_payment_id;
    appointment.status = 'confirmed';
    await appointment.save();

    sendAppointmentConfirmation(appointment, appointment.patient, appointment.doctor).catch(() => {});
    sendDoctorBookingNotification(appointment, appointment.patient, appointment.doctor).catch(() => {});
    sendPaymentReceipt(appointment, appointment.patient, appointment.doctor).catch(() => {});
    revenueService.recordTransaction(appointment).catch(console.error);

    const io = req.app.get('io');
    notifyPaymentReceived(io, appointment, appointment.doctor).catch(console.error);

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// @route   POST /api/payments/razorpay/lab-order
// @desc    Create Razorpay order for lab test booking
// @access  Private
router.post('/razorpay/lab-order', protect, async (req, res) => {
  try {
    const { labOrderId } = req.body;

    const order = await LabOrder.findById(labOrderId).populate('lab', 'name');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Lab order not found' });
    }
    if (order.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const amount = order.finalAmount;

    if (!razorpayService.isRazorpayConfigured()) {
      order.payment = {
        status: 'completed',
        method: 'razorpay',
        razorpayOrderId: 'mock_order_' + Date.now(),
        razorpayPaymentId: 'mock_pay_' + Date.now(),
        paidAt: new Date(),
        amount
      };
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment completed (mock)' });
      await order.save();

      return res.json({
        success: true,
        order: { id: 'mock_order', amount: amount * 100, currency: 'INR' },
        labOrder: order,
        mock: true
      });
    }

    const rzpOrder = await razorpayService.createOrder({
      amount,
      receipt: `lab_${order._id}`,
      notes: { labOrderId: order._id.toString(), patientId: req.user.id }
    });

    res.json({
      success: true,
      order: rzpOrder,
      labOrder: order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay lab order error:', error);
    res.status(500).json({ success: false, error: 'Payment order creation failed' });
  }
});

// @route   POST /api/payments/razorpay/verify-lab
// @desc    Verify Razorpay payment for lab order
// @access  Private
router.post('/razorpay/verify-lab', protect, async (req, res) => {
  try {
    const { labOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpayService.isRazorpayConfigured()) {
      return res.status(400).json({ success: false, error: 'Already processed in mock mode' });
    }

    const { verified } = razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    const order = await LabOrder.findById(labOrderId).populate('lab', 'name');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Lab order not found' });
    }

    order.payment = {
      status: 'completed',
      method: 'razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: new Date(),
      amount: order.finalAmount
    };
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment verified' });
    await order.save();

    res.json({ success: true, labOrder: order });
  } catch (error) {
    console.error('Razorpay lab verify error:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// ==========================================
// EXISTING STRIPE ROUTES (preserved)
// ==========================================

router.post('/create-intent', protect, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { createPaymentIntent, confirmPayment, isStripeConfigured } = require('../services/stripeService');

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('patient', 'name email');

    if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
    if (appointment.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (!isStripeConfigured()) {
      appointment.payment.status = 'completed';
      appointment.payment.paidAt = new Date();
      appointment.payment.stripePaymentId = 'mock_' + Date.now();
      appointment.status = 'confirmed';
      await appointment.save();

      const io = req.app.get('io');
      notifyPaymentReceived(io, appointment, appointment.doctor).catch(console.error);
      revenueService.recordTransaction(appointment).catch(console.error);

      return res.json({ success: true, payment: { id: 'mock_payment', clientSecret: 'mock_secret', amount: appointment.payment.amount }, appointment, mock: true });
    }

    const payment = await createPaymentIntent({
      amount: appointment.payment.amount,
      metadata: { appointmentId: appointment._id.toString(), patientId: req.user.id, doctorId: appointment.doctor._id.toString() },
      receiptEmail: appointment.patient.email
    });

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, error: 'Payment processing failed' });
  }
});

router.post('/confirm', protect, async (req, res) => {
  try {
    const { appointmentId, paymentId } = req.body;
    const { confirmPayment, isStripeConfigured } = require('../services/stripeService');

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate('patient', 'name email');

    if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });

    if (isStripeConfigured() && paymentId && !paymentId.startsWith('mock_')) {
      const payment = await confirmPayment(paymentId);
      if (payment.status !== 'succeeded') {
        return res.status(400).json({ success: false, error: 'Payment not completed' });
      }
    }

    appointment.payment.status = 'completed';
    appointment.payment.paidAt = new Date();
    appointment.payment.stripePaymentId = paymentId;
    appointment.status = 'confirmed';
    await appointment.save();

    const io = req.app.get('io');
    notifyPaymentReceived(io, appointment, appointment.doctor).catch(console.error);
    revenueService.recordTransaction(appointment).catch(console.error);

    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Payment confirm error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/refund', protect, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
    if (appointment.payment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'No payment to refund' });
    }

    const appointmentDate = new Date(appointment.date);
    const hoursUntil = (appointmentDate - new Date()) / (1000 * 60 * 60);
    let refundAmount = hoursUntil > 24 ? appointment.payment.amount : hoursUntil > 12 ? appointment.payment.amount * 0.5 : 0;

    if (refundAmount > 0) {
      if (appointment.payment.razorpayPaymentId && !appointment.payment.razorpayPaymentId.startsWith('mock_')) {
        await razorpayService.createRefund({ paymentId: appointment.payment.razorpayPaymentId, amount: refundAmount });
      } else if (appointment.payment.stripePaymentId && !appointment.payment.stripePaymentId.startsWith('mock_')) {
        const { createRefund } = require('../services/stripeService');
        await createRefund({ paymentIntentId: appointment.payment.stripePaymentId, amount: refundAmount, reason: 'requested_by_customer' });
      }
    }

    appointment.payment.status = refundAmount > 0 ? 'refunded' : 'completed';
    appointment.refundAmount = refundAmount;
    await appointment.save();

    res.json({ success: true, refundAmount, message: refundAmount > 0 ? `Refund of ₹${refundAmount} will be processed within 5-7 business days` : 'No refund applicable' });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, error: 'Refund processing failed' });
  }
});

module.exports = router;
