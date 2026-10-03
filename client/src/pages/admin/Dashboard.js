import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import './Admin.css';

export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading) fetchDashboard();
  }, [authLoading, fetchDashboard]);
  useEffect(() => {
    if (!authLoading && notifications[0]?._id) fetchDashboard();
  }, [authLoading, fetchDashboard, notifications[0]?._id]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const s = stats?.stats || {};

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-mark" aria-hidden="true">+</span>
          <div><h2>MediConnect</h2><span className="admin-logo-caption">PLATFORM ADMIN</span></div>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item active">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <img src={user?.avatar} alt="" />
            <span>{user?.name}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header admin-header-overview">
          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=200&fit=crop" alt="" className="admin-header-bg" />
          <div className="admin-header-copy">
            <span className="admin-eyebrow">PLATFORM OPERATIONS</span>
            <h1>Operations overview</h1>
            <p>Good to see you, {user?.name}. Here’s the latest across your care network.</p>
          </div>
          <div className="admin-live-status"><span /> Current snapshot</div>
        </div>

        {/* Stats Grid */}
        <div className="stats-cards-grid">
          <div className="stat-card">
            <div className="stat-card-icon blue">👨‍⚕️</div>
            <div>
              <div className="stat-card-value">{s.totalDoctors || 0}</div>
              <div className="stat-card-label">Total Doctors</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green">👥</div>
            <div>
              <div className="stat-card-value">{s.totalPatients || 0}</div>
              <div className="stat-card-label">Total Patients</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon yellow">📅</div>
            <div>
              <div className="stat-card-value">{s.totalAppointments || 0}</div>
              <div className="stat-card-label">Total Appointments</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon purple">💰</div>
            <div>
              <div className="stat-card-value">₹{(s.totalRevenue || 0).toLocaleString()}</div>
              <div className="stat-card-label">Total Revenue</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="stats-cards-grid">
          <div className="stat-card-sm">
            <span className="stat-sm-icon">⏳</span>
            <div>
              <div className="stat-sm-value">{s.pendingApprovals || 0}</div>
              <div className="stat-sm-label">Pending Approvals</div>
            </div>
          </div>
          <div className="stat-card-sm">
            <span className="stat-sm-icon">✅</span>
            <div>
              <div className="stat-sm-value">{s.activeAppointments || 0}</div>
              <div className="stat-sm-label">Active Appointments</div>
            </div>
          </div>
          <div className="stat-card-sm">
            <span className="stat-sm-icon">🏁</span>
            <div>
              <div className="stat-sm-value">{s.completedAppointments || 0}</div>
              <div className="stat-sm-label">Completed</div>
            </div>
          </div>
          <div className="stat-card-sm">
            <span className="stat-sm-icon">📅</span>
            <div>
              <div className="stat-sm-value">{s.todayAppointments || 0}</div>
              <div className="stat-sm-label">Today's Appointments</div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {s.pendingApprovals > 0 && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>⏳ Pending Doctor Approvals</h3>
              <Link to="/admin/doctors" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div className="admin-alert">
              There are <strong>{s.pendingApprovals}</strong> doctor(s) waiting for approval.
              <Link to="/admin/doctors" className="btn btn-primary btn-sm" style={{ marginLeft: '12px' }}>
                Review Now
              </Link>
            </div>
          </div>
        )}

        {/* Recent Appointments */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>📋 Recent Appointments</h3>
            <Link to="/admin/appointments" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentAppointments?.length > 0 ? (
                  stats.recentAppointments.map(apt => (
                    <tr key={apt._id}>
                      <td>{apt.patient?.name || 'Patient'}</td>
                      <td>{apt.doctor?.user?.name || 'Doctor'}</td>
                      <td>{new Date(apt.date).toLocaleDateString()}</td>
                      <td><span className="badge badge-info">{apt.appointmentType}</span></td>
                      <td><span className={`badge badge-${apt.status === 'confirmed' ? 'success' : apt.status === 'cancelled' ? 'error' : 'warning'}`}>{apt.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No appointments yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Specialization Distribution */}
        {stats?.specDistribution?.length > 0 && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>📊 Doctors by Specialization</h3>
            </div>
            <div className="spec-bars">
              {stats.specDistribution.map(spec => (
                <div key={spec._id} className="spec-bar-item">
                  <span className="spec-name">{spec._id}</span>
                  <div className="spec-bar">
                    <div className="spec-bar-fill" style={{ width: `${(spec.count / (stats.specDistribution[0]?.count || 1)) * 100}%` }}></div>
                  </div>
                  <span className="spec-count">{spec.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
