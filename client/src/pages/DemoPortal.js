import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './DemoPortal.css';

const roles = [
  {
    id: 'patient',
    title: 'Patient Frontend',
    subtitle: 'Browse doctors, book appointments, AI symptom checker, video consultations',
    icon: '🏥',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    email: 'patient@mediconnect.com',
    password: 'patient123',
    features: [
      '🔍 Find & book doctors',
      '🤖 AI Symptom Checker',
      '📹 Video consultations',
      '💊 Medical records & prescriptions',
      '📅 Appointment history'
    ],
    redirect: '/'
  },
  {
    id: 'doctor',
    title: 'Doctor Dashboard',
    subtitle: 'Manage patients, appointments, schedule, earnings, and video calls',
    icon: '👨‍⚕️',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669, #10B981)',
    email: 'dr.rajesh@mediconnect.com',
    password: 'doctor123',
    features: [
      '📊 Patient management',
      '📅 Schedule & bookings',
      '💰 Earnings tracker',
      '💬 Messages & consultations',
      '📹 Video call controls'
    ],
    redirect: '/doctor/dashboard'
  },
];

export default function DemoPortal() {
  const [loadingId, setLoadingId] = useState(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (role) => {
    setLoadingId(role.id);
    try {
      await login(role.email, role.password);
      toast.success(`Logged in as ${role.title}!`);
      navigate(role.redirect);
    } catch (error) {
      toast.error('Login failed: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="demo-portal">
      <div className="demo-header">
        <div className="demo-logo">
          <span className="demo-logo-icon">+</span>
          <span className="demo-logo-text">Medi<span>Connect</span></span>
        </div>
        <h1>🚀 MediConnect Demo Portal</h1>
        <p className="demo-subtitle">
          Choose a role below to explore the platform. Each role has a completely different frontend with unique features.
        </p>
        {user && (
          <div className="demo-current-user">
            Currently logged in as: <strong>{user.name}</strong> ({user.role})
          </div>
        )}
        <div className="demo-tip">
          💡 <strong>Tip:</strong> Open each role in a separate <strong>Incognito/Private window</strong> to see all 3 dashboards simultaneously without session conflicts.
        </div>
      </div>

      <div className="demo-grid">
        {roles.map((role) => (
          <div key={role.id} className="demo-card" style={{ '--card-color': role.color, '--card-gradient': role.gradient }}>
            <div className="demo-card-header" style={{ background: role.gradient }}>
              <span className="demo-card-icon">{role.icon}</span>
              <h2>{role.title}</h2>
              <p>{role.subtitle}</p>
            </div>
            <div className="demo-card-body">
              <div className="demo-features">
                {role.features.map((f, i) => (
                  <div key={i} className="demo-feature">{f}</div>
                ))}
              </div>
              <div className="demo-credentials">
                <div className="demo-cred-row">
                  <span className="demo-cred-label">Email:</span>
                  <code>{role.email}</code>
                </div>
                <div className="demo-cred-row">
                  <span className="demo-cred-label">Password:</span>
                  <code>{role.password}</code>
                </div>
              </div>
              <button
                className="demo-login-btn"
                style={{ background: role.gradient }}
                onClick={() => handleQuickLogin(role)}
                disabled={loadingId === role.id}
              >
                {loadingId === role.id ? (
                  <span className="demo-loading">⏳ Logging in...</span>
                ) : (
                  <>🔓 Login as {role.id.charAt(0).toUpperCase() + role.id.slice(1)}</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-footer">
        <p>🏥 MediConnect — Online Doctor Appointment & Telemedicine Platform</p>
        <p>Built with React + Node.js + MongoDB + Socket.IO + WebRTC</p>
      </div>
    </div>
  );
}
