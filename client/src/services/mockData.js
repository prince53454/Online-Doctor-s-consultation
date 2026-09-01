// Mock data for demo mode (no backend required)
// Used when the app is deployed as a static HF Space

const MOCK_USERS = {
  patient: {
    _id: 'mock_patient_001',
    id: 'mock_patient_001',
    name: 'Aarav Mehta',
    email: 'patient@mediconnect.com',
    role: 'patient',
    phone: '+919876543210',
    avatar: 'https://ui-avatars.com/api/?name=Aarav+Mehta&background=4F46E5&color=fff&size=200',
    gender: 'male',
    address: { city: 'Delhi', state: 'Delhi', country: 'India' },
  },
  doctor: {
    _id: 'mock_doctor_user_001',
    id: 'mock_doctor_user_001',
    name: 'Dr. Rajesh Sharma',
    email: 'dr.rajesh@mediconnect.com',
    role: 'doctor',
    phone: '+919876543211',
    avatar: 'https://ui-avatars.com/api/?name=Rajesh+Sharma&background=059669&color=fff&size=200',
    isApproved: true,
    doctorProfile: {
      _id: 'mock_doc_profile_001',
      specialization: 'Cardiologist',
      experience: 15,
      clinicName: 'Heart Care Center',
      isApproved: true,
      isFeatured: true,
      consultationFee: { inPerson: 800, video: 600, chat: 400 },
      rating: { average: 4.8, count: 156 },
      totalPatients: 1250,
      availability: [
        { day: 'Monday', slots: [
          { startTime: '09:00', endTime: '10:00', isAvailable: true },
          { startTime: '10:00', endTime: '11:00', isAvailable: true },
          { startTime: '11:00', endTime: '12:00', isAvailable: true },
          { startTime: '14:00', endTime: '15:00', isAvailable: true },
          { startTime: '15:00', endTime: '16:00', isAvailable: true },
          { startTime: '16:00', endTime: '17:00', isAvailable: true },
        ]},
        { day: 'Tuesday', slots: [
          { startTime: '09:00', endTime: '10:00', isAvailable: true },
          { startTime: '10:00', endTime: '11:00', isAvailable: true },
          { startTime: '11:00', endTime: '12:00', isAvailable: true },
        ]},
        { day: 'Wednesday', slots: [
          { startTime: '14:00', endTime: '15:00', isAvailable: true },
          { startTime: '15:00', endTime: '16:00', isAvailable: true },
        ]},
      ],
      languagesKnown: ['English', 'Hindi'],
      about: 'Senior cardiologist with expertise in interventional cardiology and heart failure management.',
      location: { city: 'Delhi', state: 'Delhi' },
      responseTime: '< 15 min',
    },
  },
  admin: {
    _id: 'mock_admin_001',
    id: 'mock_admin_001',
    name: 'Admin',
    email: 'admin@mediconnect.com',
    role: 'admin',
    phone: '+919999999999',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff&size=200',
  },
};

const MOCK_DOCTORS = [
  { _id: 'doc1', user: { name: 'Dr. Rajesh Sharma', avatar: 'https://ui-avatars.com/api/?name=Rajesh+Sharma&background=059669&color=fff', email: 'dr.rajesh@mediconnect.com' }, specialization: 'Cardiologist', experience: 15, clinicName: 'Heart Care Center', consultationFee: { inPerson: 800, video: 600, chat: 400 }, rating: { average: 4.8, count: 156 }, location: { city: 'Delhi' }, isApproved: true, isFeatured: true, totalPatients: 1250, about: 'Senior cardiologist with 15 years experience.', responseTime: '< 15 min', languagesKnown: ['English', 'Hindi'] },
  { _id: 'doc2', user: { name: 'Dr. Priya Patel', avatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=7C3AED&color=fff', email: 'dr.priya@mediconnect.com' }, specialization: 'Dermatologist', experience: 10, clinicName: 'Skin Wellness Clinic', consultationFee: { inPerson: 700, video: 500, chat: 300 }, rating: { average: 4.7, count: 89 }, location: { city: 'Mumbai' }, isApproved: true, isFeatured: true, totalPatients: 800, about: 'Board-certified dermatologist.', responseTime: '< 30 min', languagesKnown: ['English', 'Hindi'] },
  { _id: 'doc3', user: { name: 'Dr. Amit Kumar', avatar: 'https://ui-avatars.com/api/?name=Amit+Kumar&background=10B981&color=fff', email: 'dr.amit@mediconnect.com' }, specialization: 'Pediatrician', experience: 12, clinicName: 'Kids Health Clinic', consultationFee: { inPerson: 600, video: 400, chat: 250 }, rating: { average: 4.9, count: 203 }, location: { city: 'Bangalore' }, isApproved: true, isFeatured: true, totalPatients: 1500, about: 'Experienced pediatrician.', responseTime: '< 15 min', languagesKnown: ['English', 'Hindi', 'Kannada'] },
  { _id: 'doc4', user: { name: 'Dr. Sunita Reddy', avatar: 'https://ui-avatars.com/api/?name=Sunita+Reddy&background=EC4899&color=fff', email: 'dr.sunita@mediconnect.com' }, specialization: 'Gynecologist', experience: 18, clinicName: "Women's Health Center", consultationFee: { inPerson: 900, video: 700, chat: 500 }, rating: { average: 4.6, count: 134 }, location: { city: 'Hyderabad' }, isApproved: true, isFeatured: true, totalPatients: 950, about: 'Leading gynecologist.', responseTime: '< 30 min', languagesKnown: ['English', 'Hindi', 'Telugu'] },
  { _id: 'doc5', user: { name: 'Dr. Vikram Singh', avatar: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=F59E0B&color=fff', email: 'dr.vikram@mediconnect.com' }, specialization: 'Orthopedic Surgeon', experience: 20, clinicName: 'Bone & Joint Institute', consultationFee: { inPerson: 1000, video: 800, chat: 600 }, rating: { average: 4.5, count: 98 }, location: { city: 'Jaipur' }, isApproved: true, isFeatured: false, totalPatients: 700, about: 'Renowned orthopedic surgeon.', responseTime: '< 1 hour', languagesKnown: ['English', 'Hindi'] },
  { _id: 'doc6', user: { name: 'Dr. Meera Gupta', avatar: 'https://ui-avatars.com/api/?name=Meera+Gupta&background=8B5CF6&color=fff', email: 'dr.meera@mediconnect.com' }, specialization: 'Neurologist', experience: 14, clinicName: 'NeuroCare Center', consultationFee: { inPerson: 850, video: 650, chat: 450 }, rating: { average: 4.7, count: 112 }, location: { city: 'Pune' }, isApproved: true, isFeatured: true, totalPatients: 600, about: 'Expert neurologist.', responseTime: '< 30 min', languagesKnown: ['English', 'Hindi', 'Marathi'] },
  { _id: 'doc7', user: { name: 'Dr. Sanjay Mishra', avatar: 'https://ui-avatars.com/api/?name=Sanjay+Mishra&background=EF4444&color=fff', email: 'dr.sanjay@mediconnect.com' }, specialization: 'Psychiatrist', experience: 16, clinicName: 'Mind Wellness Clinic', consultationFee: { inPerson: 750, video: 550, chat: 350 }, rating: { average: 4.8, count: 87 }, location: { city: 'Delhi' }, isApproved: true, isFeatured: true, totalPatients: 450, about: 'Compassionate psychiatrist.', responseTime: '< 1 hour', languagesKnown: ['English', 'Hindi'] },
  { _id: 'doc8', user: { name: 'Dr. Ananya Das', avatar: 'https://ui-avatars.com/api/?name=Ananya+Das&background=06B6D4&color=fff', email: 'dr.ananya@mediconnect.com' }, specialization: 'General Physician', experience: 8, clinicName: 'Family Health Clinic', consultationFee: { inPerson: 500, video: 300, chat: 200 }, rating: { average: 4.4, count: 65 }, location: { city: 'Kolkata' }, isApproved: true, isFeatured: false, totalPatients: 320, about: 'Caring general physician.', responseTime: '< 15 min', languagesKnown: ['English', 'Hindi', 'Bengali'] },
];

const MOCK_APPOINTMENTS = [
  { _id: 'apt1', patient: MOCK_USERS.patient, doctor: MOCK_DOCTORS[0], appointmentType: 'video', date: new Date(Date.now() + 86400000).toISOString(), timeSlot: { startTime: '10:00', endTime: '11:00' }, status: 'confirmed', symptoms: 'Chest pain during exercise', payment: { amount: 600, status: 'completed', currency: 'INR' }, roomId: 'mock-room-001', createdAt: new Date().toISOString() },
  { _id: 'apt2', patient: MOCK_USERS.patient, doctor: MOCK_DOCTORS[1], appointmentType: 'chat', date: new Date(Date.now() + 172800000).toISOString(), timeSlot: { startTime: '14:00', endTime: '15:00' }, status: 'pending', symptoms: 'Skin rash on arms', payment: { amount: 300, status: 'pending', currency: 'INR' }, roomId: 'mock-room-002', createdAt: new Date().toISOString() },
  { _id: 'apt3', patient: MOCK_USERS.patient, doctor: MOCK_DOCTORS[2], appointmentType: 'in-person', date: new Date(Date.now() - 604800000).toISOString(), timeSlot: { startTime: '09:00', endTime: '10:00' }, status: 'completed', symptoms: 'Child has fever', payment: { amount: 600, status: 'completed', currency: 'INR' }, roomId: 'mock-room-003', consultation: { notes: 'Viral fever, rest advised', diagnosis: 'Viral Fever', prescription: [{ medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: '3 times daily', duration: '5 days', instructions: 'After meals' }] }, rating: { score: 5, review: 'Excellent doctor!' }, createdAt: new Date(Date.now() - 604800000).toISOString() },
  { _id: 'apt4', patient: MOCK_USERS.patient, doctor: MOCK_DOCTORS[3], appointmentType: 'video', date: new Date(Date.now() - 2592000000).toISOString(), timeSlot: { startTime: '11:00', endTime: '12:00' }, status: 'completed', symptoms: 'Regular checkup', payment: { amount: 700, status: 'completed', currency: 'INR' }, roomId: 'mock-room-004', rating: { score: 4, review: 'Good experience' }, createdAt: new Date(Date.now() - 2592000000).toISOString() },
];

const MOCK_NOTIFICATIONS = [
  { _id: 'n1', type: 'appointment_confirmed', title: 'Appointment Confirmed', message: 'Your video consultation with Dr. Rajesh Sharma has been confirmed for tomorrow at 10:00 AM.', read: false, createdAt: new Date().toISOString() },
  { _id: 'n2', type: 'payment_received', title: 'Payment Received', message: 'Payment of Rs.600 received for appointment with Dr. Rajesh Sharma.', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'n3', type: 'appointment_reminder', title: 'Appointment Reminder', message: 'You have an appointment with Dr. Priya Patel in 2 days.', read: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export function getMockUser(role) {
  return MOCK_USERS[role] || MOCK_USERS.patient;
}

export function getMockDoctors() {
  return MOCK_DOCTORS;
}

export function getMockAppointments(role) {
  if (role === 'doctor') {
    return MOCK_APPOINTMENTS.map(a => ({
      ...a,
      patient: MOCK_USERS.patient,
      doctor: MOCK_USERS.doctor.doctorProfile,
    }));
  }
  return MOCK_APPOINTMENTS;
}

export function getMockNotifications() {
  return MOCK_NOTIFICATIONS;
}

export function mockApiCall(data, delay = 300) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ data }), delay);
  });
}

// Check if backend is available
let _backendAvailable = null;
export async function isBackendAvailable() {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    _backendAvailable = res.ok;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

// Set to demo mode
export function setDemoMode() {
  localStorage.setItem('mediconnect_demo', 'true');
}

export function isDemoMode() {
  return localStorage.getItem('mediconnect_demo') === 'true';
}

export function clearDemoMode() {
  localStorage.removeItem('mediconnect_demo');
}
