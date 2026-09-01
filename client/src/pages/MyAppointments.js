import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './MyAppointments.css';

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments?limit=50');
      setAppointments(res.data.appointments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/status`, {
        status: 'cancelled',
        cancelledBy: user.role,
        cancellationReason: 'Cancelled by user'
      });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const handleRate = async (id, score) => {
    try {
      await api.post(`/appointments/${id}/rate`, { score, review: 'Great doctor!' });
      toast.success('Thank you for your rating!');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to rate');
    }
  };

  const now = new Date();
  const upcoming = appointments.filter(a =>
    ['pending', 'confirmed'].includes(a.status) && new Date(a.date) >= now
  );
  const past = appointments.filter(a =>
    ['completed', 'cancelled', 'no-show'].includes(a.status) || new Date(a.date) < now
  );

  const displayed = activeTab === 'upcoming' ? upcoming : past;

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="appointments-page">
      <div className="container">
        <h1>My Appointments</h1>
        <p className="text-muted mb-3">Manage your upcoming and past appointments</p>

        <div className="appointments-tabs">
          <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
            Upcoming ({upcoming.length})
          </button>
          <button className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
            Past ({past.length})
          </button>
        </div>

        {displayed.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">📅</div>
            <h3>No {activeTab} appointments</h3>
            <p>{activeTab === 'upcoming' ? "You don't have any upcoming appointments." : "No past appointments found."}</p>
            {activeTab === 'upcoming' && user?.role === 'patient' && (
              <Link to="/doctors" className="btn btn-primary mt-2">Find a Doctor</Link>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {displayed.map(apt => (
              <div key={apt._id} className="appointment-card card">
                <div className="card-body">
                  <div className="apt-header">
                    <img src={user?.role === 'doctor' ? (apt.patient?.avatar || `https://ui-avatars.com/api/?name=${apt.patient?.name || 'P'}&background=4F46E5&color=fff`) : apt.doctor?.user?.avatar} alt="" className="apt-avatar" />
                    <div className="apt-info">
                      {user?.role === 'doctor' ? (
                        <>
                          <h3>{apt.patient?.name || 'Patient'}</h3>
                          <p>{apt.appointmentType} • {apt.symptoms?.substring(0, 40) || 'No symptoms'}</p>
                        </>
                      ) : (
                        <>
                          <h3>{apt.doctor?.user?.name || 'Doctor'}</h3>
                          <p>{apt.doctor?.specialization} • {apt.appointmentType}</p>
                        </>
                      )}
                    </div>
                    <span className={`badge badge-${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="apt-details">
                    <div className="apt-detail">
                      <span>📅</span>
                      <span>{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="apt-detail">
                      <span>🕐</span>
                      <span>{apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}</span>
                    </div>
                    <div className="apt-detail">
                      <span>💰</span>
                      <span>₹{apt.payment?.amount} • {apt.payment?.status}</span>
                    </div>
                    {apt.isAIBooking && (
                      <div className="apt-detail">
                        <span>🤖</span>
                        <span>AI Booked</span>
                      </div>
                    )}
                  </div>

                  {apt.symptoms && (
                    <div className="apt-symptoms">
                      <strong>Symptoms:</strong> {apt.symptoms}
                    </div>
                  )}

                  <div className="apt-actions">
                    {apt.status === 'confirmed' && apt.appointmentType === 'video' && (
                      <Link to={`/video/${apt.roomId}`} className="btn btn-success btn-sm">📹 Join Video Call</Link>
                    )}
                    {apt.status === 'confirmed' && apt.appointmentType === 'chat' && (
                      <Link to={`/chat/${apt.roomId}`} className="btn btn-primary btn-sm">💬 Open Chat</Link>
                    )}
                    {apt.status === 'pending' && apt.payment?.status === 'pending' && user?.role === 'patient' && (
                      <Link to={`/appointments`} className="btn btn-primary btn-sm">💳 Pay Now</Link>
                    )}
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(apt._id)}>Cancel</button>
                    )}
                    {apt.status === 'completed' && !apt.rating?.score && user?.role === 'patient' && (
                      <div className="rating-inline">
                        <span>Rate:</span>
                        {[1,2,3,4,5].map(s => (
                          <button key={s} className="star-btn" onClick={() => handleRate(apt._id, s)}>★</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const map = { pending: 'warning', confirmed: 'success', cancelled: 'error', completed: 'info', 'no-show': 'error' };
  return map[status] || 'info';
}
