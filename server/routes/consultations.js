const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');
const { createRoom, createMeetingToken, isConfigured: dailyConfigured } = require('../services/dailyService');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/consultations
// @desc    Start a new consultation (creates Daily.co room for video)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { appointmentId, type } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Check existing consultation
    const existing = await Consultation.findOne({ appointment: appointmentId });
    if (existing) {
      // If video, ensure room exists
      if (existing.type === 'video' && !existing.dailyRoomUrl) {
        try {
          const room = await createRoom({
            roomName: existing.roomId,
            consultationId: existing._id.toString()
          });
          existing.dailyRoomUrl = room.url;
          existing.dailyRoomName = room.name;
          await existing.save();
        } catch (e) { /* ignore */ }
      }
      return res.json({ success: true, consultation: existing });
    }

    const roomId = uuidv4();
    let dailyRoom = null;

    // Create Daily.co room for video consultations
    const consultationType = type || appointment.appointmentType;
    if (consultationType === 'video') {
      try {
        dailyRoom = await createRoom({
          roomName: roomId,
          consultationId: appointmentId
        });
      } catch (e) {
        console.warn('Daily.co room creation failed:', e.message);
      }
    }

    const consultation = await Consultation.create({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: appointment.doctor,
      type: consultationType,
      roomId,
      dailyRoomUrl: dailyRoom?.url || null,
      dailyRoomName: dailyRoom?.name || null,
      status: 'waiting'
    });

    await consultation.populate([
      { path: 'patient', select: 'name email avatar' },
      { path: 'doctor', populate: { path: 'user', select: 'name email avatar' } }
    ]);

    res.status(201).json({ success: true, consultation });
  } catch (error) {
    console.error('Consultation error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/consultations/:roomId
// @desc    Get consultation by room ID with Daily.co details
// @access  Private
router.get('/:roomId', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ roomId: req.params.roomId })
      .populate('patient', 'name email avatar')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email avatar' } });

    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    // Generate meeting tokens if video consultation
    let patientToken = null;
    let doctorToken = null;

    if (consultation.type === 'video' && consultation.dailyRoomName) {
      try {
        [patientToken, doctorToken] = await Promise.all([
          createMeetingToken({
            roomName: consultation.dailyRoomName,
            isOwner: false,
            userName: consultation.patient?.name
          }),
          createMeetingToken({
            roomName: consultation.dailyRoomName,
            isOwner: false,
            userName: consultation.doctor?.user?.name
          })
        ]);
      } catch (e) {
        console.warn('Token creation failed:', e.message);
      }
    }

    res.json({
      success: true,
      consultation,
      videoConfig: consultation.type === 'video' ? {
        roomUrl: consultation.dailyRoomUrl,
        dailyDomain: process.env.DAILY_DOMAIN || 'mediconnect.daily.co',
        patientToken: patientToken?.token,
        doctorToken: doctorToken?.token,
        isConfigured: dailyConfigured
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/consultations/:roomId/start
// @desc    Start consultation session
// @access  Private
router.put('/:roomId/start', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findOneAndUpdate(
      { roomId: req.params.roomId },
      { status: 'in-progress', startedAt: new Date() },
      { new: true }
    ).populate('patient', 'name email avatar')
     .populate({ path: 'doctor', populate: { path: 'user', select: 'name email avatar' } });

    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/consultations/:roomId/end
// @desc    End consultation session and clean up room
// @access  Private
router.put('/:roomId/end', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ roomId: req.params.roomId });
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    consultation.status = 'completed';
    consultation.endedAt = new Date();
    if (consultation.startedAt) {
      consultation.duration = Math.round((consultation.endedAt - consultation.startedAt) / 60000);
    }

    await Appointment.findByIdAndUpdate(consultation.appointment, { status: 'completed' });
    await consultation.save();

    // Clean up Daily.co room
    if (consultation.dailyRoomName && dailyConfigured) {
      const { deleteRoom } = require('../services/dailyService');
      deleteRoom(consultation.dailyRoomName).catch(() => {});
    }

    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/consultations/:roomId/message
// @desc    Send message in consultation
// @access  Private
router.post('/:roomId/message', protect, async (req, res) => {
  try {
    const { content, messageType, fileUrl, fileName } = req.body;

    const consultation = await Consultation.findOne({ roomId: req.params.roomId });
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    const message = {
      sender: req.user.id,
      content,
      messageType: messageType || 'text',
      fileUrl,
      fileName,
      timestamp: new Date()
    };

    consultation.messages.push(message);
    await consultation.save();

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/consultations/:roomId/messages
// @desc    Get consultation messages
// @access  Private
router.get('/:roomId/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const consultation = await Consultation.findOne({ roomId: req.params.roomId });
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    const messages = consultation.messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/consultations/:roomId/prescription
// @desc    Add prescription (doctor only)
// @access  Private
router.post('/:roomId/prescription', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ roomId: req.params.roomId });
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    consultation.prescriptions.push(req.body);
    await consultation.save();

    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/consultations/:roomId/share-report
// @desc    Share report/attachment
// @access  Private
router.post('/:roomId/share-report', protect, async (req, res) => {
  try {
    const { fileName, fileUrl, fileType } = req.body;

    const consultation = await Consultation.findOne({ roomId: req.params.roomId });
    if (!consultation) {
      return res.status(404).json({ success: false, error: 'Consultation not found' });
    }

    consultation.attachments.push({
      fileName,
      fileUrl,
      fileType,
      sharedBy: req.user.id,
      sharedAt: new Date()
    });
    await consultation.save();

    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/consultations/my-history
// @desc    Get user's consultation history
// @access  Private
router.get('/my-history', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (doctor) query.doctor = doctor._id;
    }

    const consultations = await Consultation.find(query)
      .populate('patient', 'name avatar')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .sort('-createdAt')
      .limit(20)
      .lean();

    res.json({ success: true, consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
