import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Labs.css';

const CATEGORIES = [
  { id: 'all', label: 'All Tests', icon: '🔬' },
  { id: 'blood', label: 'Blood Tests', icon: '🩸' },
  { id: 'urine', label: 'Urine Tests', icon: '🧪' },
  { id: 'imaging', label: 'Imaging', icon: '📷' },
  { id: 'cardiac', label: 'Cardiac', icon: '❤️' },
  { id: 'hormone', label: 'Hormones', icon: '🧬' },
  { id: 'package', label: 'Health Packages', icon: '📦' }
];

export default function Labs() {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    fetchLabs();
  }, [city, category, sortBy]);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (category !== 'all') params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);
      if (search) params.append('search', search);
      const res = await api.get(`/labs?${params.toString()}`);
      setLabs(res.data.labs);
    } catch (err) {
      console.error('Failed to fetch labs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLabs();
  };

  const cities = [...new Set(labs.map(l => l.city))];

  return (
    <div className="labs-page">
      <div className="labs-hero">
        <img src="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&h=300&fit=crop" alt="" className="labs-hero-bg" />
        <div className="container">
          <h1>🔬 Book Lab Tests & Diagnostics</h1>
          <p>Find trusted diagnostic labs near you. Compare prices, book tests, and get reports online.</p>
          <form className="labs-search" onSubmit={handleSearch}>
            <div className="labs-search-input">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search tests (e.g., CBC, Thyroid, X-Ray, MRI...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="container labs-content">
        <div className="labs-filters">
          <div className="filter-group">
            <label>City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">Rating</option>
              <option value="bookings">Popularity</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        <div className="labs-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-chip ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="labs-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="lab-card skeleton">
                <div className="skeleton-img" />
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
              </div>
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="labs-empty">
            <span className="empty-icon">🔬</span>
            <h3>No labs found</h3>
            <p>Try adjusting your filters or search for a different city</p>
          </div>
        ) : (
          <div className="labs-grid">
            {labs.map(lab => (
              <Link to={`/labs/${lab._id}`} key={lab._id} className="lab-card">
                <div className="lab-card-header">
                  <img src={lab.avatar || 'https://ui-avatars.com/api/?name=Lab&background=4F46E5&color=fff'} alt={lab.name} className="lab-avatar" />
                  <div className="lab-header-info">
                    <h3>{lab.name}</h3>
                    <p className="lab-address">📍 {lab.address}, {lab.city}</p>
                    <div className="lab-badges">
                      {lab.isNABL && <span className="badge nabl">NABL Accredited</span>}
                      {lab.homeCollectionAvailable && <span className="badge home">🏠 Home Collection</span>}
                    </div>
                  </div>
                </div>
                <div className="lab-card-stats">
                  <div className="lab-stat">
                    <span className="stat-value">⭐ {lab.rating}</span>
                    <span className="stat-label">{lab.totalReviews} reviews</span>
                  </div>
                  <div className="lab-stat">
                    <span className="stat-value">{lab.tests?.length || lab.totalTests}</span>
                    <span className="stat-label">Tests</span>
                  </div>
                  <div className="lab-stat">
                    <span className="stat-value">{lab.totalBookings?.toLocaleString()}</span>
                    <span className="stat-label">Bookings</span>
                  </div>
                </div>
                <div className="lab-card-tests">
                  {lab.tests?.slice(0, 3).map((test, i) => (
                    <div key={i} className="test-preview">
                      <span className="test-name">{test.name}</span>
                      <span className="test-price">
                        {test.discountPrice && <span className="old-price">₹{test.price}</span>}
                        ₹{test.discountPrice || test.price}
                      </span>
                    </div>
                  ))}
                  {lab.tests?.length > 3 && (
                    <span className="more-tests">+{lab.tests.length - 3} more tests →</span>
                  )}
                </div>
                <div className="lab-card-footer">
                  <span className="lab-view-btn">View Tests & Book →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
