import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Labs.css';

const TEST_CATEGORIES = [
  { id: 'all', label: 'All Tests', icon: '🔬' },
  { id: 'blood', label: 'Blood', icon: '🩸' },
  { id: 'urine', label: 'Urine', icon: '🧪' },
  { id: 'imaging', label: 'Imaging', icon: '📷' },
  { id: 'cardiac', label: 'Cardiac', icon: '❤️' },
  { id: 'hormone', label: 'Hormones', icon: '🧬' },
  { id: 'package', label: 'Packages', icon: '📦' }
];

export default function LabDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedTests, setSelectedTests] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [homeCollection, setHomeCollection] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '', landmark: '' });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchLab();
  }, [id]);

  useEffect(() => {
    fetchTests();
  }, [id, category, sortBy, search]);

  const fetchLab = async () => {
    try {
      const res = await api.get(`/labs/${id}`);
      setLab(res.data.lab);
      setAddress({ ...address, city: res.data.lab.city || '', state: res.data.lab.state || '' });
    } catch (err) {
      toast.error('Lab not found');
      navigate('/labs');
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);
      if (search) params.append('search', search);
      const res = await api.get(`/labs/${id}/tests?${params.toString()}`);
      setTests(res.data.tests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t._id === test._id);
      if (exists) return prev.filter(t => t._id !== test._id);
      return [...prev, test];
    });
  };

  const totalAmount = selectedTests.reduce((sum, t) => sum + (t.discountPrice || t.price), 0);
  const homeCollectionFee = homeCollection ? (lab?.homeCollectionFee || 0) : 0;

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book lab tests');
      navigate('/login');
      return;
    }
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }
    if (!appointmentDate) {
      toast.error('Please select a date');
      return;
    }
    if (homeCollection && (!address.street || !address.pincode)) {
      toast.error('Please fill your collection address');
      return;
    }

    try {
      setBooking(true);
      const res = await api.post('/labs/orders', {
        labId: id,
        tests: selectedTests.map(t => ({ testId: t._id })),
        appointmentDate,
        appointmentTime,
        homeCollection,
        collectionAddress: homeCollection ? address : undefined
      });
      toast.success('🎉 Lab test booked successfully!');
      navigate('/my-lab-orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (!lab) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="lab-detail-page">
      <div className="lab-detail-hero">
        <img src="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&h=300&fit=crop" alt="" className="lab-detail-hero-bg" />
        <div className="container">
          <div className="lab-detail-header">
            <img src={lab.avatar} alt={lab.name} className="lab-detail-avatar" />
            <div className="lab-detail-info">
              <h1>{lab.name}</h1>
              <p style={{ opacity: 0.9, margin: '0 0 8px' }}>{lab.description}</p>
              <div className="lab-detail-meta">
                <span>⭐ {lab.rating} ({lab.totalReviews} reviews)</span>
                <span>📍 {lab.address}, {lab.city}</span>
                <span>🔬 {lab.tests?.length} tests</span>
                {lab.isNABL && <span>✅ NABL Accredited</span>}
                {lab.homeCollectionAvailable && <span>🏠 Home Collection</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="lab-detail-content">
          <div className="tests-section">
            <h2>Available Tests ({tests.length})</h2>
            <div className="tests-filters">
              {TEST_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-chip ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginLeft: 'auto', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {tests.map(test => {
              const isSelected = selectedTests.find(t => t._id === test._id);
              return (
                <div key={test._id} className={`test-card ${isSelected ? 'selected' : ''}`}>
                  <div className="test-card-info">
                    <h4>
                      {test.popular && <span style={{ color: '#F59E0B' }}>⭐ </span>}
                      {test.name}
                    </h4>
                    {test.description && <p>{test.description}</p>}
                    <div className="test-card-meta">
                      {test.fastingRequired && <span className="test-meta-item">🚫 Fasting Required</span>}
                      <span className="test-meta-item">⏱ {test.reportTime}</span>
                      {test.homeCollection && <span className="test-meta-item">🏠 Home Available</span>}
                    </div>
                  </div>
                  <div className="test-card-pricing">
                    {test.discountPrice && test.discountPrice < test.price && (
                      <div className="test-original-price">₹{test.price}</div>
                    )}
                    <div className="test-discount-price">₹{test.discountPrice || test.price}</div>
                    <button
                      className={`test-add-btn ${isSelected ? 'added' : ''}`}
                      onClick={() => toggleTest(test)}
                    >
                      {isSelected ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="booking-sidebar">
            <div className="booking-summary">
              <h3>📋 Booking Summary</h3>
              {selectedTests.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '14px' }}>Select tests from the left to add them here</p>
              ) : (
                <>
                  {selectedTests.map(test => (
                    <div key={test._id} className="selected-test">
                      <span>{test.name}</span>
                      <span style={{ fontWeight: 600 }}>₹{test.discountPrice || test.price}</span>
                    </div>
                  ))}
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <label className="home-collection-toggle">
                      <input type="checkbox" checked={homeCollection} onChange={(e) => setHomeCollection(e.target.checked)} />
                      🏠 Home Collection {homeCollectionFee > 0 && `(+₹${homeCollectionFee})`}
                    </label>
                  </div>
                  {homeCollection && (
                    <div style={{ padding: '8px 0' }}>
                      <input placeholder="Street Address" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
                      <input placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
                      <input placeholder="Landmark (optional)" value={address.landmark} onChange={(e) => setAddress({...address, landmark: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
                    </div>
                  )}
                  <div className="booking-date-input">
                    <label>📅 Appointment Date</label>
                    <input type="date" min={getMinDate()} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                  </div>
                  <div className="booking-date-input">
                    <label>🕐 Preferred Time</label>
                    <select value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                  {homeCollectionFee > 0 && (
                    <div className="selected-test">
                      <span>Home Collection Fee</span>
                      <span>₹{homeCollectionFee}</span>
                    </div>
                  )}
                  <div className="booking-total">
                    <span>Total</span>
                    <span>₹{totalAmount + homeCollectionFee}</span>
                  </div>
                  <button className="book-test-btn" onClick={handleBooking} disabled={booking}>
                    {booking ? '⏳ Booking...' : `🧪 Book ${selectedTests.length} Test(s) — ₹${totalAmount + homeCollectionFee}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
