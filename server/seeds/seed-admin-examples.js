const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to add demo examples in production.');
  process.exit(1);
}

const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const { Transaction } = require('../models/Revenue');
const revenueService = require('../services/revenueService');

async function ensurePendingDoctors() {
  const applicants = [
    {
      name: 'Dr. Asha Menon',
      email: 'demo.asha@mediconnect.com',
      specialization: 'Cardiologist',
      city: 'Bengaluru',
      state: 'Karnataka',
      clinicName: 'Asha Heart & Wellness',
      status: 'pending'
    },
    {
      name: 'Dr. Kunal Desai',
      email: 'demo.kunal@mediconnect.com',
      specialization: 'Dermatologist',
      city: 'Ahmedabad',
      state: 'Gujarat',
      clinicName: 'Desai Skin Clinic',
      status: 'pending'
    },
    {
      name: 'Dr. Mira Shah',
      email: 'demo.mira@mediconnect.com',
      specialization: 'Pediatrician',
      city: 'Mumbai',
      state: 'Maharashtra',
      clinicName: 'Mira Child Health Centre',
      status: 'rejected'
    },
    {
      name: 'Dr. Dev Patel',
      email: 'demo.dev@mediconnect.com',
      specialization: 'Orthopedic Surgeon',
      city: 'Surat',
      state: 'Gujarat',
      clinicName: 'Patel Bone & Joint Clinic',
      status: 'rejected'
    }
  ];
  const created = { pending: 0, rejected: 0 };

  for (let i = 0; i < applicants.length; i++) {
    const applicant = applicants[i];
    let user = await User.findOne({ email: applicant.email });
    if (!user) {
      user = await User.create({
        name: applicant.name,
        email: applicant.email,
        password: 'doctor123',
        role: 'doctor',
        phone: `+91980000000${i + 1}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.name)}&background=059669&color=fff`
      });
    }
    if (user.role !== 'doctor') {
      throw new Error(`Demo doctor email is already used by a non-doctor account: ${applicant.email}`);
    }

    const existingProfile = await Doctor.findOne({ user: user._id });
    if (existingProfile) continue;

    await Doctor.create({
      user: user._id,
      specialization: applicant.specialization,
      experience: 8 + i * 3,
      licenseNumber: `DEMO-${applicant.status.toUpperCase()}-${i + 1}`,
      consultationFee: { inPerson: 700, video: 500, chat: 350 },
      location: {
        type: 'Point',
        coordinates: [77.59 + i, 12.97 + i],
        city: applicant.city,
        state: applicant.state,
        country: 'India'
      },
      clinicName: applicant.clinicName,
      clinicAddress: `Demo Medical Plaza, ${applicant.city}`,
      availability: [{
        day: 'Monday',
        slots: [{ startTime: '09:00', endTime: '10:00', isAvailable: true, maxPatients: 1 }]
      }],
      languagesKnown: ['English', 'Hindi'],
      about: 'Development sample profile for testing administrator application review.',
      isApproved: false,
      isRejected: applicant.status === 'rejected',
      isFeatured: false,
      verificationDocuments: []
    });
    created[applicant.status]++;
  }

  return created;
}

async function ensureRescheduledAppointment() {
  if (await Appointment.exists({ status: 'rescheduled' })) return false;

  const [patient, doctor] = await Promise.all([
    User.findOne({ role: 'patient' }).sort({ createdAt: 1 }),
    Doctor.findOne({ isApproved: true }).sort({ createdAt: 1 })
  ]);
  if (!patient || !doctor) return false;

  const date = new Date();
  date.setDate(date.getDate() + 5);
  date.setHours(0, 0, 0, 0);
  await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    appointmentType: 'video',
    date,
    timeSlot: { startTime: '11:00', endTime: '11:30' },
    status: 'rescheduled',
    symptoms: 'Follow-up visit after a recent consultation.',
    medicalHistory: 'Development sample appointment.',
    roomId: `demo-rescheduled-${randomUUID()}`,
    payment: {
      amount: doctor.consultationFee.video,
      currency: 'INR',
      status: 'completed',
      method: 'demo',
      paidAt: new Date()
    }
  });
  return true;
}

async function ensureConsultationHistory() {
  const appointments = await Appointment.find({
    status: 'completed',
    appointmentType: { $in: ['video', 'chat'] }
  }).sort('-date').limit(20);
  let created = 0;

  for (const appointment of appointments) {
    if (await Consultation.exists({ appointment: appointment._id })) continue;
    const startedAt = appointment.date || appointment.createdAt || new Date();
    const endedAt = new Date(startedAt.getTime() + 25 * 60 * 1000);
    const doctor = await Doctor.findById(appointment.doctor).select('user');
    await Consultation.create({
      appointment: appointment._id,
      patient: appointment.patient,
      doctor: appointment.doctor,
      type: appointment.appointmentType,
      status: 'completed',
      roomId: appointment.roomId || randomUUID(),
      startedAt,
      endedAt,
      duration: 25,
      diagnosis: appointment.consultation?.diagnosis || 'Follow-up care discussed',
      doctorNotes: appointment.consultation?.notes || 'Development sample consultation history.',
      summary: 'Consultation completed. Follow the care plan and contact the clinic if symptoms change.',
      prescriptions: appointment.consultation?.prescription || [],
      messages: [
        {
          sender: appointment.patient,
          content: 'I have been following the care plan since our last visit.',
          timestamp: startedAt
        },
        {
          sender: doctor?.user,
          content: 'That is good to hear. Please continue the plan and let us know if anything changes.',
          timestamp: new Date(startedAt.getTime() + 5 * 60 * 1000)
        },
        {
          sender: appointment.patient,
          content: 'Thank you, I understand the next steps.',
          timestamp: endedAt
        }
      ]
    });
    created++;
  }

  return created;
}

async function ensureRevenueHistory() {
  const appointments = await Appointment.find({
    status: { $in: ['confirmed', 'completed', 'rescheduled'] },
    'payment.status': 'completed',
    'payment.amount': { $gt: 0 }
  }).sort('-date').limit(40);
  let created = 0;

  for (const appointment of appointments) {
    if (await Transaction.exists({ appointment: appointment._id })) continue;
    await revenueService.recordTransaction(appointment);
    created++;
  }

  return created;
}

async function seedAdminExamples() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_pro');
    const pendingDoctors = await ensurePendingDoctors();
    if (process.argv.includes('--doctors-only')) {
      console.log('Development doctor examples ready:');
      console.log(`- ${pendingDoctors.pending} pending sample doctor applications added`);
      console.log(`- ${pendingDoctors.rejected} rejected sample doctor applications added`);
      return;
    }
    const rescheduledAppointment = await ensureRescheduledAppointment();
    const consultations = await ensureConsultationHistory();
    const transactions = await ensureRevenueHistory();

    console.log('Development examples ready:');
    console.log(`- ${pendingDoctors.pending} pending sample doctor applications added`);
    console.log(`- ${pendingDoctors.rejected} rejected sample doctor applications added`);
    console.log(`- ${rescheduledAppointment ? 1 : 0} sample rescheduled appointment added`);
    console.log(`- ${consultations} completed consultation histories added`);
    console.log(`- ${transactions} payment transactions available`);
  } catch (error) {
    console.error('Failed to seed development examples:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdminExamples();
