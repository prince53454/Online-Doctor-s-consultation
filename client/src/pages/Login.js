import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${userData.name}!`);

      if (userData.role === 'admin') {
        toast.error('Admin access is restricted to backend API');
        navigate('/login');
      } else if (userData.role === 'doctor' && userData.isApproved === false) {
        navigate('/doctor/pending');
      } else if (userData.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-bg">
            <img
              src={role === 'doctor'
                ? "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=1000&fit=crop"
                : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=1000&fit=crop"}
              alt=""
              className="auth-bg-img"
            />
          </div>
          <div className="auth-left-content">
            <div className="auth-left-icon">
              <div className="auth-logo-circle">
                {role === 'doctor' ? '👨‍⚕️' : '🏥'}
              </div>
            </div>
            <h2>
              {role === 'doctor'
                ? 'Welcome Back, Doctor'
                : 'Welcome Back to MediConnect'}
            </h2>
            <p>
              {role === 'doctor'
                ? 'Manage your patients, appointments, and practice from one dashboard.'
                : 'Access world-class healthcare from anywhere. Your trusted partner in health.'}
            </p>
            <div className="auth-features">
              {role === 'doctor' ? (
                <>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Manage Patient Appointments</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Video & Chat Consultations</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Real-time Booking Notifications</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Prescription & Records Management</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Earnings & Payment Tracking</span></div>
                </>
              ) : (
                <>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>500+ Verified Doctors</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>AI-Powered Symptom Check</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Secure Video Consultations</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Instant Appointments</span></div>
                  <div className="auth-feature"><span className="feature-check">✓</span><span>Online Pharmacy & Lab Tests</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrapper">
            <Link to="/" className="auth-back">← Back to Home</Link>

            <div className="role-tabs">
              <button
                className={`role-tab ${role === 'patient' ? 'active patient' : ''}`}
                onClick={() => { setRole('patient'); setFormData({ email: '', password: '' }); }}
              >🧑 I'm a Patient</button>
              <button
                className={`role-tab ${role === 'doctor' ? 'active doctor' : ''}`}
                onClick={() => { setRole('doctor'); setFormData({ email: '', password: '' }); }}
              >👨‍⚕️ I'm a Doctor</button>
            </div>

            <h1>Sign In</h1>
            <p className="auth-subtitle">
              {role === 'doctor'
                ? 'Access your doctor dashboard and manage your practice'
                : 'Find doctors, book appointments, and manage your health'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder={role === 'doctor' ? 'doctor@mediconnect.com' : 'you@example.com'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Link to="/forgot-password" className="form-link" style={{ fontSize: 13 }}>Forgot password?</Link>
              </div>

              <button
                type="submit"
                className={`btn btn-lg btn-full ${role === 'doctor' ? 'btn-doctor' : 'btn-primary'}`}
                disabled={loading}
              >
                {loading ? '⏳ Signing in...' : role === 'doctor' ? '👨‍⚕️ Sign In as Doctor' : '🧑 Sign In as Patient'}
              </button>
            </form>

            <p className="auth-switch" style={{ marginTop: 24 }}>
              {role === 'patient' ? (
                <>Don't have an account? <Link to="/register">Sign Up Free</Link></>
              ) : (
                <>New doctor? <Link to="/register/doctor">Register Your Practice</Link></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
