import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Razorpay Payment Component for Appointment Payments.
 * Creates a Razorpay order on the server and opens the Razorpay checkout.
 *
 * In development (no Razorpay keys), auto-confirms in mock mode.
 */
export default function PaymentForm({ appointmentId, amount, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  // Fetch payment provider config on mount
  useEffect(() => {
    api.get('/payments/config')
      .then(res => setPaymentConfig(res.data))
      .catch(() => {});
  }, []);

  // Load Razorpay checkout script
  useEffect(() => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Step 1: Create Razorpay order on server
      const orderRes = await api.post('/payments/razorpay/create-order', { appointmentId });
      const { order, mock, appointment, razorpayKeyId } = orderRes.data;

      // Mock mode (no Razorpay keys configured) — payment auto-confirmed on server
      if (mock) {
        toast.success('Payment confirmed! (Development mode)');
        onSuccess?.(appointment);
        return;
      }

      // Step 2: Open real Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'MediConnect',
        description: `Appointment Payment — ₹${amount}`,
        order_id: order.id,
        handler: async (response) => {
          // Step 3: Verify payment on server
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              appointmentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment successful! 🎉');
            onSuccess?.(verifyRes.data.appointment);
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
            onError?.('Verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        onError?.(response.error.description);
      });
      rzp.open();
    } catch (error) {
      const msg = error.response?.data?.error || 'Payment initialization failed';
      toast.error(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <div className="payment-amount">
        <span>Amount to Pay</span>
        <span className="payment-price">₹{amount}</span>
      </div>

      <div className="payment-secure">
        🔒 Secured by Razorpay — 256-bit SSL Encryption
      </div>

      <button
        className="btn btn-primary btn-lg btn-full"
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? '⏳ Initializing Payment...' : `Pay ₹${amount}`}
      </button>

      <div className="payment-methods">
        <span>Accepted:</span>
        <span className="pm-badge">💳 Cards</span>
        <span className="pm-badge">📱 UPI</span>
        <span className="pm-badge">🏦 Net Banking</span>
        <span className="pm-badge">💰 Wallets</span>
      </div>

      {!paymentConfig?.razorpay?.configured && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', marginTop: 8 }}>
          Development mode — payments auto-confirmed
        </p>
      )}
    </div>
  );
}
