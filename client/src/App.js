import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorRegister from './pages/DoctorRegister';
import DoctorPendingApproval from './pages/DoctorPendingApproval';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import VideoCall from './pages/VideoCall';
import ChatConsultation from './pages/ChatConsultation';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDoctors from './pages/admin/Doctors';
import AdminAppointments from './pages/admin/Appointments';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import AdminRevenue from './pages/admin/Revenue';
import DoctorEarnings from './pages/DoctorEarnings';
import AISymptomChecker from './pages/AISymptomChecker';
import DoctorDashboard from './pages/DoctorDashboard';
import MedicalRecords from './pages/MedicalRecords';
import Labs from './pages/Labs';
import LabDetail from './pages/LabDetail';
import Pharmacy from './pages/Pharmacy';
import PharmacyCart from './pages/PharmacyCart';
import MyPharmacyOrders from './pages/MyPharmacyOrders';
import ChatHistory from './pages/ChatHistory';
import CallHistory from './pages/CallHistory';
import PatientDashboard from './pages/PatientDashboard';
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from './pages/StaticPages';
import EmergencySOS from './components/EmergencySOS';
import HealthMetrics from './pages/HealthMetrics';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

function AppRoutes() {
  return (
    <Routes>
      {/* ── Patient Frontend (direct access) ── */}
      <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
      <Route path="/dashboard" element={<><Navbar /><PatientDashboard /><Footer /></>} />
      <Route path="/doctors" element={<><Navbar /><Doctors /><Footer /></>} />
      <Route path="/doctors/:id" element={<><Navbar /><DoctorProfile /><Footer /></>} />
      <Route path="/book/:doctorId" element={<><Navbar /><BookAppointment /><Footer /></>} />
      <Route path="/appointments" element={<><Navbar /><MyAppointments /><Footer /></>} />
      <Route path="/video/:roomId" element={<VideoCall />} />
      <Route path="/chat/:roomId" element={<><Navbar /><ChatConsultation /><Footer /></>} />
      <Route path="/reports" element={<><Navbar /><Reports /><Footer /></>} />
      <Route path="/medical-records" element={<><Navbar /><MedicalRecords /><Footer /></>} />
      <Route path="/health-metrics" element={<><Navbar /><HealthMetrics /><Footer /></>} />
      <Route path="/profile" element={<><Navbar /><Profile /><Footer /></>} />
      <Route path="/labs" element={<><Navbar /><Labs /><Footer /></>} />
      <Route path="/labs/:id" element={<><Navbar /><LabDetail /><Footer /></>} />
      <Route path="/pharmacy" element={<><Navbar /><Pharmacy /><Footer /></>} />
      <Route path="/pharmacy/cart" element={<><Navbar /><PharmacyCart /><Footer /></>} />
      <Route path="/pharmacy/orders" element={<><Navbar /><MyPharmacyOrders /><Footer /></>} />
      <Route path="/pharmacy/:id" element={<><Navbar /><Pharmacy /><Footer /></>} />
      <Route path="/ai-checker" element={<><Navbar /><AISymptomChecker /><Footer /></>} />
      <Route path="/chat-history" element={<><Navbar /><ChatHistory /><Footer /></>} />
      <Route path="/call-history" element={<><Navbar /><CallHistory /><Footer /></>} />

      {/* ── Doctor Frontend (direct access) ── */}
      <Route path="/doctor/dashboard" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><DoctorDashboard /></div></div>} />
      <Route path="/doctor/appointments" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><MyAppointments /></div></div>} />
      <Route path="/doctor/patients" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><DoctorDashboard /></div></div>} />
      <Route path="/doctor/earnings" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><DoctorEarnings /></div></div>} />
      <Route path="/doctor/profile" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><Profile /></div></div>} />
      <Route path="/doctor/chat-history" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><ChatHistory /></div></div>} />
      <Route path="/doctor/call-history" element={<div style={{display:'flex'}}><DoctorNavbar /><div style={{marginLeft:260,flex:1,minHeight:'100vh'}}><CallHistory /></div></div>} />
      <Route path="/register/doctor" element={<DoctorRegister />} />
      <Route path="/doctor/pending" element={<DoctorPendingApproval />} />

      {/* ── Admin Dashboard (direct access) ── */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/doctors" element={<AdminDoctors />} />
      <Route path="/admin/appointments" element={<AdminAppointments />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/revenue" element={<AdminRevenue />} />

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
        <AppRoutes />
        </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}
