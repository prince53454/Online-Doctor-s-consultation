import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './MedicalRecords.css';

export default function MedicalRecords() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/medical-records');
      setData(res.data);
    } catch (error) {
      console.error('Failed to load medical records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data) return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}><h2>Could not load records</h2></div>;

  const { summary, timeline, prescriptions } = data;

  return (
    <div className="medical-records-page">
      <div className="container">
        {/* Header */}
        <div className="mr-header">
          <div className="mr-header-left">
            <img src={user?.avatar} alt="" className="mr-user-avatar" />
            <div>
              <h1>Medical Records</h1>
              <p className="text-muted">Complete health history for {user?.name}</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            🖨️ Print Records
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mr-summary-grid">
          <div className="mr-summary-card">
            <span className="mr-summary-icon">📅</span>
            <div>
              <span className="mr-summary-value">{summary.totalAppointments}</span>
              <span className="mr-summary-label">Total Visits</span>
            </div>
          </div>
          <div className="mr-summary-card">
            <span className="mr-summary-icon">✅</span>
            <div>
              <span className="mr-summary-value">{summary.completedAppointments}</span>
              <span className="mr-summary-label">Completed</span>
            </div>
          </div>
          <div className="mr-summary-card">
            <span className="mr-summary-icon">💊</span>
            <div>
              <span className="mr-summary-value">{summary.totalPrescriptions}</span>
              <span className="mr-summary-label">Prescriptions</span>
            </div>
          </div>
          <div className="mr-summary-card">
            <span className="mr-summary-icon">👨‍⚕️</span>
            <div>
              <span className="mr-summary-value">{summary.uniqueDoctorsConsulted}</span>
              <span className="mr-summary-label">Doctors Consulted</span>
            </div>
          </div>
          <div className="mr-summary-card highlight">
            <span className="mr-summary-icon">💰</span>
            <div>
              <span className="mr-summary-value">₹{summary.totalSpent?.toLocaleString()}</span>
              <span className="mr-summary-label">Total Spent</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mr-tabs">
          <button className={`mr-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            📊 Overview
          </button>
          <button className={`mr-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
            🕐 Timeline
          </button>
          <button className={`mr-tab ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
            💊 Prescriptions ({prescriptions.length})
          </button>
          <button className={`mr-tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            📅 Appointments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="mr-overview animate-fadeIn">
            <div className="mr-overview-grid">
              <div className="mr-overview-section">
                <h3>📋 Recent Activity</h3>
                <div className="mr-activity-list">
                  {timeline.slice(0, 8).map((item, i) => (
                    <div key={i} className="mr-activity-item">
                      <span className="mr-activity-dot" />
                      <div className="mr-activity-content">
                        <p className="mr-activity-title">{item.title}</p>
                        <p className="mr-activity-meta">
                          {item.doctor && `Dr. ${item.doctor}`}
                          {item.specialization && ` • ${item.specialization}`}
                          {item.status && <span className={`badge badge-${item.status === 'completed' ? 'success' : item.status === 'cancelled' ? 'error' : 'warning'}`}>{item.status}</span>}
                        </p>
                        <span className="mr-activity-date">
                          {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mr-overview-section">
                <h3>💊 Latest Prescriptions</h3>
                {prescriptions.length === 0 ? (
                  <p className="text-muted" style={{ padding: '20px' }}>No prescriptions yet</p>
                ) : (
                  <div className="mr-prescription-list">
                    {prescriptions.slice(0, 5).map((rx, i) => (
                      <div key={i} className="mr-rx-card" onClick={() => setSelectedPrescription(rx)}>
                        <div className="mr-rx-header">
                          <strong>{rx.medicine}</strong>
                          <span className="mr-rx-dosage">{rx.dosage}</span>
                        </div>
                        <p className="mr-rx-details">
                          {rx.frequency} • {rx.duration}
                        </p>
                        <p className="mr-rx-doctor">
                          Dr. {rx.doctor?.name || rx.doctorName}
                          {rx.specialization && ` • ${rx.specialization}`}
                        </p>
                        <span className="mr-rx-date">
                          {new Date(rx.date || rx.appointmentDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mr-timeline animate-fadeIn">
            <div className="mr-timeline-container">
              {timeline.map((item, i) => (
                <div key={i} className={`mr-timeline-item ${item.type}`}>
                  <div className="mr-timeline-marker">
                    {item.type === 'appointment' ? '📅' : item.type === 'prescription' ? '💊' : '💬'}
                  </div>
                  <div className="mr-timeline-card">
                    <div className="mr-timeline-header">
                      <h4>{item.title}</h4>
                      <span className="mr-timeline-date">
                        {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {item.doctor && <p className="mr-timeline-doctor">Dr. {item.doctor} {item.specialization && `• ${item.specialization}`}</p>}
                    {item.status && (
                      <span className={`badge badge-${item.status === 'completed' ? 'success' : item.status === 'cancelled' ? 'error' : 'warning'}`} style={{ fontSize: '11px' }}>
                        {item.status}
                      </span>
                    )}
                    {item.data?.symptoms && <p className="mr-timeline-symptoms">Symptoms: {item.data.symptoms}</p>}
                    {item.data?.medicine && (
                      <div className="mr-rx-inline">
                        💊 {item.data.medicine} — {item.data.dosage} • {item.data.frequency} • {item.data.duration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="mr-prescriptions animate-fadeIn">
            {prescriptions.length === 0 ? (
              <div className="mr-empty">
                <span>💊</span>
                <h3>No Prescriptions Yet</h3>
                <p>Your prescriptions will appear here after consultations</p>
              </div>
            ) : (
              <div className="mr-rx-grid">
                {prescriptions.map((rx, i) => (
                  <div key={i} className="mr-rx-full-card" onClick={() => setSelectedPrescription(rx)}>
                    <div className="mr-rx-card-header">
                      <div className="mr-rx-medicine-info">
                        <span className="mr-rx-pill">💊</span>
                        <div>
                          <h4>{rx.medicine}</h4>
                          <span className="mr-rx-dosage-tag">{rx.dosage}</span>
                        </div>
                      </div>
                      <span className="mr-rx-date-tag">
                        {new Date(rx.date || rx.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mr-rx-card-body">
                      <div className="mr-rx-detail-row">
                        <span>⏰ Frequency:</span>
                        <strong>{rx.frequency}</strong>
                      </div>
                      <div className="mr-rx-detail-row">
                        <span>📅 Duration:</span>
                        <strong>{rx.duration}</strong>
                      </div>
                      {rx.instructions && (
                        <div className="mr-rx-detail-row">
                          <span>📝 Instructions:</span>
                          <strong>{rx.instructions}</strong>
                        </div>
                      )}
                    </div>
                    <div className="mr-rx-card-footer">
                      <span>Dr. {rx.doctor?.name || rx.doctorName}</span>
                      {rx.doctor?.specialization && <span>• {rx.doctor.specialization}</span>}
                      {rx.diagnosis && <span>• 🩺 {rx.diagnosis}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="mr-appointments animate-fadeIn">
            {data.appointments.length === 0 ? (
              <div className="mr-empty">
                <span>📅</span>
                <h3>No Appointments Yet</h3>
              </div>
            ) : (
              <div className="mr-apt-list">
                {data.appointments.map(apt => (
                  <div key={apt._id} className="mr-apt-card">
                    <div className="mr-apt-left">
                      <img src={apt.doctor?.user?.avatar} alt="" className="mr-apt-avatar" />
                      <div>
                        <h4>{apt.doctor?.user?.name}</h4>
                        <p>{apt.doctor?.specialization}</p>
                      </div>
                    </div>
                    <div className="mr-apt-center">
                      <p>📅 {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p>🕐 {apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}</p>
                      <p className="text-muted">{apt.appointmentType} • ₹{apt.payment?.amount}</p>
                    </div>
                    <div className="mr-apt-right">
                      <span className={`badge badge-${apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'error' : apt.status === 'confirmed' ? 'info' : 'warning'}`}>
                        {apt.status}
                      </span>
                      {apt.consultation?.prescription?.length > 0 && (
                        <p className="mr-apt-rx-count">💊 {apt.consultation.prescription.length} prescriptions</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescription Detail Modal */}
        {selectedPrescription && (
          <div className="mr-modal-overlay" onClick={() => setSelectedPrescription(null)}>
            <div className="mr-modal" onClick={e => e.stopPropagation()}>
              <div className="mr-modal-header">
                <h3>💊 Prescription Details</h3>
                <button className="mr-modal-close" onClick={() => setSelectedPrescription(null)}>×</button>
              </div>
              <div className="mr-modal-body">
                <div className="mr-modal-rx-main">
                  <h4>{selectedPrescription.medicine}</h4>
                  <span className="badge badge-primary">{selectedPrescription.dosage}</span>
                </div>
                <div className="mr-modal-details">
                  <div className="mr-modal-row">
                    <span>⏰ Frequency</span>
                    <strong>{selectedPrescription.frequency}</strong>
                  </div>
                  <div className="mr-modal-row">
                    <span>📅 Duration</span>
                    <strong>{selectedPrescription.duration}</strong>
                  </div>
                  {selectedPrescription.instructions && (
                    <div className="mr-modal-row">
                      <span>📝 Instructions</span>
                      <strong>{selectedPrescription.instructions}</strong>
                    </div>
                  )}
                  <div className="mr-modal-row">
                    <span>👨‍⚕️ Prescribed by</span>
                    <strong>Dr. {selectedPrescription.doctor?.name || selectedPrescription.doctorName}</strong>
                  </div>
                  {selectedPrescription.diagnosis && (
                    <div className="mr-modal-row">
                      <span>🩺 Diagnosis</span>
                      <strong>{selectedPrescription.diagnosis}</strong>
                    </div>
                  )}
                  <div className="mr-modal-row">
                    <span>📅 Date</span>
                    <strong>{new Date(selectedPrescription.date || selectedPrescription.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
