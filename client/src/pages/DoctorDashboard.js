import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [prescription, setPrescription] = useState([{ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', timeSlot: { startTime: '', endTime: '' }, reason: '' });
  const [availableSlots, setAvailableSlots] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [aptRes, earningsRes] = await Promise.all([
        api.get('/appointments?limit=100'),
        api.get('/revenue/doctor/earnings').catch(() => ({ data: null }))
      ]);
      setAppointments(aptRes.data.appointments || []);
      setEarningsData(earningsRes.data);

      const aptList = aptRes.data.appointments || [];
      const patientMap = new Map();
      aptList.forEach(apt => {
        const p = apt.patient;
        if (p && !patientMap.has(p._id)) {
          patientMap.set(p._id, { ...p, appointments: 0, lastVisit: null });
        }
        if (p) {
          const entry = patientMap.get(p._id);
          entry.appointments++;
          if (!entry.lastVisit || new Date(apt.date) > new Date(entry.lastVisit)) {
            entry.lastVisit = apt.date;
          }
        }
      });
      setPatients(Array.from(patientMap.values()));

      try {
        const consultRes = await api.get('/consultations/my-history');
        setConsultations(consultRes.data.consultations || []);
      } catch (e) { /* no consultations yet */ }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!authLoading) fetchDashboardData(); }, [authLoading, fetchDashboardData]);

  useEffect(() => {
    if (authLoading) return;
    api.get('/auth/me').then(res => {
      if (res.data.doctorProfile) setDoctorProfile(res.data.doctorProfile);
    }).catch(() => {});
  }, [authLoading]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= today && d < tomorrow && ['pending', 'confirmed'].includes(a.status);
  });
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const totalEarnings = earningsData?.earnings?.totalEarned || 0;
  const pendingBalance = earningsData?.earnings?.pendingBalance || 0;

  const handleUpdateStatus = async (aptId, newStatus) => {
    try {
      await api.put(`/appointments/${aptId}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      setSelectedApt(null);
      setShowReschedule(false);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.timeSlot.startTime) {
      toast.error('Please select a date and time slot');
      return;
    }
    try {
      await api.put(`/appointments/${selectedApt._id}/reschedule`, rescheduleData);
      toast.success('Appointment rescheduled successfully');
      setSelectedApt(null);
      setShowReschedule(false);
      setRescheduleData({ date: '', timeSlot: { startTime: '', endTime: '' }, reason: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reschedule');
    }
  };

  const handleRescheduleDateChange = async (date) => {
    setRescheduleData(prev => ({ ...prev, date }));
    try {
      const doctorRes = await api.get('/auth/me');
      const doctor = doctorRes.data.doctorProfile;
      if (doctor) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()];
        const dayAvail = doctor.availability?.find(a => a.day === dayName);
        setAvailableSlots(dayAvail?.slots?.filter(s => s.isAvailable) || []);
      }
    } catch (error) {
      // Use default slots
      setAvailableSlots([
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '11:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '15:00' },
        { startTime: '15:00', endTime: '16:00' },
        { startTime: '16:00', endTime: '17:00' }
      ]);
    }
  };

  const handleSaveConsultation = async (aptId) => {
    try {
      await api.put(`/appointments/${aptId}/consultation`, {
        notes: consultationNotes,
        prescription: prescription.filter(p => p.medicine.trim()),
        diagnosis: 'Diagnosis noted'
      });
      toast.success('Consultation notes saved');
      setSelectedApt(null);
      setConsultationNotes('');
      setPrescription([{ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    } catch (error) {
      toast.error('Failed to save consultation');
    }
  };

  const addPrescriptionRow = () => {
    setPrescription([...prescription, { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const updatePrescription = (index, field, value) => {
    const updated = [...prescription];
    updated[index][field] = value;
    setPrescription(updated);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="dash-page">
      {/* Hero Header */}
      <div className="dash-hero">
        <div className="container">
          <div>
            <h1>Welcome back, {user?.name}</h1>
            <p>{doctorProfile?.specialization || 'Doctor'} • {doctorProfile?.clinicName || 'MediConnect Pro'}</p>
          </div>
          <div className="dash-hero-right">
            <span className="badge-online"><span className="dot" /> Online</span>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>Edit Profile</button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats Cards */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon green">📅</div>
            <div className="dash-stat-info">
              <h3>{todayAppointments.length}</h3>
              <p>Today's Appointments</p>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon yellow">⏳</div>
            <div className="dash-stat-info">
              <h3>{pendingAppointments.length}</h3>
              <p>Pending Bookings</p>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon blue">✅</div>
            <div className="dash-stat-info">
              <h3>{completedAppointments.length}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon red">💰</div>
            <div className="dash-stat-info">
              <h3>₹{totalEarnings.toLocaleString()}</h3>
              <p>Total Earnings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          <button className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
          <button className={`dash-tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            📅 Appointments <span className="tab-count">{appointments.length}</span>
          </button>
          <button className={`dash-tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            👥 Patients <span className="tab-count">{patients.length}</span>
          </button>
          <button className={`dash-tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            💬 Messages <span className="tab-count">{consultations.length}</span>
          </button>
          <button className={`dash-tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>🕐 Schedule</button>
          <button className={`dash-tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>💰 Earnings</button>
        </div>

        <div className="dash-layout">
          <div className="dash-main">
            {/* === OVERVIEW TAB === */}
            {activeTab === 'overview' && (
              <>
                {/* Today's Appointments */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3>📅 Today's Appointments</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('appointments')}>View All</button>
                  </div>
                  <div className="dash-card-body">
                    {todayAppointments.length === 0 ? (
                      <div className="dash-empty">
                        <div className="dash-empty-icon">📭</div>
                        <h3>No appointments today</h3>
                        <p>You're free for the day!</p>
                      </div>
                    ) : todayAppointments.map(apt => (
                      <AptItem key={apt._id} apt={apt} onClick={() => openAptDetail(apt)} onAction={handleUpdateStatus} />
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3>🕐 Recent Activity</h3>
                  </div>
                  <div className="dash-card-body">
                    {appointments.slice(0, 5).map(apt => (
                      <AptItem key={apt._id} apt={apt} onClick={() => openAptDetail(apt)} onAction={handleUpdateStatus} />
                    ))}
                    {appointments.length === 0 && (
                      <div className="dash-empty">
                        <div className="dash-empty-icon">📋</div>
                        <h3>No activity yet</h3>
                        <p>Your appointments will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* === APPOINTMENTS TAB === */}
            {activeTab === 'appointments' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>All Appointments ({appointments.length})</h3>
                </div>
                <div className="dash-card-body">
                  {appointments.length === 0 ? (
                    <div className="dash-empty">
                      <div className="dash-empty-icon">📅</div>
                      <h3>No appointments yet</h3>
                      <p>Patients will be able to book appointments with you</p>
                    </div>
                  ) : appointments.map(apt => (
                    <AptItem key={apt._id} apt={apt} onClick={() => openAptDetail(apt)} onAction={handleUpdateStatus} />
                  ))}
                </div>
              </div>
            )}

            {/* === PATIENTS TAB === */}
            {activeTab === 'patients' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>My Patients ({patients.length})</h3>
                </div>
                <div className="dash-card-body">
                  {patients.length === 0 ? (
                    <div className="dash-empty">
                      <div className="dash-empty-icon">👥</div>
                      <h3>No patients yet</h3>
                      <p>Your patients will appear here after their first appointment</p>
                    </div>
                  ) : patients.map(p => (
                    <div key={p._id} className="patient-item">
                      <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=4F46E5&color=fff`} alt="" className="patient-avatar" />
                      <div className="patient-info">
                        <h4>{p.name}</h4>
                        <p>{p.email}</p>
                      </div>
                      <div className="patient-meta">
                        <div>{p.appointments} appointment{p.appointments > 1 ? 's' : ''}</div>
                        {p.lastVisit && <div>Last: {new Date(p.lastVisit).toLocaleDateString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === MESSAGES TAB === */}
            {activeTab === 'messages' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>Consultation History</h3>
                </div>
                <div className="dash-card-body">
                  {consultations.length === 0 ? (
                    <div className="dash-empty">
                      <div className="dash-empty-icon">💬</div>
                      <h3>No consultations yet</h3>
                      <p>Video and chat consultations will appear here</p>
                    </div>
                  ) : consultations.map(c => (
                    <Link key={c._id} to={`/chat/${c.roomId}`} className="msg-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <img src={c.patient?.avatar || `https://ui-avatars.com/api/?name=P&background=4F46E5&color=fff`} alt="" className="msg-avatar" />
                      <div className="msg-content">
                        <h4>{c.patient?.name || 'Patient'}</h4>
                        <p>{c.type} consultation • {c.status}</p>
                      </div>
                      <span className="msg-time">{new Date(c.createdAt).toLocaleDateString()}</span>
                      {c.status === 'in-progress' && <span className="msg-unread" />}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* === SCHEDULE TAB === */}
            {activeTab === 'schedule' && (
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3>Weekly Schedule</h3>
                  <Link to="/earnings" className="btn btn-ghost btn-sm">Manage Availability</Link>
                </div>
                <div className="dash-card-body">
                  <div className="schedule-grid">
                    {(doctorProfile?.availability || generateDefaultSchedule()).map(day => (
                      <div key={day.day} className="schedule-day">
                        <h4>{day.day}</h4>
                        <div className="schedule-slots">
                          {day.slots?.map((slot, i) => (
                            <span key={i} className={`slot-chip ${slot.isAvailable ? '' : 'unavailable'}`}>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          ))}
                          {(!day.slots || day.slots.length === 0) && <span style={{fontSize:'12px',color:'var(--gray-400)'}}>Day off</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* === EARNINGS TAB === */}
            {activeTab === 'earnings' && (
              <>
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3>💰 Earnings Overview</h3>
                    <Link to="/earnings" className="btn btn-ghost btn-sm">Detailed View →</Link>
                  </div>
                  <div className="dash-card-body">
                    <div className="detail-row"><span className="detail-label">Total Earned</span><span className="detail-value" style={{color:'#059669'}}>₹{(earningsData?.earnings?.totalEarned || 0).toLocaleString()}</span></div>
                    <div className="detail-row"><span className="detail-label">Pending Balance</span><span className="detail-value" style={{color:'#d97706'}}>₹{(earningsData?.earnings?.pendingBalance || 0).toLocaleString()}</span></div>
                    <div className="detail-row"><span className="detail-label">Total Paid Out</span><span className="detail-value">₹{(earningsData?.earnings?.totalPaid || 0).toLocaleString()}</span></div>
                    <div className="detail-row"><span className="detail-label">Total Appointments</span><span className="detail-value">{earningsData?.earnings?.totalAppointments || 0}</span></div>
                    <div className="detail-row"><span className="detail-label">Avg per Appointment</span><span className="detail-value">₹{(earningsData?.earnings?.averagePerAppointment || 0).toLocaleString()}</span></div>
                    <div className="detail-row"><span className="detail-label">Today's Earnings</span><span className="detail-value">₹{(earningsData?.todayEarned || 0).toLocaleString()}</span></div>
                    <div className="detail-row"><span className="detail-label">This Week</span><span className="detail-value">₹{(earningsData?.weekEarned || 0).toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Monthly Chart */}
                {earningsData?.monthlyData && (
                  <div className="dash-card">
                    <div className="dash-card-header"><h3>📈 Monthly Trend</h3></div>
                    <div className="dash-card-body">
                      <div className="earnings-chart" style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'150px',padding:'10px 0'}}>
                        {earningsData.monthlyData.map((m, i) => {
                          const maxVal = Math.max(...earningsData.monthlyData.map(d => d.earned), 1);
                          return (
                            <div key={i} style={{flex:1,textAlign:'center'}}>
                              <div style={{height:`${(m.earned / maxVal) * 100}%`,minHeight:m.earned > 0 ? '8px' : '0',background:'linear-gradient(to top,#059669,#10b981)',borderRadius:'4px 4px 0 0',transition:'height 0.3s',position:'relative'}}>
                                <span style={{position:'absolute',top:-20,left:'50%',transform:'translateX(-50%)',fontSize:'10px',color:'var(--gray-500)',whiteSpace:'nowrap'}}>₹{m.earned.toLocaleString()}</span>
                              </div>
                              <span style={{fontSize:'10px',color:'var(--gray-400)',marginTop:'4px',display:'block'}}>{m.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                {earningsData?.transactions?.length > 0 && (
                  <div className="dash-card">
                    <div className="dash-card-header"><h3>📋 Recent Transactions</h3></div>
                    <div className="dash-card-body">
                      {earningsData.transactions.slice(0, 10).map(t => (
                        <div key={t._id} className="apt-item">
                          <div style={{width:40,height:40,borderRadius:10,background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>💰</div>
                          <div className="apt-info">
                            <h4>{t.patient?.name || 'Patient'}</h4>
                            <p>{t.appointment?.appointmentType || 'consultation'} • {new Date(t.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="apt-time">
                            <div className="time" style={{color:'#059669'}}>+₹{t.doctorShare?.toLocaleString()}</div>
                            <div className={`date`} style={{color: t.payoutStatus === 'paid' ? '#059669' : '#d97706'}}>{t.payoutStatus}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="dash-sidebar">
            {/* Quick Actions */}
            <div className="dash-card">
              <div className="dash-card-header"><h3>⚡ Quick Actions</h3></div>
              <div className="dash-card-body">
                <div className="quick-actions">
                  <Link to="/appointments" className="quick-action-btn"><span className="qa-icon">📅</span>View Bookings</Link>
                  <Link to="/earnings" className="quick-action-btn"><span className="qa-icon">💰</span>Earnings</Link>
                  <Link to="/profile" className="quick-action-btn"><span className="qa-icon">👤</span>My Profile</Link>
                  <Link to="/reports" className="quick-action-btn"><span className="qa-icon">📋</span>Reports</Link>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="dash-card">
              <div className="dash-card-header"><h3>🕐 Today's Schedule</h3></div>
              <div className="dash-card-body">
                {todayAppointments.length === 0 ? (
                  <p style={{textAlign:'center',padding:'20px',color:'var(--gray-400)',fontSize:'13px'}}>No appointments today</p>
                ) : todayAppointments.map(apt => (
                  <div key={apt._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--gray-100)'}}>
                    <span style={{fontSize:12,fontWeight:600,color:'#059669',minWidth:50}}>{apt.timeSlot?.startTime}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{apt.patient?.name || 'Patient'}</div>
                      <div style={{fontSize:11,color:'var(--gray-400)'}}>{apt.appointmentType}</div>
                    </div>
                    <span className={`badge badge-${apt.status === 'confirmed' ? 'success' : 'warning'}`} style={{fontSize:10}}>{apt.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Actions */}
            {pendingAppointments.length > 0 && (
              <div className="dash-card">
                <div className="dash-card-header"><h3>⏳ Pending Actions ({pendingAppointments.length})</h3></div>
                <div className="dash-card-body">
                  {pendingAppointments.slice(0, 5).map(apt => (
                    <div key={apt._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--gray-100)'}}>
                      <img src={apt.patient?.avatar || `https://ui-avatars.com/api/?name=P`} alt="" style={{width:32,height:32,borderRadius:8}} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600}}>{apt.patient?.name}</div>
                        <div style={{fontSize:11,color:'var(--gray-400)'}}>{new Date(apt.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-success btn-sm" style={{padding:'4px 8px',fontSize:10}} onClick={() => handleUpdateStatus(apt._id, 'confirmed')}>✓</button>
                        <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px',fontSize:10}} onClick={() => handleUpdateStatus(apt._id, 'cancelled')}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <div className="modal-overlay" onClick={() => setSelectedApt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Appointment Details</h2>
              <button className="modal-close" onClick={() => setSelectedApt(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span className="detail-label">Patient</span><span className="detail-value">{selectedApt.patient?.name || 'N/A'}</span></div>
              <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{selectedApt.patient?.email || 'N/A'}</span></div>
              <div className="detail-row"><span className="detail-label">Type</span><span className="detail-value"><span className="badge badge-primary">{selectedApt.appointmentType}</span></span></div>
              <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{new Date(selectedApt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
              <div className="detail-row"><span className="detail-label">Time</span><span className="detail-value">{selectedApt.timeSlot?.startTime} - {selectedApt.timeSlot?.endTime}</span></div>
              <div className="detail-row"><span className="detail-label">Status</span><span className="detail-value"><span className={`badge badge-${selectedApt.status === 'completed' ? 'success' : selectedApt.status === 'cancelled' ? 'error' : 'warning'}`}>{selectedApt.status}</span></span></div>
              <div className="detail-row"><span className="detail-label">Fee</span><span className="detail-value">₹{selectedApt.payment?.amount}</span></div>
              <div className="detail-row"><span className="detail-label">Payment</span><span className="detail-value">{selectedApt.payment?.status}</span></div>

              {selectedApt.symptoms && (
                <div style={{marginTop:16}}>
                  <label className="form-label" style={{fontWeight:600}}>Symptoms</label>
                  <p style={{fontSize:13,color:'var(--gray-600)',background:'var(--gray-50)',padding:12,borderRadius:8}}>{selectedApt.symptoms}</p>
                </div>
              )}

              {selectedApt.medicalHistory && (
                <div style={{marginTop:12}}>
                  <label className="form-label" style={{fontWeight:600}}>Medical History</label>
                  <p style={{fontSize:13,color:'var(--gray-600)',background:'var(--gray-50)',padding:12,borderRadius:8}}>{selectedApt.medicalHistory}</p>
                </div>
              )}

              {/* Consultation Notes (for completed or in-progress) */}
              {selectedApt.status !== 'cancelled' && (
                <div style={{marginTop:16}}>
                  <label className="form-label" style={{fontWeight:600}}>Consultation Notes</label>
                  <textarea className="notes-textarea" placeholder="Add diagnosis, notes, observations..." value={consultationNotes} onChange={e => setConsultationNotes(e.target.value)} />
                </div>
              )}

              {/* Prescription */}
              {selectedApt.status !== 'cancelled' && (
                <div style={{marginTop:16}}>
                  <label className="form-label" style={{fontWeight:600}}>Prescription</label>
                  {prescription.map((p, i) => (
                    <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:8,marginBottom:8}}>
                      <input className="form-input" placeholder="Medicine" value={p.medicine} onChange={e => updatePrescription(i, 'medicine', e.target.value)} style={{fontSize:12,padding:'6px 10px'}} />
                      <input className="form-input" placeholder="Dosage" value={p.dosage} onChange={e => updatePrescription(i, 'dosage', e.target.value)} style={{fontSize:12,padding:'6px 10px'}} />
                      <input className="form-input" placeholder="Frequency" value={p.frequency} onChange={e => updatePrescription(i, 'frequency', e.target.value)} style={{fontSize:12,padding:'6px 10px'}} />
                      <input className="form-input" placeholder="Duration" value={p.duration} onChange={e => updatePrescription(i, 'duration', e.target.value)} style={{fontSize:12,padding:'6px 10px'}} />
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={addPrescriptionRow}>+ Add Medicine</button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedApt.status === 'pending' && (
                <>
                  <button className="btn btn-success" onClick={() => handleUpdateStatus(selectedApt._id, 'confirmed')}>✓ Confirm</button>
                  <button className="btn btn-warning" onClick={() => setShowReschedule(true)}>📅 Reschedule</button>
                  <button className="btn btn-ghost" onClick={() => handleUpdateStatus(selectedApt._id, 'cancelled')}>✕ Decline</button>
                </>
              )}
              {selectedApt.status === 'confirmed' && (
                <>
                  <button className="btn btn-primary" onClick={() => { handleSaveConsultation(selectedApt._id); handleUpdateStatus(selectedApt._id, 'completed'); }}>Mark Complete & Save Notes</button>
                  <button className="btn btn-warning" onClick={() => setShowReschedule(true)}>📅 Reschedule</button>
                  {selectedApt.appointmentType === 'video' && <Link to={`/video/${selectedApt.roomId}`} className="btn btn-success">📹 Start Video Call</Link>}
                  {selectedApt.appointmentType === 'chat' && <Link to={`/chat/${selectedApt.roomId}`} className="btn btn-primary">💬 Open Chat</Link>}
                </>
              )}
              {selectedApt.status === 'completed' && (
                <button className="btn btn-primary" onClick={() => handleSaveConsultation(selectedApt._id)}>Save Notes</button>
              )}
              <button className="btn btn-ghost" onClick={() => { setSelectedApt(null); setShowReschedule(false); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && selectedApt && (
        <div className="modal-overlay" onClick={() => setShowReschedule(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: 480}}>
            <div className="modal-header">
              <h2>📅 Reschedule Appointment</h2>
              <button className="modal-close" onClick={() => setShowReschedule(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:8,padding:12,marginBottom:16,fontSize:13}}>
                <strong>Current:</strong> {new Date(selectedApt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedApt.timeSlot?.startTime} - {selectedApt.timeSlot?.endTime}
              </div>

              <div style={{marginBottom:16}}>
                <label className="form-label" style={{fontWeight:600}}>New Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={rescheduleData.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => handleRescheduleDateChange(e.target.value)}
                />
              </div>

              {rescheduleData.date && (
                <div style={{marginBottom:16}}>
                  <label className="form-label" style={{fontWeight:600}}>Available Time Slots *</label>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:8,marginTop:8}}>
                    {availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        className={`btn ${rescheduleData.timeSlot.startTime === slot.startTime ? 'btn-primary' : 'btn-ghost'}`}
                        style={{padding:'8px 12px',fontSize:13}}
                        onClick={() => setRescheduleData(prev => ({...prev, timeSlot: { startTime: slot.startTime, endTime: slot.endTime }}))}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                    {availableSlots.length === 0 && <p style={{fontSize:13,color:'var(--gray-400)'}}>No slots available on this day</p>}
                  </div>
                </div>
              )}

              <div style={{marginBottom:16}}>
                <label className="form-label" style={{fontWeight:600}}>Reason for Reschedule</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Optional: Explain why you're rescheduling"
                  value={rescheduleData.reason}
                  onChange={e => setRescheduleData(prev => ({...prev, reason: e.target.value}))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleReschedule} disabled={!rescheduleData.date || !rescheduleData.timeSlot.startTime}>
                ✓ Confirm Reschedule
              </button>
              <button className="btn btn-ghost" onClick={() => setShowReschedule(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function openAptDetail(apt) {
    setSelectedApt(apt);
    setConsultationNotes(apt.consultation?.notes || '');
    setPrescription(apt.consultation?.prescription?.length > 0 ? apt.consultation.prescription : [{ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  }
}

function AptItem({ apt, onClick, onAction }) {
  const patient = apt.patient;
  return (
    <div className="apt-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <img src={patient?.avatar || `https://ui-avatars.com/api/?name=${patient?.name || 'P'}&background=4F46E5&color=fff`} alt="" className="apt-avatar" />
      <div className="apt-info">
        <h4>{patient?.name || 'Patient'}</h4>
        <p>{apt.appointmentType} • {apt.symptoms?.substring(0, 50) || 'No symptoms'}</p>
      </div>
      <div className="apt-time">
        <div className="time">{apt.timeSlot?.startTime}</div>
        <div className="date">{new Date(apt.date).toLocaleDateString()}</div>
      </div>
      <span className={`badge badge-${apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'error' : apt.status === 'confirmed' ? 'info' : 'warning'}`} style={{ fontSize: 11 }}>
        {apt.status}
      </span>
      <div className="apt-actions" onClick={e => e.stopPropagation()}>
        {apt.status === 'pending' && (
          <>
            <button className="btn btn-success btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onAction(apt._id, 'confirmed')}>✓</button>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onAction(apt._id, 'cancelled')}>✕</button>
          </>
        )}
      </div>
    </div>
  );
}

function generateDefaultSchedule() {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
    day,
    slots: day === 'Sunday' ? [] : [
      { startTime: '09:00', endTime: '10:00', isAvailable: true },
      { startTime: '10:00', endTime: '11:00', isAvailable: true },
      { startTime: '11:00', endTime: '12:00', isAvailable: true },
      { startTime: '14:00', endTime: '15:00', isAvailable: true },
      { startTime: '15:00', endTime: '16:00', isAvailable: true },
      { startTime: '16:00', endTime: '17:00', isAvailable: true },
    ]
  }));
}
