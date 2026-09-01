import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './DoctorProfile.css';

export default function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then(res => {
        setDoctor(res.data.doctor);
        setReviews(res.data.reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!doctor) return <div className="container" style={{padding:'60px 0',textAlign:'center'}}><h2>Doctor not found</h2></div>;

  const user = doctor.user;
  const name = user?.name || 'Doctor';

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <img src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=400&fit=crop" alt="" className="profile-hero-bg" />
        <div className="container">
          <div className="profile-hero-content">
            <img src={user?.avatar} alt={name} className="profile-avatar" />
            <div className="profile-info">
              <div className="profile-badges">
                {doctor.isApproved && <span className="badge badge-success">✓ Verified</span>}
                {doctor.isFeatured && <span className="badge badge-warning">⭐ Featured</span>}
                {doctor.isOnline && <span className="badge badge-success">● Online Now</span>}
              </div>
              <h1>{name}</h1>
              <p className="profile-spec">{doctor.specialization}</p>
              <div className="profile-meta">
                <span>📍 {doctor.location?.city || 'India'}</span>
                <span>💼 {doctor.experience} years experience</span>
                <span>🏥 {doctor.clinicName}</span>
              </div>
              <div className="profile-rating">
                <span className="stars-lg">{'★'.repeat(Math.round(doctor.rating?.average || 0))}</span>
                <span className="rating-num">{(doctor.rating?.average || 0).toFixed(1)}</span>
                <span className="text-muted">({doctor.rating?.count || 0} reviews)</span>
                <span className="text-muted">• {doctor.totalPatients || 0} patients</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-content">
        <div className="profile-layout">
          <div className="profile-main">
            {/* Tabs */}
            <div className="profile-tabs">
              {['about', 'availability', 'reviews'].map(tab => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* About */}
            {activeTab === 'about' && (
              <div className="tab-content animate-fadeIn">
                <div className="info-card">
                  <h3>About</h3>
                  <p>{doctor.about || 'No information available.'}</p>
                </div>

                {doctor.qualification?.length > 0 && (
                  <div className="info-card">
                    <h3>Qualifications</h3>
                    {doctor.qualification.map((q, i) => (
                      <div key={i} className="qualification-item">
                        <strong>{q.degree}</strong>
                        <span>{q.institution}, {q.year}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="info-card">
                  <h3>Specializations</h3>
                  <div className="tag-list">
                    <span className="badge badge-primary">{doctor.specialization}</span>
                    {doctor.subSpecialization?.map(s => (
                      <span key={s} className="badge badge-info">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="info-card">
                  <h3>Languages</h3>
                  <div className="tag-list">
                    {doctor.languagesKnown?.map(l => (
                      <span key={l} className="badge badge-primary">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Availability */}
            {activeTab === 'availability' && (
              <div className="tab-content animate-fadeIn">
                <div className="info-card">
                  <h3>Weekly Schedule</h3>
                  <div className="schedule-grid">
                    {doctor.availability?.map(day => (
                      <div key={day.day} className="schedule-day">
                        <h4>{day.day}</h4>
                        <div className="schedule-slots">
                          {day.slots?.map((slot, i) => (
                            <span key={i} className={`slot-badge ${slot.isAvailable ? 'available' : 'unavailable'}`}>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="tab-content animate-fadeIn">
                {reviews.length === 0 ? (
                  <div className="no-results"><p>No reviews yet.</p></div>
                ) : (
                  <div className="reviews-list">
                    {reviews.map(review => (
                      <div key={review._id} className="review-card">
                        <div className="review-header">
                          <img src={review.patient?.avatar} alt="" className="review-avatar" />
                          <div>
                            <h4>{review.patient?.name}</h4>
                            <div className="review-rating">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                              <span className="text-muted">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <p>{review.review}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            <div className="booking-card">
              <h3>Consultation Fee</h3>
              <div className="fee-cards">
                <div className="fee-option">
                  <span className="fee-type">🏥 In-Person</span>
                  <span className="fee-price">₹{doctor.consultationFee?.inPerson}</span>
                </div>
                <div className="fee-option">
                  <span className="fee-type">📹 Video</span>
                  <span className="fee-price">₹{doctor.consultationFee?.video}</span>
                </div>
                <div className="fee-option">
                  <span className="fee-type">💬 Chat</span>
                  <span className="fee-price">₹{doctor.consultationFee?.chat}</span>
                </div>
              </div>

              <div className="booking-actions">
                <Link to={`/book/${doctor._id}?type=in-person`} className="btn btn-primary btn-lg btn-full">
                  Book Appointment
                </Link>
                <Link to={`/book/${doctor._id}?type=video`} className="btn btn-secondary btn-lg btn-full">
                  Video Consultation
                </Link>
                <Link to={`/book/${doctor._id}?type=chat`} className="btn btn-ghost btn-lg btn-full">
                  Chat Consultation
                </Link>
              </div>

              <div className="booking-info">
                <p>🕐 Response time: {doctor.responseTime}</p>
                <p>📞 Languages: {doctor.languagesKnown?.join(', ')}</p>
                <p>🏛️ Clinic: {doctor.clinicName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
