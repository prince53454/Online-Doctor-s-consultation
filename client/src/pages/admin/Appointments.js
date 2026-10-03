import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';
import './AdminTabs.css';

export default function AdminAppointments() {
  const { user, logout, loading: authLoading } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter) params.set('status', filter);

      const res = await api.get(`/admin/appointments?${params}`);
      setAppointments(res.data.appointments || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { if (!authLoading) fetchAppointments(); }, [authLoading, fetchAppointments]);
  useEffect(() => {
    if (!authLoading && notifications[0]?._id) fetchAppointments();
  }, [authLoading, fetchAppointments, notifications[0]?._id]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status, cancelledBy: 'admin' });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-mark" aria-hidden="true">+</span>
          <div><h2>MediConnect</h2><span className="admin-logo-caption">PLATFORM ADMIN</span></div>
        </div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item active">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header admin-header-page">
          <div className="admin-header-copy">
            <span className="admin-page-eyebrow">CARE OPERATIONS</span>
            <h1>Manage Appointments</h1>
            <p>Monitor bookings and keep patient and doctor schedules in sync.</p>
          </div>
        </div>

        <div className="admin-filters" role="group" aria-label="Filter appointments by status">
          {[
            { value: '', label: 'All appointments' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'rescheduled', label: 'Rescheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map(option => (
            <button
              key={option.value || 'all'}
              type="button"
              className={`admin-filter-chip ${filter === option.value ? 'active' : ''}`}
              aria-pressed={filter === option.value}
              onClick={() => { setFilter(option.value); setPage(1); }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className="admin-card">
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(apt => (
                    <tr key={apt._id}>
                      <td>{apt.patient?.name || 'Patient'}</td>
                      <td>{apt.doctor?.user?.name || 'Doctor'}</td>
                      <td>
                        {new Date(apt.date).toLocaleDateString()}<br/>
                        <span className="text-sm text-muted">{apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}</span>
                      </td>
                      <td><span className="badge badge-info">{apt.appointmentType}</span></td>
                      <td>₹{apt.payment?.amount}</td>
                      <td>
                        <span className={`badge badge-${apt.status === 'confirmed' ? 'success' : apt.status === 'cancelled' ? 'error' : apt.status === 'completed' ? 'info' : 'warning'}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {['pending', 'rescheduled'].includes(apt.status) && (
                            <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(apt._id, 'confirmed')}>Confirm</button>
                          )}
                          {['pending', 'confirmed', 'rescheduled'].includes(apt.status) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(apt._id, 'cancelled')}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan="7">
                      <div className="admin-empty-state">
                        <span className="admin-empty-icon" aria-hidden="true">⌕</span>
                        <h3>No {filter || 'appointments'} found</h3>
                        <p>Try another status filter. New appointments will appear here as patients book care.</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination" style={{ padding: '16px' }}>
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className="page-info">Page {page} of {pagination.pages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
