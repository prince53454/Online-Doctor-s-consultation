import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminAppointments() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAppointments = async () => {
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
  };

  useEffect(() => { if (!authLoading) fetchAppointments(); }, [authLoading, filter, page]);

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
        <div className="admin-logo"><span style={{fontSize:'24px'}}>🩺</span><h2>MediConnect</h2></div>
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
        <div className="admin-header"><h1>Manage Appointments</h1></div>

        <div className="admin-filters">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => { setFilter(f); setPage(1); }}>
              {f || 'All'}
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
                          {apt.status === 'pending' && (
                            <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(apt._id, 'confirmed')}>Confirm</button>
                          )}
                          {['pending', 'confirmed'].includes(apt.status) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(apt._id, 'cancelled')}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No appointments found</td></tr>
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
