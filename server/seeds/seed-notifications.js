const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_pro');
    console.log('Connected to MongoDB');

    // Get doctor user (Dr. Rajesh)
    const doctorUser = await User.findOne({ email: 'dr.rajesh@mediconnect.com' });
    const doctorProfile = await Doctor.findOne({ user: doctorUser._id });
    const patients = await User.find({ role: 'patient' }).limit(10);

    if (!doctorUser || !doctorProfile) {
      console.log('Doctor not found. Run main seed first.');
      process.exit(1);
    }

    // Get existing appointments for Dr. Rajesh
    const appointments = await Appointment.find({ doctor: doctorProfile._id })
      .populate('patient', 'name email')
      .limit(15);

    console.log(`Found ${appointments.length} appointments for Dr. Rajesh`);

    // 1. Create sample notifications for the doctor
    const notifications = [
      {
        recipient: doctorUser._id,
        sender: patients[0]?._id,
        type: 'appointment_booked',
        title: '📅 New Appointment Booked',
        message: `${patients[0]?.name || 'Vikram Patel'} has booked an in-person consultation for Monday, September 8 at 10:00.`,
        data: { appointmentId: appointments[0]?._id, patientId: patients[0]?._id, amount: 1000 }
      },
      {
        recipient: doctorUser._id,
        sender: patients[1]?._id,
        type: 'payment_received',
        title: '💰 Payment Received',
        message: `Payment of ₹1000 received from ${patients[1]?.name || 'Aarav Mehta'} for video consultation.`,
        data: { amount: 1000 }
      },
      {
        recipient: doctorUser._id,
        sender: patients[2]?._id,
        type: 'appointment_booked',
        title: '📅 New Appointment Booked',
        message: `${patients[2]?.name || 'Sneha Reddy'} has booked a video consultation for Tuesday at 14:00.`,
        data: { amount: 500 }
      },
      {
        recipient: doctorUser._id,
        type: 'reminder_24h',
        title: '⏰ Appointment Reminder',
        message: 'You have 3 appointments scheduled for tomorrow.',
        data: {}
      },
      {
        recipient: doctorUser._id,
        sender: patients[3]?._id,
        type: 'new_message',
        title: '💬 New Message',
        message: `${patients[3]?.name || 'Divya Kapoor'} sent you a message.`,
        data: {}
      },
      {
        recipient: doctorUser._id,
        sender: patients[4]?._id,
        type: 'appointment_rescheduled',
        title: '🔄 Appointment Rescheduled',
        message: `${patients[4]?.name || 'Amit Singh'} rescheduled their appointment to Thursday at 11:00.`,
        data: {}
      }
    ];

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // 2. Create sample consultations with prescriptions for existing appointments
    const completedAppts = appointments.filter(a => a.status === 'completed' || a.status === 'confirmed').slice(0, 5);
    
    const consultationData = [
      {
        appointment: completedAppts[0]?._id,
        patient: patients[0]?._id || completedAppts[0]?.patient?._id,
        doctor: doctorProfile._id,
        type: 'video',
        roomId: `consultation-video-${Date.now()}-1`,
        status: 'completed',
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60000),
        duration: 30,
        diagnosis: 'Mild Hypertension',
        doctorNotes: 'Patient presents with elevated blood pressure. Recommended lifestyle changes and medication.',
        prescriptions: [
          { medicine: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning with water' },
          { medicine: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take after food' }
        ],
        messages: [
          { sender: patients[0]?._id, content: 'Hello Doctor, I have been having headaches lately.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { sender: doctorUser._id, content: 'Hello! Can you tell me more about the frequency and intensity of the headaches?', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60000) },
          { sender: patients[0]?._id, content: 'They happen mostly in the morning, moderate pain.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 120000) },
          { sender: doctorUser._id, content: 'I see. Let me check your blood pressure. It seems elevated. I am prescribing Amlodipine.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 180000) }
        ]
      },
      {
        appointment: completedAppts[1]?._id,
        patient: patients[1]?._id || completedAppts[1]?.patient?._id,
        doctor: doctorProfile._id,
        type: 'chat',
        roomId: `consultation-chat-${Date.now()}-2`,
        status: 'completed',
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 15 * 60000),
        duration: 15,
        diagnosis: 'Seasonal Allergy',
        doctorNotes: 'Patient has seasonal allergic rhinitis. No asthma symptoms.',
        prescriptions: [
          { medicine: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '14 days', instructions: 'Take at bedtime' },
          { medicine: 'Montelukast', dosage: '10mg', frequency: 'Once daily', duration: '14 days', instructions: 'Take in the evening' }
        ],
        messages: [
          { sender: patients[1]?._id, content: 'Doctor, I have been sneezing a lot and my nose is running.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { sender: doctorUser._id, content: 'These are typical allergy symptoms. Are you taking any medication currently?', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60000) },
          { sender: patients[1]?._id, content: 'No, I have not taken anything yet.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 120000) }
        ]
      },
      {
        appointment: completedAppts[2]?._id,
        patient: patients[2]?._id || completedAppts[2]?.patient?._id,
        doctor: doctorProfile._id,
        type: 'video',
        roomId: `consultation-video-${Date.now()}-3`,
        status: 'completed',
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 25 * 60000),
        duration: 25,
        diagnosis: 'Type 2 Diabetes - Follow up',
        doctorNotes: 'Blood sugar levels have improved. Continue current medication. Next follow-up in 3 months.',
        prescriptions: [
          { medicine: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '90 days', instructions: 'Take with meals' },
          { medicine: 'Glimepiride', dosage: '2mg', frequency: 'Once daily', duration: '90 days', instructions: 'Take before breakfast' }
        ],
        messages: [
          { sender: patients[2]?._id, content: 'Doctor, my recent sugar test showed 140 fasting.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { sender: doctorUser._id, content: 'That is much better than last time! Keep up the good work with diet and exercise.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60000) }
        ]
      },
      {
        appointment: completedAppts[3]?._id,
        patient: patients[3]?._id || completedAppts[3]?.patient?._id,
        doctor: doctorProfile._id,
        type: 'chat',
        roomId: `consultation-ip-${Date.now()}-4`,
        status: 'completed',
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60000),
        duration: 20,
        diagnosis: 'Lower Back Pain',
        doctorNotes: 'Muscular strain from poor posture. Recommended physiotherapy and ergonomic changes.',
        prescriptions: [
          { medicine: 'Diclofenac', dosage: '50mg', frequency: 'Twice daily', duration: '7 days', instructions: 'Take after food. Do not exceed 7 days.' },
          { medicine: 'Thiocolchicoside', dosage: '4mg', frequency: 'Twice daily', duration: '7 days', instructions: 'Muscle relaxant. Take with meals.' }
        ],
        messages: []
      },
      {
        appointment: completedAppts[4]?._id,
        patient: patients[4]?._id || completedAppts[4]?.patient?._id,
        doctor: doctorProfile._id,
        type: 'video',
        roomId: `consultation-video-${Date.now()}-5`,
        status: 'completed',
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 35 * 60000),
        duration: 35,
        diagnosis: 'General Health Checkup',
        doctorNotes: 'Overall good health. Vitamin D levels slightly low. Recommended supplements.',
        prescriptions: [
          { medicine: 'Vitamin D3', dosage: '60000 IU', frequency: 'Once weekly', duration: '8 weeks', instructions: 'Take with a fatty meal for better absorption' },
          { medicine: 'Calcium + Vitamin D', dosage: '500mg + 250IU', frequency: 'Once daily', duration: '30 days', instructions: 'Take after lunch' }
        ],
        messages: [
          { sender: patients[4]?._id, content: 'Doctor, I feel tired most of the time.', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
          { sender: doctorUser._id, content: 'Let us check your Vitamin D levels. Low Vitamin D can cause fatigue.', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 60000) }
        ]
      }
    ];

    // Filter out entries with missing required fields
    const validConsultations = consultationData.filter(c => c.appointment && c.patient);
    
    if (validConsultations.length > 0) {
      await Consultation.insertMany(validConsultations);
      console.log(`✅ Created ${validConsultations.length} consultations with prescriptions`);
    }

    // 3. Create notifications for patients too
    const patientNotifications = [];
    appointments.slice(0, 5).forEach(apt => {
      if (apt.patient?._id) {
        patientNotifications.push({
          recipient: apt.patient._id,
          sender: doctorUser._id,
          type: 'appointment_confirmed',
          title: '✅ Appointment Confirmed',
          message: `Your appointment on ${new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} has been confirmed by Dr. Rajesh Sharma.`,
          data: { appointmentId: apt._id }
        });
      }
    });

    if (patientNotifications.length > 0) {
      await Notification.insertMany(patientNotifications);
      console.log(`✅ Created ${patientNotifications.length} patient notifications`);
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
