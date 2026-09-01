import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminDoctors() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  const fetchDoctors = async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        api.get('/admin/doctors?limit=50'),
        api.get('/admin/doctors/pending')
      ]);
      setDoctors(allRes.data.doctors || []);
      setPendingDoctors(pendingRes.data.doctors || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading) fetchDoctors(); }, [authLoading]);

  const handleApprove = async (id, approved) => {
    try {
      await api.put(`/admin/doctors/${id}/approve`, { approved });
      toast.success(approved ? 'Doctor approved!' : 'Doctor rejected');
      fetchDoctors();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleFeature = async (id) => {
    try {
      await api.put(`/admin/doctors/${id}/feature`);
      toast.success('Featured status updated');
      fetchDoctors();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const displayed = tab === 'pending' ? pendingDoctors : doctors;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span style={{fontSize:'24px'}}>🩺</span><h2>MediConnect</h2></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item active">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <h1>Manage Doctors</h1>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
            ⏳ Pending ({pendingDoctors.length})
          </button>
          <button className={`admin-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            ✅ All Doctors ({doctors.length})
          </button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className="admin-card">
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>City</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={doc.user?.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{doc.user?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{doc.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{doc.specialization}</span></td>
                      <td>{doc.location?.city || 'N/A'}</td>
                      <td>{doc.experience} years</td>
                      <td>
                        <span className={`badge ${doc.isApproved ? 'badge-success' : 'badge-warning'}`}>
                          {doc.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {!doc.isApproved ? (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleApprove(doc._id, true)}>✓ Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleApprove(doc._id, false)}>✗ Reject</button>
                            </>
                          ) : (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleFeature(doc._id)}>
                              {doc.isFeatured ? '★ Unfeature' : '☆ Feature'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {displayed.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      {tab === 'pending' ? 'No pending doctors! 🎉' : 'No doctors found.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
