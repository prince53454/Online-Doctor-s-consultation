import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './PatientDashboard.css';

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [aptRes, notifRes] = await Promise.all([
        api.get('/appointments?limit=50'),
        api.get('/notifications?limit=5').catch(() => ({ data: { notifications: [] } }))
      ]);

      const apts = aptRes.data.appointments || [];
      const now = new Date();

      const upcoming = apts.filter(a => ['pending', 'confirmed'].includes(a.status) && new Date(a.date) >= now);
      const completed = apts.filter(a => a.status === 'completed');
      const cancelled = apts.filter(a => a.status === 'cancelled');

      setStats({ total: apts.length, upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length });
      setAppointments(apts.slice(0, 10));
      setNotifications(notifRes.data.notifications || []);

      // Fetch medical records for prescriptions
      try {
        const recRes = await api.get('/medical-records');
        setPrescriptions((recRes.data.prescriptions || []).slice(0, 5));
      } catch (e) { /* no records yet */ }

    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading, fetchData]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/status`, { status: 'cancelled', cancelledBy: 'patient', cancellationReason: 'Cancelled by patient' });
      toast.success('Appointment cancelled');
      fetchData();
    } catch { toast.error('Failed to cancel'); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayAppts = appointments.filter(a => { const d = new Date(a.date); return d >= today && d < tomorrow && ['pending', 'confirmed'].includes(a.status); });
  const upcomingAppts = appointments.filter(a => ['pending', 'confirmed'].includes(a.status) && new Date(a.date) >= tomorrow).slice(0, 5);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="pd-page">
      <div className="container">
        {/* Welcome Header */}
        <div className="pd-hero">
          <div className="pd-hero-left">
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4F46E5&color=fff&bold=true`} alt="" className="pd-hero-avatar" />
            <div>
              <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
              <p>Here's your health overview for today</p>
            </div>
          </div>
          <div className="pd-hero-actions">
            <Link to="/ai-checker" className="btn btn-primary">🤖 AI Symptom Check</Link>
            <Link to="/doctors" className="btn btn-secondary">👨‍⚕️ Find Doctor</Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="pd-stats">
          <div className="pd-stat-card blue">
            <div className="pd-stat-icon">📅</div>
            <div className="pd-stat-info">
              <h3>{stats.total}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          <div className="pd-stat-card green">
            <div className="pd-stat-icon">⏳</div>
            <div className="pd-stat-info">
              <h3>{stats.upcoming}</h3>
              <p>Upcoming</p>
            </div>
          </div>
          <div className="pd-stat-card purple">
            <div className="pd-stat-icon">✅</div>
            <div className="pd-stat-info">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="pd-stat-card orange">
            <div className="pd-stat-icon">💊</div>
            <div className="pd-stat-info">
              <h3>{prescriptions.length}</h3>
              <p>Prescriptions</p>
            </div>
          </div>
        </div>

        <div className="pd-grid">
          {/* Left Column */}
          <div className="pd-main">
            {/* Today's Appointments */}
            <div className="pd-card">
              <div className="pd-card-header">
                <h3>📋 Today's Appointments</h3>
                <Link to="/appointments" className="pd-link">View All →</Link>
              </div>
              <div className="pd-card-body">
                {todayAppts.length === 0 ? (
                  <div className="pd-empty">
                    <span>📭</span>
                    <p>No appointments today</p>
                    <Link to="/doctors" className="btn btn-primary btn-sm">Book Now</Link>
                  </div>
                ) : todayAppts.map(apt => (
                  <div key={apt._id} className="pd-apt-item">
                    <img src={apt.doctor?.user?.avatar || `https://ui-avatars.com/api/?name=Dr&background=4F46E5&color=fff`} alt="" className="pd-apt-avatar" />
                    <div className="pd-apt-info">
                      <h4>Dr. {apt.doctor?.user?.name || 'Doctor'}</h4>
                      <p>{apt.doctor?.specialization} • {apt.appointmentType}</p>
                    </div>
                    <div className="pd-apt-time">
                      <span className="pd-time">{apt.timeSlot?.startTime}</span>
                      <span className="pd-date">{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="pd-apt-actions">
                      {apt.status === 'confirmed' && apt.appointmentType === 'video' && (
                        <Link to={`/video/${apt.roomId}`} className="btn btn-success btn-sm">📹 Join</Link>
                      )}
                      {apt.status === 'confirmed' && apt.appointmentType === 'chat' && (
                        <Link to={`/chat/${apt.roomId}`} className="btn btn-primary btn-sm">💬 Chat</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppts.length > 0 && (
              <div className="pd-card">
                <div className="pd-card-header">
                  <h3>📅 Upcoming Appointments</h3>
                  <Link to="/appointments" className="pd-link">View All →</Link>
                </div>
                <div className="pd-card-body">
                  {upcomingAppts.map(apt => (
                    <div key={apt._id} className="pd-apt-item">
                      <img src={apt.doctor?.user?.avatar || `https://ui-avatars.com/api/?name=Dr&background=4F46E5&color=fff`} alt="" className="pd-apt-avatar" />
                      <div className="pd-apt-info">
                        <h4>Dr. {apt.doctor?.user?.name || 'Doctor'}</h4>
                        <p>{apt.doctor?.specialization} • {apt.appointmentType}</p>
                      </div>
                      <div className="pd-apt-time">
                        <span className="pd-time">{apt.timeSlot?.startTime}</span>
                        <span className="pd-date">{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className={`pd-badge pd-badge-${apt.status === 'confirmed' ? 'green' : 'yellow'}`}>{apt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Prescriptions */}
            <div className="pd-card">
              <div className="pd-card-header">
                <h3>💊 Recent Prescriptions</h3>
                <Link to="/medical-records" className="pd-link">View All →</Link>
              </div>
              <div className="pd-card-body">
                {prescriptions.length === 0 ? (
                  <div className="pd-empty">
                    <span>💊</span>
                    <p>No prescriptions yet</p>
                  </div>
                ) : prescriptions.map((rx, i) => (
                  <div key={i} className="pd-rx-item">
                    <span className="pd-rx-icon">💊</span>
                    <div className="pd-rx-info">
                      <h4>{rx.medicine}</h4>
                      <p>{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                      <p className="pd-rx-doctor">Dr. {rx.doctor?.name || rx.doctorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="pd-sidebar">
            {/* Quick Actions */}
            <div className="pd-card">
              <div className="pd-card-header"><h3>⚡ Quick Actions</h3></div>
              <div className="pd-card-body">
                <div className="pd-actions-grid">
                  <Link to="/doctors" className="pd-action-btn">
                    <span className="pd-action-icon">👨‍⚕️</span>
                    <span>Find Doctor</span>
                  </Link>
                  <Link to="/ai-checker" className="pd-action-btn">
                    <span className="pd-action-icon">🤖</span>
                    <span>AI Check</span>
                  </Link>
                  <Link to="/labs" className="pd-action-btn">
                    <span className="pd-action-icon">🔬</span>
                    <span>Lab Tests</span>
                  </Link>
                  <Link to="/pharmacy" className="pd-action-btn">
                    <span className="pd-action-icon">💊</span>
                    <span>Pharmacy</span>
                  </Link>
                  <Link to="/chat-history" className="pd-action-btn">
                    <span className="pd-action-icon">💬</span>
                    <span>Chat History</span>
                  </Link>
                  <Link to="/medical-records" className="pd-action-btn">
                    <span className="pd-action-icon">📋</span>
                    <span>Records</span>
                  </Link>
                  <Link to="/reports" className="pd-action-btn">
                    <span className="pd-action-icon">📊</span>
                    <span>Reports</span>
                  </Link>
                  <Link to="/profile" className="pd-action-btn">
                    <span className="pd-action-icon">👤</span>
                    <span>Profile</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="pd-card">
              <div className="pd-card-header">
                <h3>🔔 Recent Notifications</h3>
              </div>
              <div className="pd-card-body">
                {notifications.length === 0 ? (
                  <div className="pd-empty">
                    <span>🔔</span>
                    <p>No notifications</p>
                  </div>
                ) : notifications.slice(0, 5).map(n => (
                  <div key={n._id} className="pd-notif-item">
                    <span className="pd-notif-dot" />
                    <div className="pd-notif-content">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <span className="pd-notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Tip */}
            <div className="pd-card pd-health-tip">
              <div className="pd-tip-icon">💡</div>
              <h4>Health Tip</h4>
              <p>Stay hydrated! Drink at least 8 glasses of water daily for optimal health.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
