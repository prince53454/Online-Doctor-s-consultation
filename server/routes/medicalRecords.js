const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/medical-records
// @desc    Get patient's complete medical records (appointments + consultations + prescriptions)
// @access  Private (Patient)
router.get('/', protect, authorize('patient'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get all patient's appointments with full details
    const [appointments, total] = await Promise.all([
      Appointment.find({ patient: req.user.id })
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'name email avatar specialization' }
        })
        .sort('-date')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments({ patient: req.user.id })
    ]);

    // Get consultations (which have prescriptions, notes, etc.)
    const consultations = await Consultation.find({ patient: req.user.id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name specialization' } })
      .sort('-createdAt')
      .lean();

    // Build prescriptions list from consultations
    const prescriptions = [];
    consultations.forEach(c => {
      if (c.prescriptions && c.prescriptions.length > 0) {
        c.prescriptions.forEach(p => {
          prescriptions.push({
            ...p,
            doctorName: c.doctor?.user?.name || 'Unknown',
            specialization: c.doctor?.specialization || '',
            date: p.issuedAt || c.createdAt,
            consultationId: c._id,
            roomId: c.roomId,
            diagnosis: c.diagnosis,
            notes: c.doctorNotes
          });
        });
      }
    });

    // Build medical timeline
    const timeline = [];

    appointments.forEach(apt => {
      // Appointment events
      timeline.push({
        type: 'appointment',
        date: apt.date,
        title: `${apt.appointmentType === 'video' ? '📹 Video' : apt.appointmentType === 'chat' ? '💬 Chat' : '🏥 In-Person'} Consultation`,
        doctor: apt.doctor?.user?.name || 'Unknown',
        specialization: apt.doctor?.specialization || '',
        status: apt.status,
        data: apt
      });

      // Prescription events from appointment
      if (apt.consultation?.prescription?.length > 0) {
        apt.consultation.prescription.forEach(p => {
          timeline.push({
            type: 'prescription',
            date: apt.date,
            title: `Prescription from Dr. ${apt.doctor?.user?.name}`,
            doctor: apt.doctor?.user?.name,
            data: p
          });
        });
      }
    });

    // Consultation events
    consultations.forEach(c => {
      timeline.push({
        type: 'consultation',
        date: c.createdAt,
        title: `${c.type} consultation`,
        doctor: c.doctor?.user?.name || 'Unknown',
        status: c.status,
        data: c
      });
    });

    // Sort timeline by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary stats
    const allAppointments = await Appointment.find({ patient: req.user.id }).lean();
    const totalSpent = allAppointments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0);
    const completedCount = allAppointments.filter(a => a.status === 'completed').length;
    const uniqueDoctors = [...new Set(allAppointments.map(a => a.doctor.toString()))].length;

    res.json({
      success: true,
      appointments,
      consultations,
      prescriptions,
      timeline,
      summary: {
        totalAppointments: allAppointments.length,
        completedAppointments: completedCount,
        totalPrescriptions: prescriptions.length,
        totalSpent,
        uniqueDoctorsConsulted: uniqueDoctors
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Medical records error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/medical-records/prescriptions
// @desc    Get all prescriptions for patient
// @access  Private (Patient)
router.get('/prescriptions', protect, authorize('patient'), async (req, res) => {
  try {
    const consultations = await Consultation.find({ patient: req.user.id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email specialization' } })
      .populate('appointment', 'date timeSlot appointmentType')
      .sort('-createdAt')
      .lean();

    const prescriptions = [];
    consultations.forEach(c => {
      if (c.prescriptions && c.prescriptions.length > 0) {
        c.prescriptions.forEach(p => {
          prescriptions.push({
            ...p,
            doctor: {
              name: c.doctor?.user?.name || 'Unknown',
              email: c.doctor?.user?.email,
              specialization: c.doctor?.specialization
            },
            appointmentDate: c.appointment?.date,
            appointmentType: c.appointment?.appointmentType,
            consultationId: c._id,
            roomId: c.roomId,
            diagnosis: c.diagnosis,
            notes: c.doctorNotes
          });
        });
      }
    });

    // Also get prescriptions from appointment consultation notes
    const appointments = await Appointment.find({
      patient: req.user.id,
      'consultation.prescription.0': { $exists: true }
    })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email specialization' } })
      .sort('-date')
      .lean();

    appointments.forEach(apt => {
      apt.consultation.prescription.forEach(p => {
        const exists = prescriptions.find(
          rp => rp.medicine === p.medicine && rp.dosage === p.dosage && rp.issuedAt?.getTime?.() === apt.date.getTime?.()
        );
        if (!exists) {
          prescriptions.push({
            ...p,
            doctor: {
              name: apt.doctor?.user?.name,
              email: apt.doctor?.user?.email,
              specialization: apt.doctor?.specialization
            },
            appointmentDate: apt.date,
            appointmentType: apt.appointmentType,
            diagnosis: apt.consultation.diagnosis,
            notes: apt.consultation.notes
          });
        }
      });
    });

    prescriptions.sort((a, b) => new Date(b.date || b.appointmentDate) - new Date(a.date || a.appointmentDate));

    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Prescriptions error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
