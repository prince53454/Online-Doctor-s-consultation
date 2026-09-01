import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';
import './Revenue.css';

export default function AdminRevenue() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  const fetchData = async () => {
    try {
      const res = await api.get('/revenue/admin/dashboard');
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading]);

  const handlePayout = async (doctorId, doctorName) => {
    if (!window.confirm(`Process payout for ${doctorName}?`)) return;
    try {
      const res = await api.post(`/revenue/admin/payout/${doctorId}`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payout failed');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const cm = data?.currentMonth || {};
  const yd = data?.yearData || {};
  const trend = data?.monthlyTrend || [];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span style={{ fontSize: '24px' }}>🩺</span><h2>MediConnect</h2></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item active">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user"><img src={user?.avatar} alt="" /><span>{user?.name}</span></div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header"><h1>💰 Revenue & Earnings</h1></div>

        {/* Revenue Overview Cards */}
        <div className="stats-cards-grid">
          <div className="stat-card">
            <div className="stat-card-icon green">💰</div>
            <div>
              <div className="stat-card-value">₹{(cm.totalPlatformFee || 0).toLocaleString()}</div>
              <div className="stat-card-label">This Month (Platform Fee)</div>
              {data?.revenueGrowth > 0 && <span className="growth-badge positive">↑ {data.revenueGrowth}%</span>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue">🏦</div>
            <div>
              <div className="stat-card-value">₹{(cm.totalCollected || 0).toLocaleString()}</div>
              <div className="stat-card-label">Total Collected (Month)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon purple">👨‍⚕️</div>
            <div>
              <div className="stat-card-value">₹{(cm.totalDoctorPayout || 0).toLocaleString()}</div>
              <div className="stat-card-label">Doctor Earnings (Month)</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon yellow">📅</div>
            <div>
              <div className="stat-card-value">{cm.totalAppointments || 0}</div>
              <div className="stat-card-label">Appointments (Month)</div>
            </div>
          </div>
        </div>

        <div className="stats-cards-grid">
          <div className="stat-card-sm">
            <span className="stat-sm-icon">📊</span>
            <div>
              <div className="stat-sm-value">₹{(yd.totalPlatformFee || 0).toLocaleString()}</div>
              <div className="stat-sm-label">Yearly Platform Revenue</div>
            </div>
          </div>
          <div className="stat-card-sm">
            <span className="stat-sm-icon">🏦</span>
            <div>
              <div className="stat-sm-value">₹{(yd.totalCollected || 0).toLocaleString()}</div>
              <div className="stat-sm-label">Yearly Total Collected</div>
            </div>
          </div>
          <div className="stat-card-sm">
            <span className="stat-sm-icon">👨‍⚕️</span>
            <div>
              <div className="stat-sm-value">₹{(yd.totalDoctorPayout || 0).toLocaleString()}</div>
              <div className="stat-sm-label">Yearly Doctor Payouts</div>
            </div>
          </div>
          <div className="stat-card-sm">
            <span className="stat-sm-icon">⚠️</span>
            <div>
              <div className="stat-sm-value">₹{(cm.totalRefunds || 0).toLocaleString()}</div>
              <div className="stat-sm-label">Refunds (Month)</div>
            </div>
          </div>
        </div>

        {/* Revenue Split Visualization */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>📊 Revenue Split This Month</h3></div>
          <div className="revenue-split-visual">
            <div className="split-bar">
              <div className="split-platform" style={{ width: `${cm.totalCollected ? (cm.totalPlatformFee / cm.totalCollected * 100) : 5}%` }}>
                Platform: ₹{(cm.totalPlatformFee || 0).toLocaleString()}
              </div>
              <div className="split-doctor" style={{ width: `${cm.totalCollected ? (cm.totalDoctorPayout / cm.totalCollected * 100) : 95}%` }}>
                Doctors: ₹{(cm.totalDoctorPayout || 0).toLocaleString()}
              </div>
            </div>
            <div className="split-legend">
              <span className="legend-item"><span className="legend-dot platform"></span> Platform Fee ({cm.totalCollected ? Math.round(cm.totalPlatformFee / cm.totalCollected * 100) : 0}%)</span>
              <span className="legend-item"><span className="legend-dot doctor"></span> Doctor Share ({cm.totalCollected ? Math.round(cm.totalDoctorPayout / cm.totalCollected * 100) : 100}%)</span>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>📈 Monthly Revenue Trend</h3></div>
          <div className="monthly-chart">
            {trend.map((m, i) => {
              const maxVal = Math.max(...trend.map(t => t.totalCollected), 1);
              return (
                <div key={i} className="chart-bar-group">
                  <div className="chart-bars">
                    <div className="chart-bar platform-bar" style={{ height: `${(m.platformFee / maxVal) * 100}%` }} title={`Platform: ₹${m.platformFee}`} />
                    <div className="chart-bar doctor-bar" style={{ height: `${(m.doctorPayout / maxVal) * 100}%` }} title={`Doctor: ₹${m.doctorPayout}`} />
                  </div>
                  <span className="chart-label">{m.month}</span>
                  <span className="chart-value">₹{m.platformFee.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>💸 Pending Doctor Payouts</h3></div>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Unpaid Amount</th>
                  <th>Transactions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.pendingPayouts?.length > 0 ? (
                  data.pendingPayouts.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={p.userInfo?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          <span>{p.userInfo?.name || 'Doctor'}</span>
                        </div>
                      </td>
                      <td><strong style={{ color: 'var(--primary)' }}>₹{p.total.toLocaleString()}</strong></td>
                      <td>{p.count} appointments</td>
                      <td>
                        <button className="btn btn-success btn-sm" onClick={() => handlePayout(p._id, p.userInfo?.name)}>
                          💸 Pay Now
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No pending payouts 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Earning Doctors */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>🏆 Top Earning Doctors</h3></div>
          <div className="admin-table">
            <table>
              <thead>
                <tr><th>Doctor</th><th>Total Earned</th><th>Pending</th><th>Paid</th><th>Appointments</th></tr>
              </thead>
              <tbody>
                {data?.topDoctors?.map((doc, i) => (
                  <tr key={doc._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--primary)' }}>#{i + 1}</span>
                        <img src={doc.doctor?.user?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                        <span>{doc.doctor?.user?.name || 'Doctor'}</span>
                      </div>
                    </td>
                    <td><strong>₹{doc.totalEarned.toLocaleString()}</strong></td>
                    <td style={{ color: 'var(--accent-dark)' }}>₹{doc.pendingBalance.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>₹{doc.totalPaid.toLocaleString()}</td>
                    <td>{doc.totalAppointments}</td>
                  </tr>
                ))}
                {(!data?.topDoctors || data.topDoctors.length === 0) && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No earnings data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>📋 Recent Transactions</h3>
          </div>
          <div className="admin-table">
            <table>
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Amount</th><th>Platform Fee</th><th>Doctor Share</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map(t => (
                  <tr key={t._id}>
                    <td>{t.patient?.name || 'Patient'}</td>
                    <td>{t.doctor?.user?.name || 'Doctor'}</td>
                    <td><strong>₹{t.totalAmount}</strong></td>
                    <td style={{ color: 'var(--success)' }}>₹{t.platformFee}</td>
                    <td style={{ color: 'var(--primary)' }}>₹{t.doctorShare}</td>
                    <td><span className={`badge badge-${t.status === 'completed' ? 'success' : t.status === 'refunded' ? 'error' : 'warning'}`}>{t.status}</span></td>
                    <td className="text-sm text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
