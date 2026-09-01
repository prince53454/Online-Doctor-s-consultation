import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(null); // null = checking, true/false

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    // Optionally verify token validity
    setValid(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/reset-password', { token, password });
      toast.success('Password reset successful! 🎉');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Reset link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className="auth-page">
        <div className="page-loader"><div className="spinner" /></div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: 480 }}>
          <div className="auth-right" style={{ width: '100%' }}>
            <div className="auth-form-wrapper" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h1 style={{ fontSize: 24 }}>Invalid Reset Link</h1>
              <p className="auth-subtitle">This password reset link is invalid or has expired.</p>
              <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 16 }}>
                Request New Reset Link
              </Link>
              <div style={{ marginTop: 12 }}>
                <Link to="/login" className="btn btn-ghost">← Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 480 }}>
        <div className="auth-right" style={{ width: '100%' }}>
          <div className="auth-form-wrapper">
            <Link to="/login" className="auth-back">← Back to Login</Link>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
              <h1 style={{ fontSize: 24 }}>Reset Password</h1>
              <p className="auth-subtitle">Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <small style={{ color: '#ef4444', fontSize: 12 }}>Passwords don't match</small>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                {loading ? '⏳ Resetting...' : '🔑 Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
