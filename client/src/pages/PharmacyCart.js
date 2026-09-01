import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './PharmacyCart.css';

export default function PharmacyCart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pharmacyCart')) || []; } catch { return []; }
  });
  const [step, setStep] = useState(1); // 1=cart, 2=address, 3=payment, 4=confirmed
  const [loading, setLoading] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [order, setOrder] = useState(null);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: '',
    landmark: '',
    type: 'home'
  });

  useEffect(() => {
    localStorage.setItem('pharmacyCart', JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (medicineId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.medicineId === medicineId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (medicineId) => {
    setCart(prev => prev.filter(item => item.medicineId !== medicineId));
    toast.success('Item removed from cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const total = subtotal + deliveryFee;
  const hasPrescriptionItems = cart.some(item => item.requirePrescription);

  const handlePlaceOrder = async () => {
    if (!address.address || !address.city || !address.pincode) {
      toast.error('Please fill in the delivery address');
      return;
    }
    if (hasPrescriptionItems && !prescriptionFile) {
      toast.error('Please upload a prescription for Rx medicines');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/pharmacy/orders', {
        pharmacyId: cart[0]?.pharmacyId || null, // Will use default pharmacy
        items: cart.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity
        })),
        prescriptionUrl: prescriptionFile ? 'uploaded_prescription.jpg' : undefined,
        deliveryAddress: address,
        notes: ''
      });

      setOrder(res.data.order);
      setStep(3); // Payment step
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Try Razorpay first, fallback to mock
      const payRes = await api.post(`/pharmacy/orders/${order._id}/pay`);

      if (payRes.data.mock) {
        toast.success('Payment successful! 🎉');
        setOrder(payRes.data.pharmacyOrder);
        setStep(4);
        localStorage.removeItem('pharmacyCart');
        setCart([]);
        return;
      }

      // Production Razorpay flow
      const { order: rzpOrder, razorpayKeyId } = payRes.data;

      const options = {
        key: razorpayKeyId,
        amount: rzpOrder.amount,
        currency: 'INR',
        name: 'MediConnect Pharmacy',
        description: `Order of ${cart.length} medicine(s)`,
        order_id: rzpOrder.id,
        handler: async (response) => {
          try {
            await api.post(`/pharmacy/orders/${order._id}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment successful! 🎉');
            setStep(4);
            localStorage.removeItem('pharmacyCart');
            setCart([]);
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: user?.name, email: user?.email, contact: address.phone },
        theme: { color: '#4F46E5' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  if (cart.length === 0 && step !== 4) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <span className="empty-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Add medicines from the pharmacy to get started</p>
            <button className="btn btn-primary" onClick={() => navigate('/pharmacy')}>Browse Medicines</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">🛒 {step === 4 ? 'Order Confirmed' : 'Your Cart'}</h1>

        {/* Progress Steps */}
        <div className="cart-progress">
          {['Cart', 'Address', 'Payment', 'Confirmed'].map((label, i) => (
            <div key={i} className={`progress-step ${step > i ? 'completed' : step === i + 1 ? 'active' : ''}`}>
              <div className="step-circle">{i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="cart-layout">
          {/* Main Content */}
          <div className="cart-main">
            {/* Step 1: Cart Items */}
            {step === 1 && (
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.medicineId} className="cart-item">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop'}
                      alt={item.name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p>{item.dosageForm} • {item.strength}</p>
                      {item.requirePrescription && <span className="rx-tag">📋 Prescription Required</span>}
                      <div className="cart-item-price">
                        <span className="price">₹{item.price}</span>
                        {item.originalPrice > item.price && (
                          <span className="old-price">₹{item.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.medicineId, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.medicineId, 1)}>+</button>
                      </div>
                      <span className="item-total">₹{item.price * item.quantity}</span>
                      <button className="remove-btn" onClick={() => removeFromCart(item.medicineId)}>🗑️</button>
                    </div>
                  </div>
                ))}

                {/* Prescription Upload */}
                {hasPrescriptionItems && (
                  <div className="prescription-upload">
                    <h3>📋 Upload Prescription</h3>
                    <p>This order contains prescription medicines. Please upload a valid prescription.</p>
                    <div className="upload-area">
                      <input type="file" accept="image/*,.pdf" onChange={(e) => setPrescriptionFile(e.target.files[0])} id="prescription-input" hidden />
                      <label htmlFor="prescription-input" className="upload-label">
                        {prescriptionFile ? (
                          <>✅ {prescriptionFile.name}</>
                        ) : (
                          <>📎 Click to upload prescription</>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
                  Proceed to Address →
                </button>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {step === 2 && (
              <div className="address-form">
                <h2>📍 Delivery Address</h2>

                <div className="address-type-selector">
                  {['home', 'office', 'other'].map(type => (
                    <button key={type} className={`type-btn ${address.type === type ? 'active' : ''}`}
                      onClick={() => setAddress({ ...address, type })}>
                      {type === 'home' ? '🏠' : type === 'office' ? '🏢' : '📍'} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input type="text" className="form-input" value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input type="tel" className="form-input" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} placeholder="+91 " />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <textarea className="form-textarea" rows={2} value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })} placeholder="Flat/House No., Street, Area" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input type="text" className="form-input" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input type="text" className="form-input" value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} maxLength={6} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Landmark (Optional)</label>
                  <input type="text" className="form-input" value={address.landmark} onChange={e => setAddress({ ...address, landmark: e.target.value })} placeholder="Near..." />
                </div>

                <div className="step-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder} disabled={loading}>
                    {loading ? '⏳ Placing Order...' : 'Continue to Payment →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="payment-step">
                <h2>💳 Payment</h2>

                <div className="payment-options">
                  <div className="payment-option active">
                    <span className="payment-icon">💳</span>
                    <div>
                      <strong>Online Payment (Razorpay)</strong>
                      <p>Credit/Debit Card, UPI, Net Banking, Wallets</p>
                    </div>
                  </div>
                </div>

                <div className="razorpay-secure">
                  <img src="https://razorpay.com/favicon.ico" alt="" width={20} height={20} style={{marginRight: 8}} />
                  Secured by Razorpay • 256-bit SSL Encryption
                </div>

                <div className="step-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handlePayment} disabled={loading}>
                    {loading ? '⏳ Processing...' : `Pay ₹${total}`}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="order-success">
                <div className="success-icon">✅</div>
                <h2>Order Placed Successfully!</h2>
                <p>Your medicines will be delivered in 2-4 hours</p>

                {order && (
                  <div className="order-details">
                    <div className="detail-row">
                      <span>Order ID</span>
                      <strong>#{order._id?.slice(-8).toUpperCase()}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Items</span>
                      <strong>{order.items?.length || cart.length} medicine(s)</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total Paid</span>
                      <strong className="text-primary">₹{order.totalAmount || total}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Delivery Address</span>
                      <strong>{address.address}, {address.city}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Estimated Delivery</span>
                      <strong>⚡ 2-4 hours</strong>
                    </div>
                  </div>
                )}

                <div className="success-actions">
                  <button className="btn btn-primary" onClick={() => navigate('/pharmacy/orders')}>📦 View My Orders</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/pharmacy')}>Continue Shopping</button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step < 4 && (
            <div className="cart-sidebar">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cart.map(item => (
                  <div key={item.medicineId} className="summary-item">
                    <span>{item.name} × {item.quantity}</span>
                    <strong>₹{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>
              <div className="summary-divider" />
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-green' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              {subtotal < 500 && (
                <p className="free-delivery-tip">🛒 Add ₹{500 - subtotal} more for free delivery</p>
              )}
              <div className="summary-divider" />
              <div className="summary-row total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
