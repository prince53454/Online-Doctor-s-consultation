import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './DoctorRegister.css';

const SPECIALIZATIONS = [
  { value: 'General Physician', icon: '🩺' },
  { value: 'Cardiologist', icon: '❤️' },
  { value: 'Dermatologist', icon: '🧴' },
  { value: 'Pediatrician', icon: '👶' },
  { value: 'Gynecologist', icon: '👩' },
  { value: 'Orthopedic Surgeon', icon: '🦴' },
  { value: 'Neurologist', icon: '🧠' },
  { value: 'Psychiatrist', icon: '🧘' },
  { value: 'ENT Specialist', icon: '👂' },
  { value: 'Endocrinologist', icon: '🔬' },
  { value: 'Pulmonologist', icon: '🫁' },
  { value: 'Ophthalmologist', icon: '👁️' },
  { value: 'Urologist', icon: '🏥' },
  { value: 'Gastroenterologist', icon: '🩻' },
  { value: 'Oncologist', icon: '🎗️' },
  { value: 'Dentist', icon: '🦷' },
];

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata',
  'Jaipur', 'Lucknow', 'Ahmedabad', 'Chandigarh', 'Kochi', 'Bhopal', 'Patna', 'Indore'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorRegister() {
  const { register: authRegister, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const [form, setForm] = useState({
    // Step 1: Personal
    name: '', email: '', password: '', confirmPassword: '', phone: '', gender: '',
    // Step 2: Professional
    specialization: '', licenseNumber: '', experience: '',
    qualification: [{ degree: '', institution: '', year: '' }],
    about: '',
    // Step 3: Clinic
    clinicName: '', clinicAddress: '', city: '', state: '',
    // Step 4: Fees
    feeInPerson: '', feeVideo: '', feeChat: '',
    // Step 5: Schedule
    availability: DAYS.reduce((acc, day) => ({
      ...acc, [day]: { enabled: day !== 'Sunday', slots: day !== 'Sunday' ? [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '17:00' }] : [] }
    }), {}),
    languagesKnown: ['English', 'Hindi'],
  });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateQualification = (index, field, value) => {
    const updated = [...form.qualification];
    updated[index][field] = value;
    setForm(prev => ({ ...prev, qualification: updated }));
  };

  const addQualification = () => {
    setForm(prev => ({ ...prev, qualification: [...prev.qualification, { degree: '', institution: '', year: '' }] }));
  };

  const toggleDay = (day) => {
    const avail = { ...form.availability };
    avail[day].enabled = !avail[day].enabled;
    if (avail[day].enabled && avail[day].slots.length === 0) {
      avail[day].slots = [{ startTime: '09:00', endTime: '12:00' }, { startTime: '14:00', endTime: '17:00' }];
    }
    updateForm('availability', avail);
  };

  const updateSlot = (day, index, field, value) => {
    const avail = { ...form.availability };
    avail[day].slots[index][field] = value;
    updateForm('availability', avail);
  };

  const addSlot = (day) => {
    const avail = { ...form.availability };
    avail[day].slots.push({ startTime: '10:00', endTime: '11:00' });
    updateForm('availability', avail);
  };

  const removeSlot = (day, index) => {
    const avail = { ...form.availability };
    avail[day].slots.splice(index, 1);
    updateForm('availability', avail);
  };

  const handleDocumentSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      setDocuments(prev => [...prev, { file, name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', type: file.type }]);
    });
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register the user account
      const regRes = await authRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: 'doctor',
        gender: form.gender,
      });

      // Step 2: Update doctor profile
      const availability = Object.entries(form.availability)
        .filter(([_, data]) => data.enabled)
        .map(([day, data]) => ({ day, slots: data.slots.map(s => ({ ...s, isAvailable: true, maxPatients: 1 })) }));

      await api.put('/doctors/profile', {
        specialization: form.specialization,
        experience: Number(form.experience),
        licenseNumber: form.licenseNumber,
        qualification: form.qualification.filter(q => q.degree),
        consultationFee: {
          inPerson: Number(form.feeInPerson) || 500,
          video: Number(form.feeVideo) || 300,
          chat: Number(form.feeChat) || 200,
        },
        clinicName: form.clinicName,
        clinicAddress: form.clinicAddress,
        location: { type: 'Point', coordinates: [77.2 + Math.random() * 10, 28.5 + Math.random() * 5], city: form.city, state: form.state || '', country: 'India' },
        availability,
        languagesKnown: form.languagesKnown,
        about: form.about,
        isApproved: false,
        tags: [form.specialization.toLowerCase(), form.city.toLowerCase()],
      });

      toast.success('Registration submitted! Waiting for admin approval.');
      navigate('/doctor/pending');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.name && form.email && form.password && form.confirmPassword && form.password === form.confirmPassword;
      case 2: return form.specialization && form.licenseNumber && form.experience;
      case 3: return form.clinicName && form.city;
      case 4: return form.feeInPerson || form.feeVideo || form.feeChat;
      case 5: return Object.values(form.availability).some(d => d.enabled && d.slots.length > 0);
      default: return true;
    }
  };

  return (
    <div className="dr-reg-page">
      <div className="dr-reg-container">
        <div className="dr-reg-header">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>🩺 Medi<span style={{color:'#059669'}}>Connect</span></h1>
          </Link>
          <p>Complete your doctor profile to start accepting patients</p>
        </div>

        {/* Progress */}
        <div className="dr-reg-progress">
          {['Personal Info', 'Credentials', 'Clinic', 'Fees', 'Schedule', 'Review'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`dr-reg-step ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : ''}`}>
                <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
                <span className="step-label">{label}</span>
              </div>
              {i < 5 && <div className="dr-reg-step-line" />}
            </React.Fragment>
          ))}
        </div>

        <div className="dr-reg-card">
          <div className="dr-reg-card-body">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div>
                <h2 className="dr-reg-section-title">Personal Information</h2>
                <p className="dr-reg-section-desc">Basic details about yourself</p>
                <div className="dr-reg-grid">
                  <div className="form-group full">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="Dr. Your Name" value={form.name} onChange={e => updateForm('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => updateForm('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => updateForm('password', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} />
                    {form.confirmPassword && form.password !== form.confirmPassword && <small style={{color:'#ef4444',fontSize:12}}>Passwords don't match</small>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={e => updateForm('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Professional Credentials */}
            {step === 2 && (
              <div>
                <h2 className="dr-reg-section-title">Medical Credentials</h2>
                <p className="dr-reg-section-desc">Your professional qualifications and specialization</p>

                <div className="form-group" style={{marginBottom:20}}>
                  <label className="form-label">Specialization *</label>
                  <div className="spec-grid">
                    {SPECIALIZATIONS.map(spec => (
                      <div key={spec.value} className={`spec-option ${form.specialization === spec.value ? 'selected' : ''}`} onClick={() => updateForm('specialization', spec.value)}>
                        <span className="spec-icon">{spec.icon}</span>
                        {spec.value}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dr-reg-grid">
                  <div className="form-group">
                    <label className="form-label">Medical License Number *</label>
                    <input className="form-input" placeholder="MCI-XXXXX" value={form.licenseNumber} onChange={e => updateForm('licenseNumber', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of Experience *</label>
                    <input className="form-input" type="number" min="0" placeholder="e.g., 10" value={form.experience} onChange={e => updateForm('experience', e.target.value)} />
                  </div>
                </div>

                <div style={{marginTop:16}}>
                  <label className="form-label">Qualifications</label>
                  {form.qualification.map((q, i) => (
                    <div key={i} className="dr-reg-grid" style={{marginBottom:8}}>
                      <input className="form-input" placeholder="Degree (e.g., MBBS, MD)" value={q.degree} onChange={e => updateQualification(i, 'degree', e.target.value)} />
                      <input className="form-input" placeholder="Institution" value={q.institution} onChange={e => updateQualification(i, 'institution', e.target.value)} />
                    </div>
                  ))}
                  <button className="add-slot-btn" onClick={addQualification}>+ Add Qualification</button>
                </div>

                <div className="form-group" style={{marginTop:16}}>
                  <label className="form-label">About / Bio</label>
                  <textarea className="form-textarea" placeholder="Tell patients about your experience, approach, and expertise..." value={form.about} onChange={e => updateForm('about', e.target.value)} rows={4} />
                </div>
              </div>
            )}

            {/* STEP 3: Clinic Info */}
            {step === 3 && (
              <div>
                <h2 className="dr-reg-section-title">Clinic / Practice Details</h2>
                <p className="dr-reg-section-desc">Where patients can find you</p>
                <div className="dr-reg-grid">
                  <div className="form-group full">
                    <label className="form-label">Clinic / Hospital Name *</label>
                    <input className="form-input" placeholder="e.g., Apollo Hospital" value={form.clinicName} onChange={e => updateForm('clinicName', e.target.value)} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Clinic Address</label>
                    <input className="form-input" placeholder="Full address" value={form.clinicAddress} onChange={e => updateForm('clinicAddress', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <select className="form-select" value={form.city} onChange={e => updateForm('city', e.target.value)}>
                      <option value="">Select City</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" placeholder="State" value={form.state} onChange={e => updateForm('state', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Fees */}
            {step === 4 && (
              <div>
                <h2 className="dr-reg-section-title">Consultation Fees</h2>
                <p className="dr-reg-section-desc">Set your fees for different consultation types (in ₹)</p>
                <div className="fee-inputs">
                  <div className="fee-input-group">
                    <label>🏥 In-Person Visit</label>
                    <input className="fee-input" type="number" min="0" placeholder="500" value={form.feeInPerson} onChange={e => updateForm('feeInPerson', e.target.value)} />
                  </div>
                  <div className="fee-input-group">
                    <label>📹 Video Consultation</label>
                    <input className="fee-input" type="number" min="0" placeholder="300" value={form.feeVideo} onChange={e => updateForm('feeVideo', e.target.value)} />
                  </div>
                  <div className="fee-input-group">
                    <label>💬 Chat Consultation</label>
                    <input className="fee-input" type="number" min="0" placeholder="200" value={form.feeChat} onChange={e => updateForm('feeChat', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Schedule */}
            {step === 5 && (
              <div>
                <h2 className="dr-reg-section-title">Weekly Schedule</h2>
                <p className="dr-reg-section-desc">Set your available days and time slots</p>
                <div className="schedule-builder">
                  {DAYS.map(day => (
                    <div key={day} className="schedule-day-row">
                      <div className="schedule-day-toggle">
                        <input type="checkbox" id={`day-${day}`} checked={form.availability[day].enabled} onChange={() => toggleDay(day)} />
                        <label htmlFor={`day-${day}`}>{day}</label>
                      </div>
                      {form.availability[day].enabled && (
                        <div className="schedule-slots-row">
                          {form.availability[day].slots.map((slot, i) => (
                            <React.Fragment key={i}>
                              <input className="slot-time-input" type="time" value={slot.startTime} onChange={e => updateSlot(day, i, 'startTime', e.target.value)} />
                              <span style={{fontSize:12,color:'var(--gray-400)',alignSelf:'center'}}>-</span>
                              <input className="slot-time-input" type="time" value={slot.endTime} onChange={e => updateSlot(day, i, 'endTime', e.target.value)} />
                              {form.availability[day].slots.length > 1 && (
                                <button className="remove-slot-btn" onClick={() => removeSlot(day, i)}>×</button>
                              )}
                            </React.Fragment>
                          ))}
                          <button className="add-slot-btn" onClick={() => addSlot(day)}>+ Slot</button>
                        </div>
                      )}
                      {!form.availability[day].enabled && <span style={{fontSize:12,color:'var(--gray-400)'}}>Day off</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Review */}
            {step === 6 && (
              <div>
                <h2 className="dr-reg-section-title">Review Your Profile</h2>
                <p className="dr-reg-section-desc">Please review all details before submitting</p>

                <div className="review-section">
                  <h4>👤 Personal Information</h4>
                  <div className="review-row"><span className="review-label">Name</span><span className="review-value">{form.name}</span></div>
                  <div className="review-row"><span className="review-label">Email</span><span className="review-value">{form.email}</span></div>
                  <div className="review-row"><span className="review-label">Phone</span><span className="review-value">{form.phone || 'Not provided'}</span></div>
                </div>

                <div className="review-section">
                  <h4>🩺 Medical Credentials</h4>
                  <div className="review-row"><span className="review-label">Specialization</span><span className="review-value">{form.specialization}</span></div>
                  <div className="review-row"><span className="review-label">License</span><span className="review-value">{form.licenseNumber}</span></div>
                  <div className="review-row"><span className="review-label">Experience</span><span className="review-value">{form.experience} years</span></div>
                  {form.qualification.filter(q => q.degree).map((q, i) => (
                    <div className="review-row" key={i}><span className="review-label">Qualification</span><span className="review-value">{q.degree} {q.institution && `- ${q.institution}`}</span></div>
                  ))}
                </div>

                <div className="review-section">
                  <h4>🏥 Clinic Details</h4>
                  <div className="review-row"><span className="review-label">Clinic</span><span className="review-value">{form.clinicName}</span></div>
                  <div className="review-row"><span className="review-label">Location</span><span className="review-value">{form.clinicAddress || 'N/A'}, {form.city}</span></div>
                </div>

                <div className="review-section">
                  <h4>💰 Consultation Fees</h4>
                  <div className="review-row"><span className="review-label">In-Person</span><span className="review-value">₹{form.feeInPerson}</span></div>
                  <div className="review-row"><span className="review-label">Video</span><span className="review-value">₹{form.feeVideo}</span></div>
                  <div className="review-row"><span className="review-label">Chat</span><span className="review-value">₹{form.feeChat}</span></div>
                </div>

                <div className="review-section">
                  <h4>🕐 Schedule</h4>
                  {DAYS.filter(d => form.availability[d].enabled).map(d => (
                    <div className="review-row" key={d}>
                      <span className="review-label">{d}</span>
                      <span className="review-value">{form.availability[d].slots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}</span>
                    </div>
                  ))}
                </div>

                {documents.length > 0 && (
                  <div className="review-section">
                    <h4>📄 Documents ({documents.length})</h4>
                    {documents.map((doc, i) => (
                      <div className="review-row" key={i}><span className="review-label">{doc.name}</span><span className="review-value">{doc.size}</span></div>
                    ))}
                  </div>
                )}

                <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:16,marginTop:16}}>
                  <p style={{fontSize:13,color:'#92400e',lineHeight:1.6}}>
                    ⚠️ After submission, your profile will be reviewed by our admin team. You'll receive access to the Doctor Dashboard once approved. This usually takes 24-48 hours.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="dr-reg-card-footer">
            <div>
              {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>}
            </div>
            <div style={{display:'flex',gap:10}}>
              {step < 6 && (
                <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Continue →
                </button>
              )}
              {step === 6 && (
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                  {loading ? '⏳ Submitting...' : '🚀 Submit for Approval'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
