const express = require('express');
const { randomUUID } = require('crypto');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');
const {
  createNotification,
  notifyDoctorBooked,
  notifyPatientConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyAdminsAppointment,
  notifyReviewReceived
} = require('../services/notificationService');

// @route   POST /api/appointments
// @desc    Book an appointment
// @access  Private (Patient)
router.post('/', protect, authorize('patient'), [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('timeSlot').isObject().withMessage('Time slot is required'),
  body('appointmentType').isIn(['in-person', 'video', 'chat']).withMessage('Invalid appointment type'),
  body('symptoms').notEmpty().withMessage('Please describe your symptoms')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { doctorId, date, timeSlot, appointmentType, symptoms, medicalHistory, isAIBooking, aiRecommendation } = req.body;

    // Verify doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({ success: false, error: 'Doctor not found or not approved' });
    }

    // Check slot availability
    const appointmentDate = new Date(date);
    appointmentDate.setUTCHours(0, 0, 0, 0);
    const requestedDay = new Date(appointmentDate);
    const today = new Date();
    requestedDay.setUTCHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);
    if (requestedDay < today) {
      return res.status(400).json({ success: false, error: 'Appointments must be booked for today or a future date' });
    }
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDate.getUTCDay()];

    const dayAvailability = doctor.availability.find(a => a.day === dayName);
    if (!dayAvailability) {
      return res.status(400).json({ success: false, error: 'Doctor is not available on this day' });
    }

    const slotAvailable = dayAvailability.slots.find(
      s => s.startTime === timeSlot.startTime && s.endTime === timeSlot.endTime && s.isAvailable
    );
    if (!slotAvailable) {
      return res.status(400).json({ success: false, error: 'This time slot is not available' });
    }

    // Check for existing booking in same slot
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: appointmentDate,
      'timeSlot.startTime': timeSlot.startTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existingAppointment) {
      return res.status(400).json({ success: false, error: 'This slot is already booked' });
    }

    // Determine fee
    let fee;
    switch (appointmentType) {
      case 'video': fee = doctor.consultationFee.video; break;
      case 'chat': fee = doctor.consultationFee.chat; break;
      default: fee = doctor.consultationFee.inPerson;
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentType,
      date: appointmentDate,
      timeSlot,
      symptoms,
      medicalHistory,
      isAIBooking: isAIBooking || false,
      aiRecommendation,
      roomId: randomUUID(),
      payment: { amount: fee, currency: 'INR', status: 'pending' }
    });

    await appointment.populate([
      { path: 'doctor', populate: { path: 'user', select: 'name email avatar' } },
      { path: 'patient', select: 'name email avatar' }
    ]);

    // Send real-time notification to doctor
    const io = req.app.get('io');
    notifyDoctorBooked(io, appointment, appointment.patient, appointment.doctor).catch(console.error);

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, type } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      query.doctor = doctor?._id || null;
    }

    if (status) query.status = status;
    if (type) query.appointmentType = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'name email avatar phone' }
        })
        .populate('patient', 'name email avatar phone')
        .sort('-date')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    res.json({
      success: true,
      appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment details
// @access  Private (involved parties only)
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email avatar phone' }
      })
      .populate('patient', 'name email avatar phone');

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Check authorization
    const isPatient = appointment.patient._id.toString() === req.user.id;
    const doctor = await Doctor.findOne({ user: req.user.id });
    const isDoctor = doctor?.isApproved && appointment.doctor._id.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const doctor = await Doctor.findOne({ user: req.user.id });
    const isPatient = appointment.patient.toString() === req.user.id;
    const isDoctor = doctor?.isApproved && appointment.doctor.toString() === doctor._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const activeStatuses = ['pending', 'confirmed', 'rescheduled'];
    if (status === 'confirmed' && appointment.status !== 'pending' && appointment.status !== 'rescheduled') {
      return res.status(409).json({ success: false, error: 'Only pending or rescheduled appointments can be confirmed' });
    }
    if (status === 'completed' && (!isDoctor || appointment.status !== 'confirmed')) {
      return res.status(409).json({ success: false, error: 'Only the assigned doctor can complete a confirmed appointment' });
    }
    if (status === 'cancelled' && !activeStatuses.includes(appointment.status)) {
      return res.status(409).json({ success: false, error: 'Only active appointments can be cancelled' });
    }
    if (status === 'confirmed' && !(isDoctor || isAdmin)) {
      return res.status(403).json({ success: false, error: 'Only the assigned doctor or an admin can confirm appointments' });
    }
    if (status === 'completed' && !isDoctor) {
      return res.status(403).json({ success: false, error: 'Only the assigned doctor can complete appointments' });
    }

    // Handle cancellation refunds
    if (status === 'cancelled') {
      const appointmentDate = new Date(appointment.date);
      const now = new Date();
      const hoursUntil = (appointmentDate - now) / (1000 * 60 * 60);

      if (hoursUntil > 24) {
        appointment.refundAmount = appointment.payment.amount;
      } else if (hoursUntil > 12) {
        appointment.refundAmount = appointment.payment.amount * 0.5;
      }
      appointment.cancelledBy = req.user.role;
      appointment.cancellationReason = cancellationReason || '';
    }

    appointment.status = status;
    await appointment.save();

    await appointment.populate([
      { path: 'doctor', populate: { path: 'user', select: 'name email avatar' } },
      { path: 'patient', select: 'name email avatar' }
    ]);

    // Send real-time notifications
    const io = req.app.get('io');
    const actorRole = isAdmin ? 'admin' : isDoctor ? 'doctor' : 'patient';
    if (status === 'confirmed' && actorRole === 'doctor') {
      notifyPatientConfirmed(io, appointment, appointment.patient, appointment.doctor).catch(console.error);
    }
    if (status === 'confirmed' && actorRole === 'admin') {
      createNotification(io, {
        recipientId: appointment.patient._id,
        senderId: req.user.id,
        type: 'appointment_confirmed',
        title: '✅ Appointment Confirmed',
        message: 'An administrator confirmed your appointment.',
        data: { appointmentId: appointment._id, doctorId: appointment.doctor._id, roomId: appointment.roomId, status }
      }).catch(console.error);
    }
    if (status === 'cancelled') {
      const recipients = actorRole === 'admin'
        ? [appointment.patient._id, appointment.doctor.user?._id || appointment.doctor.user]
        : [actorRole === 'doctor' ? appointment.patient._id : (appointment.doctor.user?._id || appointment.doctor.user)];
      recipients.forEach(recipientId => notifyAppointmentCancelled(
        io, appointment, recipientId, actorRole, cancellationReason
      ).catch(console.error));
    }
    if (status === 'completed') {
      createNotification(io, {
        recipientId: appointment.patient._id,
        senderId: req.user.id,
        type: 'appointment_status_updated',
        title: 'Consultation Completed',
        message: 'Your doctor marked the consultation as completed.',
        data: { appointmentId: appointment._id, doctorId: appointment.doctor._id, status }
      }).catch(console.error);
    }
    notifyAdminsAppointment(io, appointment, status, actorRole).catch(console.error);

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/consultation
// @desc    Add consultation notes (doctor only)
// @access  Private (Doctor)
router.put('/:id/consultation', protect, authorize('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor?.isApproved || appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only the assigned doctor can update consultation notes' });
    }
    if (!['confirmed', 'completed'].includes(appointment.status)) {
      return res.status(409).json({ success: false, error: 'Consultation notes can only be added to confirmed or completed appointments' });
    }

    appointment.consultation = {
      ...appointment.consultation,
      notes: req.body.notes,
      diagnosis: req.body.diagnosis,
      prescription: req.body.prescription,
      followUpDate: req.body.followUpDate,
      labTests: req.body.labTests,
      referrals: req.body.referrals
    };
    await appointment.save();
    await appointment.populate('patient', 'name email avatar');
    await appointment.populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } });

    if (appointment.patient?._id) {
      createNotification(req.app.get('io'), {
        recipientId: appointment.patient._id,
        senderId: req.user.id,
        type: 'prescription_shared',
        title: 'Consultation Notes Updated',
        message: 'Your doctor added consultation notes or a prescription.',
        data: { appointmentId: appointment._id, doctorId: appointment.doctor._id, status: appointment.status }
      }).catch(console.error);
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/appointments/:id/rate
// @desc    Rate appointment
// @access  Private (Patient)
router.post('/:id/rate', protect, authorize('patient'), [
  body('score').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the patient who attended can rate this appointment' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Can only rate completed appointments' });
    }
    if (appointment.rating?.score) {
      return res.status(409).json({ success: false, error: 'This appointment has already been rated' });
    }

    appointment.rating = {
      score: req.body.score,
      review: req.body.review,
      reviewedAt: new Date()
    };
    await appointment.save();

    // Update doctor rating
    const doctor = await Doctor.findById(appointment.doctor);
    if (doctor) {
      const allRatings = await Appointment.find({
        doctor: doctor._id,
        'rating.score': { $exists: true }
      }).select('rating.score');

      const totalRating = allRatings.reduce((sum, a) => sum + a.rating.score, 0);
      doctor.rating.average = totalRating / allRatings.length;
      doctor.rating.count = allRatings.length;
      await doctor.save();
    }

    if (doctor) {
      notifyReviewReceived(req.app.get('io'), appointment, req.user, doctor).catch(console.error);
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/reschedule
// @desc    Reschedule appointment (doctor or patient)
// @access  Private
router.put('/:id/reschedule', protect, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('timeSlot').isObject().withMessage('Time slot is required'),
  body('timeSlot.startTime').isString().notEmpty().withMessage('Start time is required'),
  body('timeSlot.endTime').isString().notEmpty().withMessage('End time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { date, timeSlot, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Check authorization
    const isPatient = appointment.patient.toString() === req.user.id;
    const doctor = await Doctor.findOne({ user: req.user.id });
    const isDoctor = doctor?.isApproved && appointment.doctor.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (!['pending', 'confirmed', 'rescheduled'].includes(appointment.status)) {
      return res.status(409).json({ success: false, error: 'Only active appointments can be rescheduled' });
    }

    // Verify new slot availability
    const newDate = new Date(date);
    newDate.setUTCHours(0, 0, 0, 0);
    const requestedDay = new Date(newDate);
    const today = new Date();
    requestedDay.setUTCHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);
    if (requestedDay < today) {
      return res.status(400).json({ success: false, error: 'Appointments cannot be rescheduled to a past date' });
    }
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][newDate.getUTCDay()];

    const doctorProfile = await Doctor.findById(appointment.doctor);
    const dayAvailability = doctorProfile?.availability.find(a => a.day === dayName);
    if (!dayAvailability) {
      return res.status(400).json({ success: false, error: 'Doctor is not available on this day' });
    }
    const offeredSlot = dayAvailability.slots.find(
      slot => slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime && slot.isAvailable
    );
    if (!offeredSlot) {
      return res.status(400).json({ success: false, error: 'The selected time is not an available doctor slot' });
    }

    // Check if the new slot is available (exclude current appointment)
    const slotTaken = await Appointment.findOne({
      doctor: appointment.doctor,
      _id: { $ne: appointment._id },
      date: newDate,
      'timeSlot.startTime': timeSlot.startTime,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (slotTaken) {
      return res.status(400).json({ success: false, error: 'This new time slot is already booked' });
    }

    // Store old values for history
    appointment.rescheduleHistory = appointment.rescheduleHistory || [];
    appointment.rescheduleHistory.push({
      previousDate: appointment.date,
      previousTimeSlot: appointment.timeSlot,
      newDate: newDate,
      newTimeSlot: timeSlot,
      reason: reason || '',
      rescheduledBy: req.user.role,
      rescheduledAt: new Date()
    });

    appointment.date = newDate;
    appointment.timeSlot = timeSlot;
    appointment.status = 'rescheduled';

    await appointment.save();
    await appointment.populate([
      { path: 'doctor', populate: { path: 'user', select: 'name email avatar' } },
      { path: 'patient', select: 'name email avatar' }
    ]);

    const recipientId = isDoctor
      ? appointment.patient._id
      : appointment.doctor.user?._id || appointment.doctor.user;
    const io = req.app.get('io');
    notifyAppointmentRescheduled(io, appointment, recipientId, req.user.role).catch(console.error);

    res.json({ success: true, appointment, message: 'Appointment rescheduled successfully' });
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
