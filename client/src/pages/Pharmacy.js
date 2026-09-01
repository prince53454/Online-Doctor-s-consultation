import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Pharmacy.css';

const CATEGORIES = [
  { id: '', label: 'All', icon: '💊' },
  { id: 'otc', label: 'OTC Medicines', icon: '💊' },
  { id: 'prescription', label: 'Prescription', icon: '📋' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'personal-care', label: 'Personal Care', icon: '🧴' },
  { id: 'baby-care', label: 'Baby Care', icon: '👶' },
  { id: 'diabetic-care', label: 'Diabetic Care', icon: '🩸' },
  { id: 'ayurvedic', label: 'Ayurvedic', icon: '🌿' },
  { id: 'homeopathy', label: 'Homeopathy', icon: '💧' }
];

export default function Pharmacy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pharmacyCart')) || []; } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState('medicines'); // 'medicines' or 'stores'

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('pharmacyCart', JSON.stringify(cart));
  }, [cart]);

  // Fetch medicines
  const fetchMedicines = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await api.get(`/pharmacy/medicines?${params.toString()}`);
      setMedicines(res.data.medicines || []);
    } catch (err) {
      console.error(err);
    }
  }, [search, category, sortBy]);

  // Fetch pharmacies
  const fetchPharmacies = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy');
      setPharmacies(res.data.pharmacies || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMedicines(), fetchPharmacies()])
      .finally(() => setLoading(false));
  }, [fetchMedicines, fetchPharmacies]);

  const addToCart = (medicine) => {
    if (medicine.requirePrescription && !user) {
      toast.error('Please login to order prescription medicines');
      return;
    }
    const existing = cart.find(item => item.medicineId === medicine._id);
    if (existing) {
      setCart(cart.map(item =>
        item.medicineId === medicine._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        medicineId: medicine._id,
        name: medicine.name,
        price: medicine.discountPrice || medicine.price,
        originalPrice: medicine.price,
        image: medicine.image,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        requirePrescription: medicine.requirePrescription,
        quantity: 1
      }]);
    }
    toast.success(`${medicine.name} added to cart`);
  };

  const updateQuantity = (medicineId, delta) => {
    setCart(cart.map(item => {
      if (item.medicineId === medicineId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="pharmacy-page">
      {/* Hero */}
      <div className="pharmacy-hero">
        <img src="https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=1200&h=350&fit=crop" alt="" className="pharmacy-hero-bg" />
        <div className="container">
          <h1>💊 Online Pharmacy</h1>
          <p>Order medicines online & get them delivered to your doorstep in 2-4 hours</p>
          <div className="pharmacy-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search medicines, health products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="container pharmacy-content">
        {/* Quick Info Banner */}
        <div className="pharmacy-info-bar">
          <div className="info-item">
            <span className="info-icon">🚚</span>
            <span><strong>Free Delivery</strong> on orders above ₹500</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <span><strong>2-4 Hours</strong> delivery</span>
          </div>
          <div className="info-item">
            <span className="info-icon">✅</span>
            <span><strong>100% Genuine</strong> medicines</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📋</span>
            <span><strong>Upload Prescription</strong> for Rx drugs</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="pharmacy-tabs">
          <button className={`tab-btn ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => setActiveTab('medicines')}>
            💊 Medicines ({medicines.length})
          </button>
          <button className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`} onClick={() => setActiveTab('stores')}>
            🏪 Pharmacy Stores ({pharmacies.length})
          </button>
          {cartCount > 0 && (
            <button className="tab-btn cart-tab" onClick={() => navigate('/pharmacy/cart')}>
              🛒 Cart ({cartCount}) — ₹{cartTotal}
            </button>
          )}
        </div>

        {/* Categories */}
        {activeTab === 'medicines' && (
          <div className="category-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`chip ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        {activeTab === 'medicines' && (
          <div className="pharmacy-sort">
            <span className="sort-label">Sort by:</span>
            {[
              { value: 'popular', label: 'Popularity' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
              { value: 'rating', label: 'Rating' }
            ].map(opt => (
              <button key={opt.value} className={`sort-btn ${sortBy === opt.value ? 'active' : ''}`} onClick={() => setSortBy(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Medicines Grid */}
        {activeTab === 'medicines' && (
          <>
            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : medicines.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💊</span>
                <h3>No medicines found</h3>
                <p>Try searching for a different medicine name or category</p>
              </div>
            ) : (
              <div className="medicines-grid">
                {medicines.map(medicine => {
                  const cartItem = cart.find(c => c.medicineId === medicine._id);
                  const discount = medicine.discountPrice ? Math.round(((medicine.price - medicine.discountPrice) / medicine.price) * 100) : 0;

                  return (
                    <div key={medicine._id} className="medicine-card">
                      {discount > 0 && <div className="discount-badge">-{discount}%</div>}
                      {medicine.requirePrescription && <div className="rx-badge">Rx</div>}

                      <div className="medicine-img">
                        <img
                          src={medicine.image || `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop`}
                          alt={medicine.name}
                        />
                      </div>

                      <div className="medicine-info">
                        <h3 className="medicine-name">{medicine.name}</h3>
                        {medicine.composition && <p className="medicine-composition">{medicine.composition}</p>}
                        <p className="medicine-form">{medicine.dosageForm} • {medicine.strength} • {medicine.packSize}</p>
                        {medicine.manufacturer && <p className="medicine-mfg">Mfg: {medicine.manufacturer}</p>}

                        <div className="medicine-pricing">
                          <span className="current-price">₹{medicine.discountPrice || medicine.price}</span>
                          {medicine.discountPrice && <span className="original-price">₹{medicine.price}</span>}
                          {discount > 0 && <span className="save-text">Save ₹{medicine.price - medicine.discountPrice}</span>}
                        </div>

                        {cartItem ? (
                          <div className="quantity-controls">
                            <button onClick={() => updateQuantity(medicine._id, -1)}>−</button>
                            <span>{cartItem.quantity}</span>
                            <button onClick={() => updateQuantity(medicine._id, 1)}>+</button>
                          </div>
                        ) : (
                          <button className="btn btn-primary btn-sm btn-full add-btn" onClick={() => addToCart(medicine)}>
                            {medicine.requirePrescription ? '📋 Add to Cart' : '+ Add to Cart'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Pharmacy Stores */}
        {activeTab === 'stores' && (
          <div className="pharmacies-grid">
            {pharmacies.map(pharmacy => (
              <Link key={pharmacy._id} to={`/pharmacy/${pharmacy._id}`} className="pharmacy-card">
                <div className="pharmacy-card-img">
                  <img src={pharmacy.avatar || 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop'} alt="" />
                  {pharmacy.isVerified && <span className="verified-badge">✅ Verified</span>}
                </div>
                <div className="pharmacy-card-body">
                  <h3>{pharmacy.name}</h3>
                  <p className="pharmacy-address">📍 {pharmacy.address}, {pharmacy.city}</p>
                  <div className="pharmacy-meta">
                    <span>⭐ {pharmacy.rating} ({pharmacy.reviewCount} reviews)</span>
                    <span>🚚 {pharmacy.deliveryTime}</span>
                    <span>{pharmacy.deliveryFee === 0 ? '🆓 Free delivery' : `₹${pharmacy.deliveryFee} delivery`}</span>
                  </div>
                  <div className="pharmacy-tags">
                    {pharmacy.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="floating-cart" onClick={() => navigate('/pharmacy/cart')}>
          <span className="cart-icon">🛒</span>
          <span className="cart-text">{cartCount} items — ₹{cartTotal}</span>
          <span className="cart-arrow">→</span>
        </div>
      )}
    </div>
  );
}
