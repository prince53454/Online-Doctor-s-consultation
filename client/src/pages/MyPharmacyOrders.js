import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import './MyPharmacyOrders.css';

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', bg: '#FEF3C7', icon: '⏳', label: 'Order Placed' },
  confirmed: { color: '#3B82F6', bg: '#DBEAFE', icon: '✅', label: 'Confirmed' },
  processing: { color: '#8B5CF6', bg: '#EDE9FE', icon: '⚙️', label: 'Processing' },
  packed: { color: '#6366F1', bg: '#E0E7FF', icon: '📦', label: 'Packed' },
  'out-for-delivery': { color: '#10B981', bg: '#D1FAE5', icon: '🚚', label: 'Out for Delivery' },
  delivered: { color: '#10B981', bg: '#D1FAE5', icon: '🎉', label: 'Delivered' },
  cancelled: { color: '#EF4444', bg: '#FEE2E2', icon: '❌', label: 'Cancelled' }
};

export default function MyPharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pharmacy/orders/my');
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.put(`/pharmacy/orders/${orderId}/cancel`, { reason: 'Cancelled by patient' });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const filteredOrders = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.status === activeFilter);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="my-orders-page">
      <div className="container">
        <h1 className="page-title">📦 My Pharmacy Orders</h1>

        {/* Filters */}
        <div className="order-filters">
          {['all', 'pending', 'confirmed', 'out-for-delivery', 'delivered', 'cancelled'].map(filter => (
            <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}>
              {filter === 'all' ? `All (${orders.length})` :
                `${STATUS_CONFIG[filter]?.icon || ''} ${STATUS_CONFIG[filter]?.label || filter}`}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>No orders found</h3>
            <p>You haven't placed any pharmacy orders yet</p>
            <Link to="/pharmacy" className="btn btn-primary">Order Medicines</Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(order => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <span className="order-id">#{order._id?.slice(-8).toUpperCase()}</span>
                      <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="order-status" style={{ background: config.bg, color: config.color }}>
                      {config.icon} {config.label}
                    </div>
                  </div>

                  <div className="order-pharmacy">
                    <strong>{order.pharmacy?.name || 'Pharmacy'}</strong>
                    <span>{order.items?.length} item(s)</span>
                  </div>

                  <div className="order-items">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span>{item.name}</span>
                        <span>× {item.quantity}</span>
                        <strong>₹{item.price * item.quantity}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total</span>
                      <strong>₹{order.totalAmount}</strong>
                    </div>
                    <div className="order-actions">
                      {order.deliveryAddress && (
                        <span className="delivery-info">📍 {order.deliveryAddress.address}, {order.deliveryAddress.city}</span>
                      )}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(order._id)}>Cancel</button>
                      )}
                    </div>
                  </div>

                  {/* Delivery tracking progress */}
                  {order.status !== 'cancelled' && (
                    <div className="delivery-progress">
                      {['pending', 'confirmed', 'processing', 'packed', 'out-for-delivery', 'delivered'].map((s, i) => {
                        const statusIndex = ['pending', 'confirmed', 'processing', 'packed', 'out-for-delivery', 'delivered'].indexOf(order.status);
                        const isCompleted = i <= statusIndex;
                        return (
                          <div key={s} className={`delivery-step ${isCompleted ? 'completed' : ''}`}>
                            <div className="delivery-dot" />
                            <span>{STATUS_CONFIG[s]?.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
