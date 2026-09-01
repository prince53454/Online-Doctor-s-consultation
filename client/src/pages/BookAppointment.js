import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import PaymentForm from '../components/PaymentForm';
import './BookAppointment.css';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [bookedAppointment, setBookedAppointment] = useState(null);

  const [formData, setFormData] = useState({
    appointmentType: searchParams.get('type') || 'in-person',
    date: '',
    selectedSlot: null,
    symptoms: '',
    medicalHistory: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`)
      .then(res => setDoctor(res.data.doctor))
      .catch(() => toast.error('Doctor not found'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (formData.date && doctorId) {
      api.get(`/doctors/${doctorId}/availability?date=${formData.date}`)
        .then(res => {
          const allSlots = res.data.availability?.flatMap(d => d.slots || []) || [];
          setAvailableSlots(allSlots.filter(s => s.isAvailable));
        })
        .catch(console.error);
    }
  }, [formData.date, doctorId]);

  const handleDateChange = (e) => {
    setFormData(prev => ({ ...prev, date: e.target.value, selectedSlot: null }));
  };

  // Step 3: Create the appointment (hold slot)
  const handleCreateAppointment = async () => {
    if (!formData.symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }
    if (!formData.date || !formData.selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/appointments', {
        doctorId,
        appointmentType: formData.appointmentType,
        date: formData.date,
        timeSlot: formData.selectedSlot,
        symptoms: formData.symptoms,
        medicalHistory: formData.medicalHistory
      });

      setBookedAppointment(res.data.appointment);
      setStep(4); // Move to payment
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4: Payment success callback
  const handlePaymentSuccess = (appointment) => {
    toast.success('Appointment booked and paid successfully! 🎉');
    setBookedAppointment(appointment);
    setStep(5); // Confirmation
  };

  const handlePaymentError = (error) => {
    toast.error(`Payment failed: ${error}`);
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!doctor) return <div className="container" style={{padding:'60px 0',textAlign:'center'}}><h2>Doctor not found</h2></div>;

  const user_ = doctor.user;
  const fee = doctor.consultationFee?.[formData.appointmentType === 'in-person' ? 'inPerson' : formData.appointmentType] || 0;
  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-layout">
          <div className="booking-main">
            <h1>Book Appointment</h1>
            <p className="text-muted mb-3">with {user_?.name} • {doctor.specialization}</p>

            {/* Progress */}
            <div className="booking-progress">
              {['Details', 'Schedule', 'Payment', 'Confirmed'].map((label, i) => (
                <div key={i} className={`progress-step ${step > i ? 'completed' : step === i + 1 ? 'active' : ''}`}>
                  <div className="step-circle">{i + 1}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Type & Symptoms */}
            {step === 1 && (
              <div className="booking-step animate-fadeIn">
                <h2>Consultation Details</h2>

                <div className="form-group">
                  <label className="form-label">Consultation Type</label>
                  <div className="type-selector">
                    {[
                      { value: 'in-person', icon: '🏥', label: 'In-Person', desc: 'Visit the clinic' },
                      { value: 'video', icon: '📹', label: 'Video Call', desc: 'Online video consultation' },
                      { value: 'chat', icon: '💬', label: 'Chat', desc: 'Text-based consultation' }
                    ].map(type => (
                      <button key={type.value}
                        className={`type-card ${formData.appointmentType === type.value ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, appointmentType: type.value }))}>
                        <span className="type-icon">{type.icon}</span>
                        <strong>{type.label}</strong>
                        <span>{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Describe Your Symptoms *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Please describe your symptoms, when they started, and any relevant medical history..."
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Medical History (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Any pre-existing conditions, allergies, or current medications..."
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                    rows={3}
                  />
                </div>

                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="booking-step animate-fadeIn">
                <h2>Select Date & Time</h2>

                <div className="form-group">
                  <label className="form-label">Select Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleDateChange}
                    min={minDate}
                    max={maxDate}
                  />
                </div>

                {formData.date && (
                  <div className="form-group">
                    <label className="form-label">Available Time Slots *</label>
                    {availableSlots.length === 0 ? (
                      <p className="text-muted">No slots available for this date. Please try another date.</p>
                    ) : (
                      <div className="slots-grid">
                        {availableSlots.map((slot, i) => (
                          <button
                            key={i}
                            className={`slot-btn ${formData.selectedSlot?.startTime === slot.startTime ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, selectedSlot: slot }))}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="step-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}
                    disabled={!formData.date || !formData.selectedSlot}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation + Create Appointment */}
            {step === 3 && (
              <div className="booking-step animate-fadeIn">
                <h2>Review & Confirm</h2>

                <div className="confirm-card">
                  <div className="confirm-row">
                    <span className="confirm-label">Doctor</span>
                    <span>{user_?.name}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Specialization</span>
                    <span>{doctor.specialization}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Type</span>
                    <span className="badge badge-primary">{formData.appointmentType}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Date</span>
                    <span>{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Time</span>
                    <span>{formData.selectedSlot?.startTime} - {formData.selectedSlot?.endTime}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Symptoms</span>
                    <span>{formData.symptoms}</span>
                  </div>
                  <div className="confirm-row total">
                    <span className="confirm-label">Total Fee</span>
                    <span className="fee-amount">₹{fee}</span>
                  </div>
                </div>

                <div className="step-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handleCreateAppointment} disabled={submitting}>
                    {submitting ? 'Reserving Slot...' : 'Proceed to Payment →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && bookedAppointment && (
              <div className="booking-step animate-fadeIn">
                <h2>💳 Payment</h2>
                <p className="text-muted mb-3">Complete your payment to confirm the appointment</p>

                <PaymentForm
                  appointmentId={bookedAppointment._id}
                  amount={fee}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

                <div className="step-actions mt-3">
                  <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {step === 5 && (
              <div className="booking-step animate-fadeIn booking-success">
                <div className="success-icon">✅</div>
                <h2>Appointment Booked Successfully!</h2>
                <p>Your appointment has been confirmed. You will receive a confirmation email shortly.</p>

                <div className="confirm-card mt-3">
                  <div className="confirm-row">
                    <span className="confirm-label">Doctor</span>
                    <span>{user_?.name}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Date</span>
                    <span>{formData.date && new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Time</span>
                    <span>{formData.selectedSlot?.startTime} - {formData.selectedSlot?.endTime}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-label">Type</span>
                    <span className="badge badge-primary">{formData.appointmentType}</span>
                  </div>
                  <div className="confirm-row total">
                    <span className="confirm-label">Amount Paid</span>
                    <span className="fee-amount">₹{fee}</span>
                  </div>
                </div>

                <div className="mt-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/appointments')}>View My Appointments</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="booking-sidebar">
            <div className="booking-card">
              <img src={user_?.avatar} alt="" className="sidebar-avatar" />
              <h3>{user_?.name}</h3>
              <p className="text-primary">{doctor.specialization}</p>
              <p className="text-sm text-muted">📍 {doctor.location?.city}</p>

              <div className="sidebar-fees">
                <div className="fee-option">
                  <span>🏥 In-Person</span>
                  <strong>₹{doctor.consultationFee?.inPerson}</strong>
                </div>
                <div className="fee-option">
                  <span>📹 Video</span>
                  <strong>₹{doctor.consultationFee?.video}</strong>
                </div>
                <div className="fee-option">
                  <span>💬 Chat</span>
                  <strong>₹{doctor.consultationFee?.chat}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
