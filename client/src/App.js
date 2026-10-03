import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate as ReactRouterNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DoctorNavbar from './components/layout/DoctorNavbar';

// Pages
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const DoctorRegister = React.lazy(() => import('./pages/DoctorRegister'));
const DoctorPendingApproval = React.lazy(() => import('./pages/DoctorPendingApproval'));
const Doctors = React.lazy(() => import('./pages/Doctors'));
const DoctorProfile = React.lazy(() => import('./pages/DoctorProfile'));
const BookAppointment = React.lazy(() => import('./pages/BookAppointment'));
const MyAppointments = React.lazy(() => import('./pages/MyAppointments'));
const VideoCall = React.lazy(() => import('./pages/VideoCall'));
const ChatConsultation = React.lazy(() => import('./pages/ChatConsultation'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminDoctors = React.lazy(() => import('./pages/admin/Doctors'));
const AdminAppointments = React.lazy(() => import('./pages/admin/Appointments'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings'));
const AdminRevenue = React.lazy(() => import('./pages/admin/Revenue'));
const DoctorEarnings = React.lazy(() => import('./pages/DoctorEarnings'));
const AISymptomChecker = React.lazy(() => import('./pages/AISymptomChecker'));
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));
const MedicalRecords = React.lazy(() => import('./pages/MedicalRecords'));
const Labs = React.lazy(() => import('./pages/Labs'));
const LabDetail = React.lazy(() => import('./pages/LabDetail'));
const Pharmacy = React.lazy(() => import('./pages/Pharmacy'));
const PharmacyCart = React.lazy(() => import('./pages/PharmacyCart'));
const MyPharmacyOrders = React.lazy(() => import('./pages/MyPharmacyOrders'));
const ChatHistory = React.lazy(() => import('./pages/ChatHistory'));
const CallHistory = React.lazy(() => import('./pages/CallHistory'));
const PatientDashboard = React.lazy(() => import('./pages/PatientDashboard'));
const AboutPage = React.lazy(() => import('./pages/StaticPages').then((pages) => ({ default: pages.AboutPage })));
const ContactPage = React.lazy(() => import('./pages/StaticPages').then((pages) => ({ default: pages.ContactPage })));
const PrivacyPage = React.lazy(() => import('./pages/StaticPages').then((pages) => ({ default: pages.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/StaticPages').then((pages) => ({ default: pages.TermsPage })));
import EmergencySOS from './components/EmergencySOS';
import HealthMetrics from './pages/HealthMetrics';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  if (user.role === 'doctor' && !user.isApproved && location.pathname !== '/doctor/pending') {
    return <Navigate to="/doctor/pending" replace />;
  }
  return children;
}

function protectedElement(roles, element) {
  return <RequireAuth roles={roles}>{element}</RequireAuth>;
}

function PortalRedirect() {
  const { user, loading } = useAuth();
  const [redirected, setRedirected] = React.useState(false);
  const navigate = ReactRouterNavigate();
  React.useEffect(() => {
    if (loading || redirected) return;
    // Use HTML injection OR ?portal= query param
    const portal = window.__MEDICONNECT_PORTAL__ || new URLSearchParams(window.location.search).get('portal');
    if (!portal || portal !== 'doctor') return;
    const path = window.location.pathname;
    if (portal === 'doctor' && !path.startsWith('/doctor/')) {
      setRedirected(true);
      navigate('/doctor/dashboard');
    }
  }, [user, loading, redirected, navigate]);
  return null;
}

function AppRoutes() {
  return (
    <React.Suspense fallback={<div className="page-loader"><div className="spinner" /></div>}>
    <Routes>
      {/* ── Patient Frontend (direct access) ── */}
      <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
      <Route path="/dashboard" element={protectedElement(['patient'], <><Navbar /><PatientDashboard /><Footer /></>)} />
      <Route path="/doctors" element={<><Navbar /><Doctors /><Footer /></>} />
      <Route path="/doctors/:id" element={<><Navbar /><DoctorProfile /><Footer /></>} />
      <Route path="/book/:doctorId" element={protectedElement(['patient'], <><Navbar /><BookAppointment /><Footer /></>)} />
      <Route path="/appointments" element={protectedElement(['patient'], <><Navbar /><MyAppointments /><Footer /></>)} />
      <Route path="/video/:roomId" element={protectedElement(['patient', 'doctor'], <VideoCall />)} />
      <Route path="/chat/:roomId" element={protectedElement(['patient', 'doctor'], <><Navbar /><ChatConsultation /><Footer /></>)} />
      <Route path="/reports" element={protectedElement(['patient'], <><Navbar /><Reports /><Footer /></>)} />
      <Route path="/medical-records" element={protectedElement(['patient'], <><Navbar /><MedicalRecords /><Footer /></>)} />
      <Route path="/health-metrics" element={protectedElement(['patient'], <><Navbar /><HealthMetrics /><Footer /></>)} />
      <Route path="/profile" element={protectedElement(['patient', 'doctor'], <><Navbar /><Profile /><Footer /></>)} />
      <Route path="/labs" element={<><Navbar /><Labs /><Footer /></>} />
      <Route path="/labs/:id" element={<><Navbar /><LabDetail /><Footer /></>} />
      <Route path="/pharmacy" element={<><Navbar /><Pharmacy /><Footer /></>} />
      <Route path="/pharmacy/cart" element={protectedElement(['patient'], <><Navbar /><PharmacyCart /><Footer /></>)} />
      <Route path="/pharmacy/orders" element={protectedElement(['patient'], <><Navbar /><MyPharmacyOrders /><Footer /></>)} />
      <Route path="/pharmacy/:id" element={<><Navbar /><Pharmacy /><Footer /></>} />
      <Route path="/ai-checker" element={protectedElement(['patient'], <><Navbar /><AISymptomChecker /><Footer /></>)} />
      <Route path="/chat-history" element={protectedElement(['patient', 'doctor'], <><Navbar /><ChatHistory /><Footer /></>)} />
      <Route path="/call-history" element={protectedElement(['patient', 'doctor'], <><Navbar /><CallHistory /><Footer /></>)} />

      {/* ── Doctor Frontend (direct access) ── */}
      <Route path="/doctor/dashboard" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><DoctorDashboard /></div></div>)} />
      <Route path="/doctor/appointments" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><MyAppointments /></div></div>)} />
      <Route path="/doctor/patients" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><DoctorDashboard /></div></div>)} />
      <Route path="/doctor/earnings" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><DoctorEarnings /></div></div>)} />
      <Route path="/doctor/profile" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><Profile /></div></div>)} />
      <Route path="/doctor/chat-history" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><ChatHistory /></div></div>)} />
      <Route path="/doctor/call-history" element={protectedElement(['doctor'], <div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><CallHistory /></div></div>)} />
      <Route path="/register/doctor" element={<DoctorRegister />} />
      <Route path="/doctor/pending" element={protectedElement(['doctor'], <DoctorPendingApproval />)} />

      {/* ── Admin Dashboard (direct access) ── */}
      <Route path="/admin" element={protectedElement(['admin'], <AdminDashboard />)} />
      <Route path="/admin/doctors" element={protectedElement(['admin'], <AdminDoctors />)} />
      <Route path="/admin/appointments" element={protectedElement(['admin'], <AdminAppointments />)} />
      <Route path="/admin/users" element={protectedElement(['admin'], <AdminUsers />)} />
      <Route path="/admin/settings" element={protectedElement(['admin'], <AdminSettings />)} />
      <Route path="/admin/revenue" element={protectedElement(['admin'], <AdminRevenue />)} />

      {/* ── Auth Pages (login required for real flow) ── */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </React.Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <Router>
      <AuthProvider>
        <LanguageProvider>
        <NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif'
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } }
          }}
        />
        <EmergencySOS />
        <PortalRedirect />
        <AppRoutes />
        </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}
