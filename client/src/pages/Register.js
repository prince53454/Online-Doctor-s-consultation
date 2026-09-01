import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', gender: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (role === 'doctor') {
        // Doctor goes to the dedicated registration form
        navigate('/register/doctor');
        return;
      }

      const userData = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'patient',
        gender: formData.gender
      });
      toast.success('Account created successfully! Welcome to MediConnect 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Panel — Branding */}
        <div className="auth-left">
          <div className="auth-left-bg">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=1000&fit=crop"
              alt=""
              className="auth-bg-img"
            />
          </div>
          <div className="auth-left-content">
            <div className="auth-left-icon">
              <div className="auth-logo-circle">🌟</div>
            </div>
            <h2>Join MediConnect Today</h2>
            <p>Create your free account and get access to India's best healthcare professionals.</p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-check">✓</span>
                <span>Book Appointments Instantly</span>
              </div>
              <div className="auth-feature">
                <span className="feature-check">✓</span>
                <span>AI Health Recommendations</span>
              </div>
              <div className="auth-feature">
                <span className="feature-check">✓</span>
                <span>Consult via Video & Chat</span>
              </div>
              <div className="auth-feature">
                <span className="feature-check">✓</span>
                <span>Secure Medical Records</span>
              </div>
              <div className="auth-feature">
                <span className="feature-check">✓</span>
                <span>Online Pharmacy & Lab Tests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            <Link to="/" className="auth-back">← Back to Home</Link>

            <h1>Create Account</h1>
            <p className="auth-subtitle">Choose your role to get started</p>

            {/* Role Selection Cards */}
            <div className="role-cards-register">
              <button
                type="button"
                className={`role-card-register ${role === 'patient' ? 'active patient' : ''}`}
                onClick={() => setRole('patient')}
              >
                <span className="role-card-icon">🧑</span>
                <div>
                  <strong>I'm a Patient</strong>
                  <span>Find doctors, book appointments, manage health</span>
                </div>
              </button>
              <button
                type="button"
                className={`role-card-register ${role === 'doctor' ? 'active doctor' : ''}`}
                onClick={() => setRole('doctor')}
              >
                <span className="role-card-icon">👨‍⚕️</span>
                <div>
                  <strong>I'm a Doctor</strong>
                  <span>Join our network, accept patients, grow practice</span>
                </div>
              </button>
            </div>

            {/* Doctor Registration Redirect */}
            {role === 'doctor' && (
              <div className="doctor-register-cta">
                <div className="doctor-cta-icon">🩺</div>
                <h3>Doctor Registration</h3>
                <p>Fill in your credentials, clinic details, and availability in our 6-step verification form. After admin approval, you'll get full access to the Doctor Dashboard.</p>
                <div className="doctor-cta-steps">
                  <span>1. Personal Info</span>
                  <span>2. Credentials</span>
                  <span>3. Clinic</span>
                  <span>4. Fees</span>
                  <span>5. Schedule</span>
                  <span>6. Review</span>
                </div>
                <button
                  className="btn btn-doctor btn-lg btn-full"
                  onClick={() => navigate('/register/doctor')}
                >
                  👨‍⚕️ Start Doctor Registration →
                </button>
                <p className="doctor-cta-note">
                  ⏱️ Approval typically takes 24-48 hours. You'll be notified via email.
                </p>
              </div>
            )}

            {/* Patient Registration Form */}
            {role === 'patient' && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text" className="form-input" placeholder="e.g., Aarav Mehta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email" className="form-input" placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel" className="form-input" placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password" className="form-input" placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password" className="form-input" placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <label className="checkbox-label mb-2">
                  <input type="checkbox" required />
                  <span>I agree to the <span className="form-link">Terms of Service</span> and <span className="form-link">Privacy Policy</span></span>
                </label>

                <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                  {loading ? '⏳ Creating Account...' : '🧑 Create Patient Account'}
                </button>
              </form>
            )}

            <p className="auth-switch" style={{ marginTop: 16 }}>
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
