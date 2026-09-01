import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Doctors.css';

export default function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialization: searchParams.get('specialization') || '',
    city: searchParams.get('city') || '',
    consultationType: searchParams.get('type') || '',
    minRating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || '-rating.average'
  });
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);
  const [page, setPage] = useState(1);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('page', page);
      params.set('limit', 12);

      const res = await api.get(`/doctors?${params}`);
      setDoctors(res.data.doctors);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Fetch doctors error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    api.get('/doctors/specializations').then(res => setSpecializations(res.data.specializations || []));
    api.get('/doctors/cities').then(res => setCities(res.data.cities || []));
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="doctors-page">
      <div className="doctors-hero">
        <img src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=300&fit=crop" alt="" className="doctors-hero-bg" />
        <div className="container">
          <h1>Find Your Doctor</h1>
          <p>Search from our network of verified and experienced healthcare professionals</p>
          <div className="search-bar-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, specialty, disease, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <button className="btn btn-primary" onClick={fetchDoctors}>Search</button>
          </div>
        </div>
      </div>

      <div className="container doctors-content">
        <div className="doctors-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setFilters({ search: '', specialization: '', city: '', consultationType: '', minRating: '', sort: '-rating.average' });
                setPage(1);
              }}>Clear All</button>
            </div>

            <div className="filter-group">
              <label className="filter-label">Specialization</label>
              <select value={filters.specialization} onChange={(e) => handleFilterChange('specialization', e.target.value)} className="form-select">
                <option value="">All Specializations</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">City</label>
              <select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} className="form-select">
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Consultation Type</label>
              <select value={filters.consultationType} onChange={(e) => handleFilterChange('consultationType', e.target.value)} className="form-select">
                <option value="">All Types</option>
                <option value="in-person">In-Person</option>
                <option value="video">Video Consultation</option>
                <option value="chat">Chat Consultation</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Minimum Rating</label>
              <select value={filters.minRating} onChange={(e) => handleFilterChange('minRating', e.target.value)} className="form-select">
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} className="form-select">
                <option value="-rating.average">Highest Rated</option>
                <option value="-experience">Most Experienced</option>
                <option value="consultationFee.inPerson">Lowest Fee</option>
                <option value="-totalPatients">Most Patients</option>
              </select>
            </div>
          </aside>

          {/* Results */}
          <div className="doctors-results">
            <div className="results-header">
              <span>{pagination.total || 0} doctors found</span>
            </div>

            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : doctors.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No doctors found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <>
                <div className="doctors-grid">
                  {doctors.map(doctor => (
                    <DoctorCard key={doctor._id} doctor={doctor} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                    <span className="page-info">Page {page} of {pagination.pages}</span>
                    <button className="btn btn-ghost btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorCard({ doctor }) {
  const user = doctor.user;
  const name = user?.name || 'Doctor';
  const fee = doctor.consultationFee?.inPerson || 0;

  return (
    <Link to={`/doctors/${doctor._id}`} className="doctor-card card">
      <div className="card-body">
        <div className="dc-header">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${name}&background=059669&color=fff`}
            alt={name}
            className="dc-avatar"
          />
          <div className="dc-info">
            <h3>{name}</h3>
            <p className="dc-spec">{doctor.specialization}</p>
            <div className="dc-rating">
              <span className="stars">{'★'.repeat(Math.round(doctor.rating?.average || 0))}</span>
              <span>{(doctor.rating?.average || 0).toFixed(1)}</span>
              <span className="text-muted">({doctor.rating?.count || 0})</span>
            </div>
          </div>
        </div>

        <div className="dc-details">
          <div className="dc-detail">
            <span className="dc-label">📍</span>
            <span>{doctor.location?.city || 'India'}</span>
          </div>
          <div className="dc-detail">
            <span className="dc-label">🏥</span>
            <span>{doctor.clinicName || 'Private Clinic'}</span>
          </div>
          <div className="dc-detail">
            <span className="dc-label">💼</span>
            <span>{doctor.experience} years exp</span>
          </div>
        </div>

        <div className="dc-tags">
          {doctor.isOnline && <span className="badge badge-success">Online</span>}
          {doctor.acceptOnlineConsultation && <span className="badge badge-info">Video Available</span>}
          {doctor.isFeatured && <span className="badge badge-warning">Featured</span>}
        </div>

        <div className="dc-footer">
          <div className="dc-fee">
            <span className="fee-amount">₹{fee}</span>
            <span className="fee-label">consultation</span>
          </div>
          <button className="btn btn-primary btn-sm">Book Now</button>
        </div>
      </div>
    </Link>
  );
}
