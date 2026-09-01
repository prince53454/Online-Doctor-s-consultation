import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminUsers() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);

      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading) fetchUsers(); }, [authLoading, roleFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span style={{fontSize:'24px'}}>🩺</span><h2>MediConnect</h2></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item active">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header"><h1>Manage Users</h1></div>

        <div className="admin-toolbar">
          <form onSubmit={handleSearch} className="admin-search">
            <input className="form-input" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <div className="admin-filters">
            {['', 'patient', 'doctor', 'admin'].map(r => (
              <button key={r} className={`filter-chip ${roleFilter === r ? 'active' : ''}`}
                onClick={() => { setRoleFilter(r); setPage(1); }}>
                {r || 'All Roles'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className="admin-card">
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={u.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                      <td>{u.phone || 'N/A'}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u._id)}>
                          {u.isActive ? '🚫 Disable' : '✅ Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No users found</td></tr>
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
