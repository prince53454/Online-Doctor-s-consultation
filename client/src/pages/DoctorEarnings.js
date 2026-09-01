import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './DoctorEarnings.css';

export default function DoctorEarnings() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (authLoading) return;
    api.get('/revenue/doctor/earnings')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  const safeData = data || {};

  const earnings = data?.earnings || { totalEarned: 0, totalPaid: 0, pendingBalance: 0, totalAppointments: 0, totalRefunds: 0, averagePerAppointment: 0 };
  const transactions = data?.transactions || [];
  const recentPayouts = data?.recentPayouts || [];
  const monthlyData = data?.monthlyData || [];
  const todayEarned = data?.todayEarned || 0;
  const todayAppointments = data?.todayAppointments || 0;
  const weekEarned = data?.weekEarned || 0;
  const weekAppointments = data?.weekAppointments || 0;

  return (
    <div className="earnings-page">
      <div className="container">
        <h1>💰 My Earnings</h1>
        <p className="text-muted mb-3">Track your income, payments, and financial performance</p>

        {/* Balance Cards */}
        <div className="earnings-cards">
          <div className="earn-card balance-card">
            <div className="earn-card-icon">💎</div>
            <div>
              <div className="earn-card-label">Pending Balance</div>
              <div className="earn-card-value">₹{(earnings.pendingBalance || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="earn-card">
            <div className="earn-card-icon">💰</div>
            <div>
              <div className="earn-card-label">Total Earned</div>
              <div className="earn-card-value">₹{(earnings.totalEarned || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="earn-card">
            <div className="earn-card-icon">✅</div>
            <div>
              <div className="earn-card-label">Total Paid Out</div>
              <div className="earn-card-value">₹{(earnings.totalPaid || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="earnings-cards">
          <div className="earn-card-sm">
            <span>📅</span>
            <div>
              <div className="earn-sm-value">₹{(todayEarned || 0).toLocaleString()}</div>
              <div className="earn-sm-label">Today's Earnings ({todayAppointments || 0} appointments)</div>
            </div>
          </div>
          <div className="earn-card-sm">
            <span>📊</span>
            <div>
              <div className="earn-sm-value">₹{(weekEarned || 0).toLocaleString()}</div>
              <div className="earn-sm-label">This Week ({weekAppointments || 0} appointments)</div>
            </div>
          </div>
          <div className="earn-card-sm">
            <span>📈</span>
            <div>
              <div className="earn-sm-value">₹{(earnings.averagePerAppointment || 0).toLocaleString()}</div>
              <div className="earn-sm-label">Average per Appointment</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="earnings-tabs">
          <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab-btn ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>Transactions</button>
          <button className={`tab-btn ${tab === 'payouts' ? 'active' : ''}`} onClick={() => setTab('payouts')}>Payouts</button>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="earnings-section animate-fadeIn">
            {/* Monthly Chart */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: '20px' }}>📈 Monthly Earnings</h3>
                <div className="earnings-chart">
                  {monthlyData?.map((m, i) => {
                    const maxVal = Math.max(...monthlyData.map(d => d.earned), 1);
                    return (
                      <div key={i} className="earn-chart-item">
                        <div className="earn-chart-bar-wrap">
                          <div className="earn-chart-bar" style={{ height: `${(m.earned / maxVal) * 100}%` }}>
                            <span className="earn-chart-tooltip">₹{m.earned.toLocaleString()}</span>
                          </div>
                        </div>
                        <span className="earn-chart-label">{m.month}</span>
                        <span className="earn-chart-count">{m.appointments}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '16px' }}>📊 Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Appointments</span>
                    <span className="summary-value">{earnings.totalAppointments || 0}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Earned</span>
                    <span className="summary-value">₹{(earnings.totalEarned || 0).toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Paid Out</span>
                    <span className="summary-value" style={{ color: 'var(--success)' }}>₹{(earnings.totalPaid || 0).toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Pending Balance</span>
                    <span className="summary-value" style={{ color: 'var(--primary)' }}>₹{(earnings.pendingBalance || 0).toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Refunds</span>
                    <span className="summary-value" style={{ color: 'var(--error)' }}>₹{(earnings.totalRefunds || 0).toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Last Payout</span>
                    <span className="summary-value">{earnings.lastPayoutAt ? new Date(earnings.lastPayoutAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          <div className="earnings-section animate-fadeIn">
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: '16px' }}>📋 Transaction History</h3>
                {transactions?.length > 0 ? (
                  <div className="transactions-list">
                    {transactions.map(t => (
                      <div key={t._id} className="transaction-item">
                        <div className="tx-left">
                          <div className="tx-avatar">{t.patient?.name?.[0] || 'P'}</div>
                          <div>
                            <div className="tx-name">{t.patient?.name || 'Patient'}</div>
                            <div className="tx-meta">{t.appointment?.appointmentType} • {new Date(t.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="tx-right">
                          <div className="tx-amount">+₹{t.doctorShare.toLocaleString()}</div>
                          <div className={`tx-status ${t.payoutStatus}`}>{t.payoutStatus}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {tab === 'payouts' && (
          <div className="earnings-section animate-fadeIn">
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: '16px' }}>💸 Payout History</h3>
                {recentPayouts?.length > 0 ? (
                  <div className="payouts-list">
                    {recentPayouts.map(p => (
                      <div key={p._id} className="payout-item">
                        <div className="payout-left">
                          <span className={`payout-status-badge ${p.status}`}>{p.status}</span>
                          <div>
                            <div className="payout-amount">₹{p.amount.toLocaleString()}</div>
                            <div className="payout-meta">{p.transactionCount} transactions • {new Date(p.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="payout-right">
                          {p.reference && <span className="text-sm text-muted">Ref: {p.reference}</span>}
                          {p.processedAt && <span className="text-sm text-muted">Paid: {new Date(p.processedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>No payouts yet. Your earnings will be paid out by the admin.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
