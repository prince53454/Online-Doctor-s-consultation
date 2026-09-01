const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { v4: uuidv4 } = require('uuid');

async function seedBookings() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Get Dr. Rajesh Sharma (first approved doctor)
  const doctor = await Doctor.findOne({ isApproved: true }).populate('user');
  if (!doctor) {
    console.log('No approved doctor found');
    process.exit(1);
  }
  console.log('Doctor:', doctor.user.name);

  // Get all patients
  const patients = await User.find({ role: 'patient' });
  console.log('Patients found:', patients.length);

  // Clear existing appointments for this doctor
  await Appointment.deleteMany({ doctor: doctor._id });
  console.log('Cleared old appointments');

  const statuses = ['pending', 'confirmed', 'completed', 'rescheduled'];
  const types = ['in-person', 'video', 'chat'];
  const symptomsList = [
    'Persistent headache for 3 days',
    'Chest pain and shortness of breath',
    'Joint pain in knees and ankles',
    'Skin rash and itching on arms',
    'Anxiety and trouble sleeping',
    'Stomach pain after meals',
    'Lower back pain for 2 weeks',
    'High fever and dry cough',
    'Dizziness and nausea in mornings',
    'Allergic reaction to food',
    'Follow-up for blood test results',
    'Routine health checkup',
    'Blood pressure monitoring',
    'Diabetes management review'
  ];

  let created = 0;
  for (let i = 0; i < 14; i++) {
    const patient = patients[i % patients.length];
    const aptDate = new Date();
    aptDate.setDate(aptDate.getDate() + Math.floor(i * 1.5) - 3);
    aptDate.setHours(0, 0, 0, 0);

    const hour = 9 + (i % 8);
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentType: types[i % types.length],
      date: aptDate,
      timeSlot: {
        startTime: String(hour).padStart(2, '0') + ':00',
        endTime: String(hour + 1).padStart(2, '0') + ':00',
        isAvailable: false
      },
      symptoms: symptomsList[i % symptomsList.length],
      medicalHistory: i % 3 === 0 ? 'No significant medical history' : '',
      status: statuses[i % statuses.length],
      roomId: uuidv4(),
      payment: {
        amount: types[i % types.length] === 'in-person' ? 1000 : types[i % types.length] === 'video' ? 1500 : 800,
        currency: 'INR',
        status: statuses[i % statuses.length] === 'completed' ? 'completed' : 'pending'
      },
      consultation: statuses[i % statuses.length] === 'completed' ? {
        notes: 'Patient symptoms examined. Prescribed medication and advised follow-up in 2 weeks.',
        diagnosis: 'Seasonal Allergic Rhinitis',
        prescription: [
          { medicine: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: '7 days', instructions: 'Take after dinner' },
          { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'As needed', duration: '3 days', instructions: 'For fever/pain' }
        ]
      } : {}
    });
    created++;
  }

  // Create a rescheduled appointment with history
  const aptDate = new Date();
  aptDate.setDate(aptDate.getDate() + 5);
  const rescheduledApt = await Appointment.create({
    patient: patients[0]._id,
    doctor: doctor._id,
    appointmentType: 'video',
    date: aptDate,
    timeSlot: { startTime: '11:00', endTime: '12:00', isAvailable: false },
    symptoms: 'Follow-up for blood test results and medication review',
    status: 'confirmed',
    roomId: uuidv4(),
    payment: { amount: 1500, currency: 'INR', status: 'completed' },
    rescheduleHistory: [{
      previousDate: new Date(Date.now() + 2 * 86400000),
      previousTimeSlot: { startTime: '09:00', endTime: '10:00' },
      newDate: aptDate,
      newTimeSlot: { startTime: '11:00', endTime: '12:00' },
      reason: 'Patient had a work meeting conflict - requested to move to 11 AM',
      rescheduledBy: 'doctor',
      rescheduledAt: new Date()
    }]
  });
  created++;

  console.log(`✅ Created ${created} appointments for Dr. ${doctor.user.name}`);

  // Create pending doctor applications
  const pendingDoctors = [
    { name: 'Dr. Priya Verma', email: 'priya.verma@mediconnect.com', spec: 'Dermatologist', city: 'Mumbai' },
    { name: 'Dr. Arjun Singh', email: 'arjun.singh@mediconnect.com', spec: 'ENT Specialist', city: 'Delhi' },
    { name: 'Dr. Meera Iyer', email: 'meera.iyer@mediconnect.com', spec: 'Psychiatrist', city: 'Bangalore' }
  ];

  for (const pd of pendingDoctors) {
    const existing = await User.findOne({ email: pd.email });
    if (existing) continue;

    const user = await User.create({
      name: pd.name,
      email: pd.email,
      password: 'doctor123',
      role: 'doctor',
      phone: '+91' + (9000000000 + Math.floor(Math.random() * 999999999)),
      isVerified: true
    });

    await Doctor.create({
      user: user._id,
      specialization: pd.spec,
      licenseNumber: 'MD' + Math.floor(100000 + Math.random() * 900000),
      experience: Math.floor(3 + Math.random() * 15),
      qualifications: ['MBBS', 'MD'],
      consultationFee: { inPerson: 1000, video: 1500, chat: 800 },
      clinicName: pd.spec + ' Center',
      clinicAddress: `Medical District, ${pd.city}, India`,
      location: { type: 'Point', coordinates: [77.2 + Math.random() * 10, 28.5 + Math.random() * 5], city: pd.city, state: '', country: 'India' },
      availability: generateSchedule(),
      bio: `Experienced ${pd.spec} with ${3 + Math.floor(Math.random() * 15)} years of practice`,
      isApproved: false
    });
  }

  console.log('✅ Created 3 pending doctor applications');

  function generateSchedule() {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
      day,
      slots: day === 'Sunday' ? [] : [
        { startTime: '09:00', endTime: '10:00', isAvailable: true },
        { startTime: '10:00', endTime: '11:00', isAvailable: true },
        { startTime: '11:00', endTime: '12:00', isAvailable: true },
        { startTime: '14:00', endTime: '15:00', isAvailable: true },
        { startTime: '15:00', endTime: '16:00', isAvailable: true },
        { startTime: '16:00', endTime: '17:00', isAvailable: true }
      ]
    }));
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seedBookings().catch(e => { console.error(e); process.exit(1); });
