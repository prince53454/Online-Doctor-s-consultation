import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

export default function Home() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/doctors/featured')
      .then(res => setFeaturedDoctors(res.data.doctors || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/doctors?search=${searchQuery}`);
  };

  const specialties = [
    { icon: '❤️', name: 'Cardiology', slug: 'Cardiologist', image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300&h=200&fit=crop' },
    { icon: '🧠', name: 'Neurology', slug: 'Neurologist', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop' },
    { icon: '👶', name: 'Pediatrics', slug: 'Pediatrician', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=300&h=200&fit=crop' },
    { icon: '🧴', name: 'Dermatology', slug: 'Dermatologist', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=200&fit=crop' },
    { icon: '🦴', name: 'Orthopedics', slug: 'Orthopedic Surgeon', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=200&fit=crop' },
    { icon: '👁️', name: 'Ophthalmology', slug: 'Ophthalmologist', image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=300&h=200&fit=crop' },
    { icon: '🦷', name: 'Dentistry', slug: 'Dentist', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&h=200&fit=crop' },
    { icon: '🧘', name: 'Psychiatry', slug: 'Psychiatrist', image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=300&h=200&fit=crop' },
    { icon: '🫁', name: 'Pulmonology', slug: 'Pulmonologist', image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=300&h=200&fit=crop' },
    { icon: '🩺', name: 'General', slug: 'General Physician', image: 'https://images.unsplash.com/photo-1666214280368-00e3e089b3e0?w=300&h=200&fit=crop' },
    { icon: '👩', name: 'Gynecology', slug: 'Gynecologist', image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=300&h=200&fit=crop' },
    { icon: '🔬', name: 'Endocrinology', slug: 'Endocrinologist', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&h=200&fit=crop' },
  ];

  const features = [
    { icon: '🔍', title: 'Smart Search', desc: 'Find doctors by specialty, location, disease, and availability with AI-powered recommendations.', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop' },
    { icon: '📅', title: 'Easy Booking', desc: 'Book offline or online appointments instantly. AI auto-booking finds the best slot for you.', image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=250&fit=crop' },
    { icon: '📹', title: 'Video Consultation', desc: 'HD video calls with doctors from the comfort of your home. Secure & HIPAA compliant.', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=250&fit=crop' },
    { icon: '💬', title: 'Live Chat', desc: 'Real-time text consultations with instant messaging, file sharing, and prescriptions.', image: 'https://images.unsplash.com/photo-1573883430060-80d3a3a79d87?w=400&h=250&fit=crop' },
    { icon: '🤖', title: 'AI Symptom Checker', desc: 'Describe your symptoms and get instant specialist recommendations with urgency levels.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop' },
    { icon: '💳', title: 'Secure Payments', desc: 'Pay securely with multiple options. Automatic refunds on cancellations.', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop' },
    { icon: '📋', title: 'Medical Reports', desc: 'Upload, store, and share medical reports securely with your doctors.', image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=250&fit=crop' },
    { icon: '🛡️', title: 'Admin Dashboard', desc: 'Comprehensive admin panel for managing doctors, appointments, and platform analytics.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop' },
  ];

  const stats = [
    { value: '500+', label: 'Expert Doctors' },
    { value: '50K+', label: 'Happy Patients' },
    { value: '100K+', label: 'Appointments' },
    { value: '4.9', label: 'Average Rating' },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
          <img src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=800&fit=crop" alt="" className="hero-bg-img" />
        </div>
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              #1 Trusted Healthcare Platform in India
            </div>
            <h1 className="hero-title">
              Your Health, <br />
              <span className="gradient-text">Our Priority</span>
            </h1>
            <p className="hero-subtitle">
              Connect with top-rated doctors, book appointments instantly, and access quality
              healthcare through video calls, chat, or in-person visits — all from one platform.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search doctors, specialties, diseases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className="hero-tags">
              <span className="hero-tag">🔥 Cardiologist</span>
              <span className="hero-tag">🦷 Dentist</span>
              <span className="hero-tag">👶 Pediatrician</span>
              <span className="hero-tag">🧴 Dermatologist</span>
              <span className="hero-tag">🧘 Psychiatrist</span>
            </div>
          </div>

          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=600&fit=crop" alt="Doctor" className="hero-main-img" />
            <div className="hero-card hero-card-1">
              <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face" alt="Dr. Rajesh" className="hc-avatar-img" />
              <div className="hc-info">
                <h4>Dr. Rajesh Sharma</h4>
                <p>Cardiologist • ⭐ 4.9</p>
                <span className="badge badge-success">Available Now</span>
              </div>
            </div>
            <div className="hero-card hero-card-2">
              <div className="hc-icon">📹</div>
              <div className="hc-info">
                <h4>Video Consultation</h4>
                <p>HD quality video calls</p>
                <div className="hc-bar"><div className="hc-bar-fill"></div></div>
              </div>
            </div>
            <div className="hero-card hero-card-3">
              <img src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=80&h=80&fit=crop" alt="AI Health" className="hc-bg-img" />
              <div className="hc-info">
                <h4>AI Health Check</h4>
                <p>Smart symptom analysis</p>
                <div className="hc-status">
                  <span className="status-dot green"></span> Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      {featuredDoctors.length > 0 && (
        <section className="page-section featured-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Top Rated</span>
              <h2>Featured <span className="text-primary">Doctors</span></h2>
              <p>Meet our most trusted and highly-rated healthcare professionals.</p>
            </div>
            <div className="featured-grid">
              {featuredDoctors.slice(0, 4).map(doc => (
                <Link key={doc._id} to={`/doctors/${doc._id}`} className="featured-card">
                  <div className="featured-img-wrap">
                    <img src={doc.user?.avatar || `https://ui-avatars.com/api/?name=D&background=059669&color=fff`} alt={doc.user?.name} className="featured-img" />
                    {doc.isOnline && <span className="online-dot"></span>}
                  </div>
                  <div className="featured-info">
                    <h3>{doc.user?.name}</h3>
                    <p className="featured-spec">{doc.specialization}</p>
                    <div className="featured-meta">
                      <span className="featured-rating">⭐ {(doc.rating?.average || 4.8).toFixed(1)}</span>
                      <span className="featured-exp">{doc.experience}y exp</span>
                      <span className="featured-city">📍 {doc.location?.city || 'India'}</span>
                    </div>
                    <div className="featured-fee">₹{doc.consultationFee?.inPerson || 1000} <span>/ consult</span></div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center" style={{marginTop: 32}}>
              <Link to="/doctors" className="btn btn-primary btn-lg">View All Doctors →</Link>
            </div>
          </div>
        </section>
      )}

      {/* Specialties */}
      <section className="page-section specialties-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Browse by Specialty</span>
            <h2>Find the Right Doctor for <span className="text-primary">Every Need</span></h2>
            <p>Explore our wide range of medical specialties and find expert doctors near you.</p>
          </div>
          <div className="specialties-grid">
            {specialties.map((spec, i) => (
              <Link
                key={i}
                to={`/doctors?specialization=${spec.slug}`}
                className="specialty-card"
              >
                <div className="specialty-img-wrap">
                  <img src={spec.image} alt={spec.name} className="specialty-img" />
                  <div className="specialty-overlay">
                    <span className="specialty-icon">{spec.icon}</span>
                  </div>
                </div>
                <div className="specialty-content">
                  <h3>{spec.name}</h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-section features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Why Choose Us</span>
            <h2>Healthcare Made <span className="text-primary">Simple & Accessible</span></h2>
            <p>Everything you need for quality healthcare, all in one platform.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className="feature-img-wrap">
                  <img src={feature.image} alt={feature.title} className="feature-img" />
                </div>
                <div className="feature-body">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Checker CTA */}
      <section className="page-section ai-cta-section">
        <div className="container">
          <div className="ai-cta-card">
            <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop" alt="AI Health" className="ai-cta-bg" />
            <div className="ai-cta-content">
              <div className="ai-cta-badge">🤖 Powered by AI</div>
              <h2>Not sure which doctor to visit?</h2>
              <p>Our AI Symptom Checker analyzes your symptoms and recommends the right specialist instantly. Get personalized health insights in seconds.</p>
              <Link to="/ai-checker" className="btn btn-primary btn-lg">
                Try AI Symptom Checker →
              </Link>
            </div>
            <div className="ai-cta-visual">
              <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&h=300&fit=crop" alt="AI Doctor" className="ai-cta-img" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="page-section cta-section">
        <div className="container text-center">
          <div className="cta-images">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=face" alt="" className="cta-doc-img" />
            <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&h=120&fit=crop&crop=face" alt="" className="cta-doc-img" />
            <img src="https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=120&h=120&fit=crop&crop=face" alt="" className="cta-doc-img" />
            <img src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=120&h=120&fit=crop&crop=face" alt="" className="cta-doc-img" />
          </div>
          <h2>Ready to Take Control of Your Health?</h2>
          <p className="text-muted mb-3">Join thousands of patients who trust MediConnect for their healthcare needs.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free →</Link>
            <Link to="/doctors" className="btn btn-secondary btn-lg">Browse Doctors</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
