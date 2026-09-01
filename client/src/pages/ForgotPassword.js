import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (error) {
      // Show success even if user not found (security best practice)
      setSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 480 }}>
        <div className="auth-right" style={{ width: '100%' }}>
          <div className="auth-form-wrapper">
            <Link to="/login" className="auth-back">← Back to Login</Link>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <h1 style={{ fontSize: 24 }}>Forgot Password?</h1>
              <p className="auth-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  background: '#ECFDF5', borderRadius: 12, padding: 24,
                  marginBottom: 20, border: '1px solid #A7F3D0'
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                  <h3 style={{ marginBottom: 8, color: '#065F46' }}>Check Your Email</h3>
                  <p style={{ fontSize: 14, color: '#047857', lineHeight: 1.6 }}>
                    We've sent a password reset link to<br />
                    <strong>{email}</strong>
                  </p>
                  <p style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setSent(false); setEmail(''); }}
                  >
                    Try Another Email
                  </button>
                  <Link to="/login" className="btn btn-ghost">← Back to Login</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                  {loading ? '⏳ Sending Reset Link...' : '📧 Send Reset Link'}
                </button>

                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--gray-500)' }}>
                  Remember your password? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
