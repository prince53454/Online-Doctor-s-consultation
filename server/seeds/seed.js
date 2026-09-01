const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Consultation = require('../models/Consultation');
const Settings = require('../models/Settings');
require('dotenv').config();

const CITIES = [
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Indore', state: 'Madhya Pradesh' },
];

const doctorsData = [
  // Cardiologists
  { name: 'Dr. Rajesh Sharma', email: 'dr.rajesh@mediconnect.com', specialization: 'Cardiologist', experience: 15, clinicName: 'Heart Care Center', city: 'Delhi', fee: { inPerson: 800, video: 600, chat: 400 }, about: 'Senior cardiologist with expertise in interventional cardiology and heart failure management. Fellow of the American College of Cardiology.', languages: ['English', 'Hindi'], featured: true },
  { name: 'Dr. Priya Venkatesh', email: 'dr.priya.v@mediconnect.com', specialization: 'Cardiologist', experience: 12, clinicName: 'Apollo Heart Centre', city: 'Chennai', fee: { inPerson: 900, video: 700, chat: 500 }, about: 'Cardiologist specializing in preventive cardiology and cardiac rehabilitation. Published over 20 research papers.', languages: ['English', 'Tamil', 'Hindi'], featured: true },
  { name: 'Dr. Suresh Patel', email: 'dr.suresh@mediconnect.com', specialization: 'Cardiologist', experience: 22, clinicName: 'Sterling Hospital', city: 'Ahmedabad', fee: { inPerson: 1000, video: 800, chat: 600 }, about: 'Renowned cardiologist with 22 years of experience in complex cardiac interventions and electrophysiology.', languages: ['English', 'Hindi', 'Gujarati'], featured: false },

  // Dermatologists
  { name: 'Dr. Priya Patel', email: 'dr.priya@mediconnect.com', specialization: 'Dermatologist', experience: 10, clinicName: 'Skin Wellness Clinic', city: 'Mumbai', fee: { inPerson: 700, video: 500, chat: 300 }, about: 'Board-certified dermatologist specializing in cosmetic dermatology, acne treatment, and skin cancer screening.', languages: ['English', 'Hindi', 'Gujarati'], featured: true },
  { name: 'Dr. Anjali Mehta', email: 'dr.anjali@mediconnect.com', specialization: 'Dermatologist', experience: 8, clinicName: 'DermaCare Clinic', city: 'Pune', fee: { inPerson: 600, video: 400, chat: 250 }, about: 'Expert in laser treatments, anti-aging procedures, and pediatric dermatology.', languages: ['English', 'Hindi', 'Marathi'], featured: false },

  // Pediatricians
  { name: 'Dr. Amit Kumar', email: 'dr.amit@mediconnect.com', specialization: 'Pediatrician', experience: 12, clinicName: 'Kids Health Clinic', city: 'Bangalore', fee: { inPerson: 600, video: 400, chat: 250 }, about: 'Experienced pediatrician with special interest in childhood development, vaccinations, and neonatal care.', languages: ['English', 'Hindi', 'Kannada'], featured: true },
  { name: 'Dr. Meena Iyer', email: 'dr.meena@mediconnect.com', specialization: 'Pediatrician', experience: 18, clinicName: 'Children\'s Hospital', city: 'Kochi', fee: { inPerson: 700, video: 500, chat: 300 }, about: 'Senior pediatrician with 18 years experience in pediatric emergencies and developmental pediatrics.', languages: ['English', 'Malayalam', 'Hindi'], featured: false },
  { name: 'Dr. Rakesh Gupta', email: 'dr.rakesh@mediconnect.com', specialization: 'Pediatrician', experience: 14, clinicName: 'Bal Swasthya Kendra', city: 'Lucknow', fee: { inPerson: 500, video: 350, chat: 200 }, about: 'Dedicated pediatrician focusing on child immunization, growth monitoring, and adolescent medicine.', languages: ['English', 'Hindi'], featured: false },

  // Gynecologists
  { name: 'Dr. Sunita Reddy', email: 'dr.sunita@mediconnect.com', specialization: 'Gynecologist', experience: 18, clinicName: 'Women\'s Health Center', city: 'Hyderabad', fee: { inPerson: 900, video: 700, chat: 500 }, about: 'Leading gynecologist with expertise in high-risk pregnancies, laparoscopic surgery, and fertility treatments.', languages: ['English', 'Hindi', 'Telugu'], featured: true },
  { name: 'Dr. Kavita Sharma', email: 'dr.kavita@mediconnect.com', specialization: 'Gynecologist', experience: 14, clinicName: 'Maa Clinic', city: 'Bhopal', fee: { inPerson: 600, video: 450, chat: 300 }, about: 'Experienced gynecologist specializing in prenatal care, normal deliveries, and gynecological cancers.', languages: ['English', 'Hindi'], featured: false },

  // Orthopedic Surgeons
  { name: 'Dr. Vikram Singh', email: 'dr.vikram@mediconnect.com', specialization: 'Orthopedic Surgeon', experience: 20, clinicName: 'Bone & Joint Institute', city: 'Jaipur', fee: { inPerson: 1000, video: 800, chat: 600 }, about: 'Renowned orthopedic surgeon with expertise in joint replacement, sports medicine, and arthroscopic surgery.', languages: ['English', 'Hindi', 'Rajasthani'], featured: true },
  { name: 'Dr. Arun Nair', email: 'dr.arun@mediconnect.com', specialization: 'Orthopedic Surgeon', experience: 16, clinicName: 'OrthoMed Hospital', city: 'Kochi', fee: { inPerson: 800, video: 600, chat: 400 }, about: 'Expert in spinal surgery, trauma management, and minimally invasive orthopedic procedures.', languages: ['English', 'Malayalam', 'Hindi'], featured: false },

  // Neurologists
  { name: 'Dr. Meera Gupta', email: 'dr.meera@mediconnect.com', specialization: 'Neurologist', experience: 14, clinicName: 'NeuroCare Center', city: 'Pune', fee: { inPerson: 850, video: 650, chat: 450 }, about: 'Expert neurologist specializing in epilepsy, stroke management, migraine treatment, and neurodegenerative disorders.', languages: ['English', 'Hindi', 'Marathi'], featured: true },
  { name: 'Dr. Saurabh Bose', email: 'dr.saurabh@mediconnect.com', specialization: 'Neurologist', experience: 11, clinicName: 'Brain & Spine Clinic', city: 'Kolkata', fee: { inPerson: 700, video: 500, chat: 350 }, about: 'Neurologist with focus on headache disorders, multiple sclerosis, and neuromuscular diseases.', languages: ['English', 'Hindi', 'Bengali'], featured: false },

  // Psychiatrists
  { name: 'Dr. Sanjay Mishra', email: 'dr.sanjay@mediconnect.com', specialization: 'Psychiatrist', experience: 16, clinicName: 'Mind Wellness Clinic', city: 'Delhi', fee: { inPerson: 750, video: 550, chat: 350 }, about: 'Compassionate psychiatrist specializing in anxiety disorders, depression, PTSD, and addiction medicine.', languages: ['English', 'Hindi'], featured: true },
  { name: 'Dr. Nandini Rao', email: 'dr.nandini@mediconnect.com', specialization: 'Psychiatrist', experience: 10, clinicName: 'Wellness Mind Centre', city: 'Bangalore', fee: { inPerson: 800, video: 600, chat: 400 }, about: 'Psychiatrist specializing in child and adolescent psychiatry, OCD, bipolar disorder, and cognitive behavioral therapy.', languages: ['English', 'Hindi', 'Kannada'], featured: false },

  // General Physicians
  { name: 'Dr. Ananya Das', email: 'dr.ananya@mediconnect.com', specialization: 'General Physician', experience: 8, clinicName: 'Family Health Clinic', city: 'Kolkata', fee: { inPerson: 500, video: 300, chat: 200 }, about: 'Caring general physician with focus on preventive medicine, family health, and chronic disease management.', languages: ['English', 'Hindi', 'Bengali'], featured: true },
  { name: 'Dr. Mohan Verma', email: 'dr.mohan@mediconnect.com', specialization: 'General Physician', experience: 25, clinicName: 'Verma Clinic', city: 'Patna', fee: { inPerson: 400, video: 250, chat: 150 }, about: 'Veteran general physician with 25 years of experience in rural and urban healthcare delivery.', languages: ['English', 'Hindi', 'Bhojpuri'], featured: false },

  // ENT Specialists
  { name: 'Dr. Rahul Verma', email: 'dr.rahul@mediconnect.com', specialization: 'ENT Specialist', experience: 11, clinicName: 'ENT & Allergy Center', city: 'Jaipur', fee: { inPerson: 600, video: 400, chat: 250 }, about: 'Skilled ENT specialist with expertise in sinus surgery, hearing disorders, and cochlear implants.', languages: ['English', 'Hindi', 'Rajasthani'], featured: false },
  { name: 'Dr. Fatima Sheikh', email: 'dr.fatima@mediconnect.com', specialization: 'ENT Specialist', experience: 9, clinicName: 'Ear Nose Throat Hospital', city: 'Mumbai', fee: { inPerson: 650, video: 450, chat: 300 }, about: 'ENT specialist with expertise in voice disorders, sleep apnea, and pediatric ENT conditions.', languages: ['English', 'Hindi', 'Urdu'], featured: false },

  // Endocrinologists
  { name: 'Dr. Kavita Nair', email: 'dr.kavita.n@mediconnect.com', specialization: 'Endocrinologist', experience: 13, clinicName: 'Diabetes & Thyroid Clinic', city: 'Mumbai', fee: { inPerson: 800, video: 600, chat: 400 }, about: 'Specialist in diabetes management, thyroid disorders, PCOS, and metabolic bone diseases.', languages: ['English', 'Hindi', 'Malayalam'], featured: true },
  { name: 'Dr. Deepak Joshi', email: 'dr.deepak@mediconnect.com', specialization: 'Endocrinologist', experience: 10, clinicName: 'Hormone Health Center', city: 'Indore', fee: { inPerson: 600, video: 450, chat: 300 }, about: 'Endocrinologist focusing on diabetes education, thyroid cancer, and adrenal disorders.', languages: ['English', 'Hindi'], featured: false },

  // Pulmonologists
  { name: 'Dr. Arjun Menon', email: 'dr.arjun@mediconnect.com', specialization: 'Pulmonologist', experience: 17, clinicName: 'Lung & Respiratory Center', city: 'Chennai', fee: { inPerson: 900, video: 700, chat: 500 }, about: 'Expert pulmonologist specializing in asthma, COPD, interventional pulmonology, and sleep medicine.', languages: ['English', 'Hindi', 'Tamil'], featured: true },

  // Ophthalmologists
  { name: 'Dr. Neha Agarwal', email: 'dr.neha@mediconnect.com', specialization: 'Ophthalmologist', experience: 9, clinicName: 'Eye Care Hospital', city: 'Lucknow', fee: { inPerson: 500, video: 300, chat: 200 }, about: 'Skilled ophthalmologist with expertise in cataract surgery, glaucoma management, and retinal disorders.', languages: ['English', 'Hindi'], featured: true },
  { name: 'Dr. Irfan Khan', email: 'dr.irfan@mediconnect.com', specialization: 'Ophthalmologist', experience: 15, clinicName: 'Vision Plus Eye Centre', city: 'Hyderabad', fee: { inPerson: 700, video: 500, chat: 350 }, about: 'Experienced ophthalmologist specializing in LASIK, corneal transplant, and diabetic eye disease.', languages: ['English', 'Hindi', 'Telugu', 'Urdu'], featured: false },

  // Urologists
  { name: 'Dr. Prakash Singh', email: 'dr.prakash@mediconnect.com', specialization: 'Urologist', experience: 19, clinicName: 'Urology Institute', city: 'Delhi', fee: { inPerson: 900, video: 700, chat: 500 }, about: 'Senior urologist with expertise in kidney stone treatment, prostate surgery, and robotic urology.', languages: ['English', 'Hindi'], featured: false },

  // Gastroenterologists
  { name: 'Dr. Leela Krishnamurthy', email: 'dr.leela@mediconnect.com', specialization: 'Gastroenterologist', experience: 13, clinicName: 'Digestive Health Clinic', city: 'Bangalore', fee: { inPerson: 750, video: 550, chat: 350 }, about: 'Gastroenterologist specializing in liver diseases, inflammatory bowel disease, and therapeutic endoscopy.', languages: ['English', 'Hindi', 'Kannada'], featured: false },
  { name: 'Dr. Amitabh Banerjee', email: 'dr.amitabh@mediconnect.com', specialization: 'Gastroenterologist', experience: 21, clinicName: 'Gastro Liver Centre', city: 'Kolkata', fee: { inPerson: 850, video: 650, chat: 450 }, about: 'Senior gastroenterologist with 21 years of experience in hepatology and advanced endoscopic procedures.', languages: ['English', 'Hindi', 'Bengali'], featured: true },

  // Oncologists
  { name: 'Dr. Rekha Sundaram', email: 'dr.rekha@mediconnect.com', specialization: 'Oncologist', experience: 16, clinicName: 'Cancer Care Hospital', city: 'Chennai', fee: { inPerson: 1100, video: 900, chat: 700 }, about: 'Medical oncologist specializing in breast cancer, lung cancer, and immunotherapy treatments.', languages: ['English', 'Hindi', 'Tamil'], featured: false },

  // Dentists
  { name: 'Dr. Shreya Jain', email: 'dr.shreya@mediconnect.com', specialization: 'Dentist', experience: 7, clinicName: 'Smile Dental Clinic', city: 'Ahmedabad', fee: { inPerson: 400, video: 250, chat: 150 }, about: 'Cosmetic dentist specializing in smile makeovers, dental implants, and orthodontics.', languages: ['English', 'Hindi', 'Gujarati'], featured: false },
  { name: 'Dr. Varun Malhotra', email: 'dr.varun@mediconnect.com', specialization: 'Dentist', experience: 12, clinicName: 'Perfect Smile Dental', city: 'Chandigarh', fee: { inPerson: 500, video: 300, chat: 200 }, about: 'Experienced dental surgeon with expertise in implantology, root canal treatments, and pediatric dentistry.', languages: ['English', 'Hindi', 'Punjabi'], featured: false },
];

function generateAvailability() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.map(day => ({
    day,
    slots: [
      { startTime: '09:00', endTime: '10:00', isAvailable: true, maxPatients: 1 },
      { startTime: '10:00', endTime: '11:00', isAvailable: true, maxPatients: 1 },
      { startTime: '11:00', endTime: '12:00', isAvailable: true, maxPatients: 1 },
      { startTime: '14:00', endTime: '15:00', isAvailable: true, maxPatients: 1 },
      { startTime: '15:00', endTime: '16:00', isAvailable: true, maxPatients: 1 },
      { startTime: '16:00', endTime: '17:00', isAvailable: true, maxPatients: 1 },
    ]
  }));
}

const patientNames = [
  { name: 'Aarav Mehta', email: 'patient@mediconnect.com', gender: 'male' },
  { name: 'Sneha Reddy', email: 'sneha@test.com', gender: 'female' },
  { name: 'Vikram Patel', email: 'vikram@test.com', gender: 'male' },
  { name: 'Ananya Singh', email: 'ananya@test.com', gender: 'female' },
  { name: 'Rohit Sharma', email: 'rohit@test.com', gender: 'male' },
  { name: 'Pooja Nair', email: 'pooja@test.com', gender: 'female' },
  { name: 'Karan Joshi', email: 'karan@test.com', gender: 'male' },
  { name: 'Divya Kapoor', email: 'divya@test.com', gender: 'female' },
  { name: 'Sahil Khan', email: 'sahil@test.com', gender: 'male' },
  { name: 'Riya Gupta', email: 'riya@test.com', gender: 'female' },
  { name: 'Manish Tiwari', email: 'manish@test.com', gender: 'male' },
  { name: 'Nisha Agarwal', email: 'nisha@test.com', gender: 'female' },
  { name: 'Aditya Rao', email: 'aditya@test.com', gender: 'male' },
  { name: 'Swati Deshmukh', email: 'swati@test.com', gender: 'female' },
  { name: 'Tarun Bhatia', email: 'tarun@test.com', gender: 'male' },
];

const symptoms = [
  'Persistent headache for 3 days with nausea',
  'Chest pain and shortness of breath during exertion',
  'Skin rash on arms and legs, itching for a week',
  'Child has fever 102F for 2 days, refusing food',
  'Lower back pain radiating to left leg',
  'Difficulty sleeping, feeling anxious and depressed',
  'Severe stomach pain after meals, bloating',
  'Blurred vision in left eye, seeing floaters',
  'Persistent cough with mucus for 2 weeks',
  'Joint pain in knees, especially in the morning',
  'Weight gain, fatigue, feeling cold frequently',
  'Toothache on right side, sensitivity to hot/cold',
  'Frequent urination, excessive thirst',
  'Ear pain and reduced hearing in right ear',
  'Hair loss and acne breakout on face',
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_pro');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({}),
      Review.deleteMany({}),
      Consultation.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@mediconnect.com',
      password: 'admin123',
      role: 'admin',
      phone: '+919999999999',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff&size=200'
    });
    console.log('✅ Admin: admin@mediconnect.com / admin123');

    // Create patients
    const patientUsers = [];
    for (const pData of patientNames) {
      const user = await User.create({
        name: pData.name,
        email: pData.email,
        password: 'patient123',
        role: 'patient',
        phone: '+91' + Math.floor(7000000000 + Math.random() * 3000000000),
        gender: pData.gender,
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
        address: {
          street: Math.floor(1 + Math.random() * 500) + ' MG Road',
          city: CITIES[Math.floor(Math.random() * CITIES.length)].city,
          state: 'India',
          country: 'India'
        },
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(pData.name)}&background=4F46E5&color=fff&size=200`
      });
      patientUsers.push(user);
    }
    console.log(`✅ Created ${patientUsers.length} patients`);

    // Create doctors
    const doctorProfiles = [];
    for (const docData of doctorsData) {
      const cityInfo = CITIES.find(c => c.city === docData.city) || CITIES[0];
      const user = await User.create({
        name: docData.name,
        email: docData.email,
        password: 'doctor123',
        role: 'doctor',
        phone: '+91' + Math.floor(7000000000 + Math.random() * 3000000000),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(docData.name)}&background=059669&color=fff&size=200`
      });

      const doctor = await Doctor.create({
        user: user._id,
        specialization: docData.specialization,
        experience: docData.experience,
        licenseNumber: 'MCI-' + Math.floor(10000 + Math.random() * 90000),
        consultationFee: docData.fee,
        location: {
          type: 'Point',
          coordinates: [77.2 + Math.random() * 10, 28.5 + Math.random() * 5],
          city: docData.city,
          state: cityInfo.state,
          country: 'India'
        },
        clinicName: docData.clinicName,
        clinicAddress: `${Math.floor(1 + Math.random() * 200)} Medical Road, ${docData.city}`,
        availability: generateAvailability(),
        languagesKnown: docData.languages,
        about: docData.about,
        isApproved: true,
        isFeatured: docData.featured,
        isOnline: Math.random() > 0.4,
        rating: {
          average: +(3.5 + Math.random() * 1.5).toFixed(1),
          count: Math.floor(Math.random() * 200) + 10
        },
        totalPatients: Math.floor(Math.random() * 1500) + 50,
        tags: [docData.specialization.toLowerCase(), docData.city.toLowerCase(), 'top rated', 'verified'],
        responseTime: ['< 15 min', '< 30 min', '< 1 hour', '< 2 hours'][Math.floor(Math.random() * 4)]
      });
      doctorProfiles.push(doctor);
    }
    console.log(`✅ Created ${doctorProfiles.length} doctors`);

    // Create sample appointments
    const statuses = ['pending', 'confirmed', 'completed', 'completed', 'completed', 'cancelled'];
    const types = ['in-person', 'video', 'chat'];
    const now = new Date();
    let appointmentCount = 0;

    for (let i = 0; i < 40; i++) {
      const patient = patientUsers[Math.floor(Math.random() * patientUsers.length)];
      const doctor = doctorProfiles[Math.floor(Math.random() * doctorProfiles.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const daysOffset = Math.floor(Math.random() * 30) - 10;
      const aptDate = new Date(now);
      aptDate.setDate(aptDate.getDate() + daysOffset);
      aptDate.setHours(0, 0, 0, 0);

      const slotHours = [9, 10, 11, 14, 15, 16];
      const hour = slotHours[Math.floor(Math.random() * slotHours.length)];

      let fee;
      if (type === 'in-person') fee = doctor.consultationFee?.inPerson || 500;
      else if (type === 'video') fee = doctor.consultationFee?.video || 400;
      else fee = doctor.consultationFee?.chat || 250;

      const appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        appointmentType: type,
        date: aptDate,
        timeSlot: { startTime: `${hour.toString().padStart(2, '0')}:00`, endTime: `${(hour + 1).toString().padStart(2, '0')}:00` },
        status,
        symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
        medicalHistory: 'No significant medical history',
        roomId: require('uuid').v4(),
        isAIBooking: Math.random() > 0.8,
        payment: {
          amount: fee,
          currency: 'INR',
          status: status === 'cancelled' ? 'refunded' : (status === 'completed' || status === 'confirmed') ? 'completed' : 'pending',
          stripePaymentId: (status === 'completed' || status === 'confirmed') ? 'mock_' + Date.now() + '_' + i : undefined,
          paidAt: (status === 'completed' || status === 'confirmed') ? new Date() : undefined
        },
        consultation: status === 'completed' ? {
          notes: 'Patient responded well to treatment. Follow up in 2 weeks.',
          diagnosis: 'Common condition - treated successfully',
          prescription: [
            { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: '3 times daily', duration: '5 days', instructions: 'After meals' },
            { medicine: 'Vitamin C 1000mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning' }
          ],
          followUpDate: new Date(aptDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        } : undefined,
        rating: status === 'completed' && Math.random() > 0.4 ? {
          score: Math.floor(3 + Math.random() * 3),
          review: ['Great doctor, very helpful!', 'Good experience overall.', 'Recommended!', 'Professional and caring.', 'Very knowledgeable.'][Math.floor(Math.random() * 5)],
          reviewedAt: new Date()
        } : undefined
      });
      appointmentCount++;
    }
    console.log(`✅ Created ${appointmentCount} appointments`);

    // Create reviews for some doctors
    const reviewTexts = [
      'Excellent doctor! Very thorough examination and clear explanations. Highly recommended.',
      'Very professional and caring. Took time to listen to all my concerns.',
      'Good experience. The doctor was knowledgeable and prescribed effective treatment.',
      'Amazing experience. Felt very comfortable and well cared for.',
      'Very patient and understanding. Explained everything in simple language.',
      'Top-notch medical care. The clinic was clean and well-maintained.',
      'Would definitely recommend. Quick diagnosis and effective treatment plan.',
      'One of the best doctors I have visited. Very empathetic and skilled.',
    ];

    let reviewCount = 0;
    for (const doctor of doctorProfiles) {
      const numReviews = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numReviews; i++) {
        const patient = patientUsers[Math.floor(Math.random() * patientUsers.length)];
        const aptForReview = await Appointment.findOne({ doctor: doctor._id, patient: patient._id, status: 'completed' });
        if (!aptForReview) continue;
        await Review.create({
          doctor: doctor._id,
          patient: patient._id,
          appointment: aptForReview._id,
          rating: Math.floor(3 + Math.random() * 3),
          review: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        });
        reviewCount++;
      }
    }
    console.log(`✅ Created ${reviewCount} reviews`);

    // Create settings
    await Settings.getSettings();
    console.log('✅ Created default settings');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ Admin:    admin@mediconnect.com    / admin123  │');
    console.log('│ Patient:  patient@mediconnect.com  / patient123│');
    console.log('│ Doctors:  [any doctor email]       / doctor123 │');
    console.log('│ All 15 test patients: [email]      / patient123│');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`\n📊 Summary:`);
    console.log(`   ${doctorProfiles.length} doctors across ${new Set(doctorsData.map(d => d.city)).size} cities`);
    console.log(`   ${patientUsers.length} patients`);
    console.log(`   ${appointmentCount} appointments`);
    console.log(`   ${reviewCount} reviews`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
