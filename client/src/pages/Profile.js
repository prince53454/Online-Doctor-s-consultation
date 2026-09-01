import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully! 🔒');
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        address: {
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: 'India'
        }
      });
      updateUser({ name: form.name, phone: form.phone });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page-content">
      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <img src={user.avatar} alt={user.name} className="profile-lg-avatar" />
            <div>
              <h1>{user.name}</h1>
              <p className="text-muted">{user.email}</p>
              <span className="badge badge-primary">{user.role}</span>
            </div>
            <div className="profile-header-actions">
              {!editing ? (
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
              ) : (
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-details">
            <h3>Personal Information</h3>
            <div className="details-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user.email} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP Code</label>
                <input className="form-input" value={form.zipCode} onChange={(e) => setForm({...form, zipCode: e.target.value})} disabled={!editing} />
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="profile-section">
            <h3>🔒 Security</h3>
            {!showChangePassword ? (
              <button className="btn btn-secondary" onClick={() => setShowChangePassword(true)}>Change Password</button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repeat new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleChangePassword} disabled={passwordLoading}>
                    {passwordLoading ? '⏳ Updating...' : '🔐 Update Password'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setShowChangePassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <h3>Account Actions</h3>
            <div className="account-actions">
              <button className="btn btn-ghost" onClick={logout}>🚪 Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
