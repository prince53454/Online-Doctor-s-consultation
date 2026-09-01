import axios from 'axios';
import { getMockUser, getMockDoctors, getMockAppointments, getMockNotifications, isBackendAvailable } from './mockData';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock API responses when backend is unavailable
function getMockResponse(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  // Detect portal from localStorage (set by injected index.html)
  const portal = localStorage.getItem('mediconnect_portal') || 'patient';
  const user = getMockUser(portal);
  const doctorUser = getMockUser('doctor');
  const adminUser = getMockUser('admin');

  // Auth endpoints
  if (url.includes('/auth/login') && method === 'post') {
    const body = JSON.parse(config.data || '{}');
    const role = body.email?.includes('admin') ? 'admin' : body.email?.includes('doctor') ? 'doctor' : 'patient';
    const u = getMockUser(role);
    return { data: { success: true, token: 'mock_token_' + role, user: u, doctorProfile: u.doctorProfile || null } };
  }
  if (url.includes('/auth/register') && method === 'post') {
    return { data: { success: true, token: 'mock_token_new', user } };
  }
  if (url.includes('/auth/me')) {
    // Use portal flag from localStorage, not URL path
    let u = user;
    if (portal === 'doctor') u = doctorUser;
    else if (portal === 'admin') u = adminUser;
    return { data: { success: true, user: u, doctorProfile: u.doctorProfile || null } };
  }
  if (url.includes('/auth/change-password')) {
    return { data: { success: true, message: 'Password changed (demo)' } };
  }
  if (url.includes('/auth/forgot-password')) {
    return { data: { success: true } };
  }
  if (url.includes('/auth/profile') && method === 'put') {
    return { data: { success: true, user } };
  }

  // Doctor endpoints
  if (url.includes('/doctors') && !url.includes('/admin') && method === 'get') {
    return { data: { success: true, doctors: getMockDoctors(), pagination: { page: 1, limit: 12, total: 8, pages: 1 } } };
  }
  if (url.match(/\/doctors\/[a-z0-9]+/) && !url.includes('/admin') && !url.includes('/availability')) {
    return { data: { success: true, doctor: getMockDoctors()[0], reviews: [] } };
  }
  if (url.includes('/availability')) {
    const doctor = getMockDoctors()[0];
    return { data: { success: true, availability: doctor.availability || [{ day: 'Monday', slots: [{ startTime: '09:00', endTime: '10:00', isAvailable: true }, { startTime: '10:00', endTime: '11:00', isAvailable: true }] }] } };
  }
  if (url.includes('/doctors/specializations')) {
    return { data: { success: true, specializations: ['Cardiologist', 'Dermatologist', 'Pediatrician', 'Gynecologist', 'Orthopedic Surgeon', 'Neurologist', 'Psychiatrist', 'General Physician'] } };
  }
  if (url.includes('/doctors/featured')) {
    return { data: { success: true, doctors: getMockDoctors().filter(d => d.isFeatured) } };
  }

  // Appointment endpoints
  if (url.includes('/appointments') && method === 'get') {
    return { data: { success: true, appointments: getMockAppointments(portal), pagination: { page: 1, limit: 10, total: 4, pages: 1 } } };
  }
  if (url.includes('/appointments') && method === 'post') {
    return { data: { success: true, appointment: { _id: 'mock_apt_new', ...getMockAppointments('patient')[0], status: 'pending', payment: { amount: 600, status: 'pending' } } } };
  }
  if (url.includes('/appointments') && url.includes('/status') && method === 'put') {
    return { data: { success: true, appointment: { ...getMockAppointments('patient')[0], status: 'confirmed' } } };
  }
  if (url.includes('/appointments') && url.includes('/rate') && method === 'post') {
    return { data: { success: true, appointment: { ...getMockAppointments('patient')[0], rating: { score: 5 } } } };
  }
  if (url.includes('/appointments') && url.includes('/consultation') && method === 'put') {
    return { data: { success: true, appointment: getMockAppointments('patient')[0] } };
  }

  // Consultation endpoints
  if (url.includes('/consultations/my-history')) {
    return { data: { success: true, consultations: [
      { _id: 'c1', roomId: 'mock-room-001', type: 'video', status: 'completed', duration: 25, patient: user, doctor: { user: { name: 'Dr. Rajesh Sharma' } }, messages: [{ content: 'Hello, how can I help you?', sender: 'doc1' }], createdAt: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'c2', roomId: 'mock-room-002', type: 'chat', status: 'completed', duration: 15, patient: user, doctor: { user: { name: 'Dr. Priya Patel' } }, messages: [{ content: 'Your skin rash seems like eczema', sender: 'doc2' }], createdAt: new Date(Date.now() - 172800000).toISOString() },
    ] } };
  }
  if (url.includes('/consultations/') && url.includes('/messages')) {
    return { data: { success: true, messages: [
      { sender: 'doc1', senderName: 'Dr. Rajesh', content: 'Hello! How are you feeling today?', timestamp: new Date(Date.now() - 600000).toISOString() },
      { sender: user._id, senderName: user.name, content: 'I have been having chest pain during exercise.', timestamp: new Date(Date.now() - 540000).toISOString() },
      { sender: 'doc1', senderName: 'Dr. Rajesh', content: 'I see. Can you describe the pain? Is it sharp or dull?', timestamp: new Date(Date.now() - 480000).toISOString() },
      { sender: user._id, senderName: user.name, content: 'It is a sharp pain on the left side, lasting about 5 minutes.', timestamp: new Date(Date.now() - 420000).toISOString() },
      { sender: 'doc1', senderName: 'Dr. Rajesh', content: 'I recommend we do an ECG and some blood tests. Let me write a prescription.', timestamp: new Date(Date.now() - 360000).toISOString() },
    ] } };
  }
  if (url.includes('/consultations/') && !url.includes('/messages') && method === 'get') {
    return { data: { success: true, consultation: { _id: 'c1', roomId: 'mock-room-001', type: 'video', status: 'in-progress', patient: user, doctor: { user: { name: 'Dr. Rajesh Sharma' } }, messages: [] }, videoConfig: { isConfigured: false } } };
  }
  if (url.includes('/consultations') && url.includes('/start') && method === 'put') {
    return { data: { success: true } };
  }
  if (url.includes('/consultations') && url.includes('/end') && method === 'put') {
    return { data: { success: true } };
  }
  if (url.includes('/consultations') && url.includes('/message') && method === 'post') {
    return { data: { success: true, message: { sender: user._id, content: 'sent', timestamp: new Date().toISOString() } } };
  }

  // Notification endpoints
  if (url.includes('/notifications')) {
    return { data: { success: true, notifications: getMockNotifications(), unreadCount: 2, pagination: { page: 1, limit: 5, total: 3, pages: 1 } } };
  }

  // Admin endpoints
  if (url.includes('/admin/dashboard')) {
    return { data: { success: true, stats: { totalDoctors: 28, totalPatients: 15, totalAppointments: 42, totalRevenue: 125000, pendingApprovals: 2, activeAppointments: 8, completedAppointments: 30, todayAppointments: 5 }, recentAppointments: getMockAppointments('admin').slice(0, 5), monthlyStats: [], specDistribution: [{ _id: 'Cardiologist', count: 3 }, { _id: 'Pediatrician', count: 3 }, { _id: 'Dermatologist', count: 2 }] } };
  }
  if (url.includes('/admin/doctors') && method === 'get') {
    return { data: { success: true, doctors: getMockDoctors(), pagination: { page: 1, limit: 20, total: 8, pages: 1 } } };
  }
  if (url.includes('/admin/doctors/pending')) {
    return { data: { success: true, doctors: [] } };
  }
  if (url.includes('/admin/appointments')) {
    return { data: { success: true, appointments: getMockAppointments('admin'), pagination: { page: 1, limit: 20, total: 4, pages: 1 } } };
  }
  if (url.includes('/admin/users')) {
    return { data: { success: true, users: [user, doctorUser, adminUser], pagination: { page: 1, limit: 20, total: 3, pages: 1 } } };
  }
  if (url.includes('/admin/settings') && method === 'get') {
    return { data: { success: true, settings: { general: { siteName: 'MediConnect Pro', siteTagline: 'Your Health, Our Priority' }, payments: { currency: 'INR', platformFeeEnabled: false }, appearance: { primaryColor: '#4F46E5' } } } };
  }
  if (url.includes('/admin/settings') && method === 'put') {
    return { data: { success: true, message: 'Settings saved (demo)' } };
  }

  // Revenue endpoints
  if (url.includes('/revenue/admin/dashboard')) {
    return { data: { success: true, currentMonth: { totalCollected: 45000, totalPlatformFee: 4500, totalDoctorPayout: 40500, totalAppointments: 12, totalRefunds: 0 }, yearData: { totalCollected: 125000, totalPlatformFee: 12500, totalDoctorPayout: 112500, totalAppointments: 42 }, revenueGrowth: 15.2, appointmentGrowth: 8.5, recentTransactions: [], pendingPayouts: [], topDoctors: [], monthlyTrend: [{ month: 'Apr', platformFee: 2000, doctorPayout: 18000, totalCollected: 20000, appointments: 6 }, { month: 'May', platformFee: 2500, doctorPayout: 22500, totalCollected: 25000, appointments: 8 }, { month: 'Jun', platformFee: 3000, doctorPayout: 27000, totalCollected: 30000, appointments: 10 }, { month: 'Jul', platformFee: 3500, doctorPayout: 31500, totalCollected: 35000, appointments: 11 }, { month: 'Aug', platformFee: 4000, doctorPayout: 36000, totalCollected: 40000, appointments: 12 }, { month: 'Sep', platformFee: 4500, doctorPayout: 40500, totalCollected: 45000, appointments: 12 }] } };
  }
  if (url.includes('/revenue/doctor/earnings')) {
    return { data: { success: true, earnings: { totalEarned: 28500, totalPaid: 15000, pendingBalance: 13500, totalAppointments: 35, averagePerAppointment: 814, lastEarningAt: new Date().toISOString() }, transactions: [], recentPayouts: [], monthlyData: [{ month: 'Apr', earned: 4000, appointments: 5 }, { month: 'May', earned: 5000, appointments: 6 }, { month: 'Jun', earned: 6000, appointments: 7 }, { month: 'Jul', earned: 4500, appointments: 5 }, { month: 'Aug', earned: 5500, appointments: 6 }, { month: 'Sep', earned: 3500, appointments: 6 }], todayEarned: 1200, todayAppointments: 2, weekEarned: 4800, weekAppointments: 6 } };
  }

  // Medical records
  if (url.includes('/medical-records')) {
    return { data: { success: true, appointments: getMockAppointments('patient'), consultations: [], prescriptions: [
      { medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: '3 times daily', duration: '5 days', instructions: 'After meals', doctor: { name: 'Dr. Rajesh Sharma', specialization: 'Cardiologist' }, date: new Date(Date.now() - 604800000).toISOString() },
      { medicine: 'Vitamin C 1000mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning', doctor: { name: 'Dr. Priya Patel', specialization: 'Dermatologist' }, date: new Date(Date.now() - 2592000000).toISOString() },
    ], timeline: [
      { type: 'appointment', date: new Date(Date.now() - 604800000).toISOString(), title: 'In-Person Consultation', doctor: 'Dr. Rajesh Sharma', specialization: 'Cardiologist', status: 'completed' },
      { type: 'prescription', date: new Date(Date.now() - 604800000).toISOString(), title: 'Prescription from Dr. Rajesh Sharma', doctor: 'Dr. Rajesh Sharma', data: { medicine: 'Paracetamol 500mg' } },
      { type: 'appointment', date: new Date(Date.now() - 2592000000).toISOString(), title: 'Video Consultation', doctor: 'Dr. Priya Patel', specialization: 'Dermatologist', status: 'completed' },
    ], summary: { totalAppointments: 4, completedAppointments: 2, totalPrescriptions: 2, totalSpent: 2200, uniqueDoctorsConsulted: 3 }, pagination: { page: 1, limit: 20, total: 4, pages: 1 } } };
  }

  // Payment config
  if (url.includes('/payments/config')) {
    return { data: { success: true, razorpay: { configured: false, keyId: null }, stripe: { configured: false } } };
  }

  // Settings public
  if (url.includes('/settings') && !url.includes('/admin')) {
    return { data: { success: true, settings: { general: { siteName: 'MediConnect Pro' }, appearance: { primaryColor: '#4F46E5' } } } };
  }

  // Health check
  if (url.includes('/health')) {
    return { data: { status: 'OK (Demo Mode)', timestamp: new Date().toISOString() } };
  }

  // Labs, pharmacy - return empty but valid
  if (url.includes('/labs')) {
    return { data: { success: true, labs: [] } };
  }
  if (url.includes('/pharmacy')) {
    return { data: { success: true, medicines: [], pharmacies: [] } };
  }

  // Default fallback
  return { data: { success: true, message: 'Demo mode - no backend' } };
}

// Response interceptor with mock fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isOnLoginPage = window.location.pathname === '/login';
    const isOnPreviewPage = [
      '/admin', '/doctor/', '/login', '/register', '/forgot-password'
    ].some(p => window.location.pathname.startsWith(p));

    if (error.response?.status === 401 && !isOnPreviewPage && !isOnLoginPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // If network error or backend down, try mock response
    if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      try {
        const mockResponse = getMockResponse(error.config);
        return mockResponse;
      } catch (e) {
        // Mock also failed
      }
    }

    return Promise.reject(error);
  }
);

export default api;
