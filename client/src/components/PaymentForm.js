import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

let razorpayScriptPromise;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    const timeout = window.setTimeout(() => {
      reject(new Error('Razorpay checkout did not load. Check your connection and try again.'));
    }, 15000);

    const handleLoad = () => {
      window.clearTimeout(timeout);
      if (window.Razorpay) {
        script.dataset.razorpayLoaded = 'true';
        resolve();
      } else {
        reject(new Error('Razorpay checkout loaded incorrectly. Please try again.'));
      }
    };
    const handleError = () => {
      window.clearTimeout(timeout);
      reject(new Error('Unable to load Razorpay checkout. Check your connection and try again.'));
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
    } else if (script.dataset.razorpayLoaded === 'true') {
      window.clearTimeout(timeout);
      reject(new Error('Razorpay checkout is unavailable. Please refresh and try again.'));
      return;
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!script.isConnected) document.body.appendChild(script);
  }).catch(error => {
    razorpayScriptPromise = null;
    throw error;
  });

  return razorpayScriptPromise;
}

export default function PaymentForm({ appointmentId, amount, patient, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const providerUnavailable = paymentConfig && !paymentConfig.mockMode && !paymentConfig.razorpay?.configured;

  useEffect(() => {
    api.get('/payments/config')
      .then(res => setPaymentConfig(res.data))
      .catch(error => {
        console.error('Payment configuration could not be loaded:', error);
        toast.error('Could not check payment availability. Try again shortly.');
      });
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      const orderRes = await api.post('/payments/razorpay/create-order', { appointmentId });
      const { order, mock, appointment, razorpayKeyId } = orderRes.data;

      if (mock) {
        setLoading(false);
        toast.success('Demo payment confirmed. No money was charged.');
        onSuccess?.(appointment);
        return;
      }

      if (!order?.id || !razorpayKeyId) {
        throw new Error('Payment provider returned an incomplete order. Please try again.');
      }

      await loadRazorpayCheckout();
      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is unavailable. Please try again.');
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'MediConnect',
        description: `Appointment Payment — ₹${amount}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              appointmentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setLoading(false);
            toast.success('Payment successful!');
            onSuccess?.(verifyRes.data.appointment);
          } catch (err) {
            const message = err.response?.data?.error || 'Payment verification failed. Contact support before retrying.';
            setLoading(false);
            toast.error(message);
            onError?.(message);
          }
        },
        prefill: {
          name: patient?.name || '',
          email: patient?.email || '',
          contact: patient?.phone || ''
        },
        theme: { color: '#276746' },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        const message = response.error?.description || 'Payment failed. Please try again.';
        setLoading(false);
        toast.error(message);
        onError?.(message);
      });
      rzp.open();
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Payment initialization failed';
      setLoading(false);
      toast.error(msg);
      onError?.(msg);
    }
  };

  return (
    <div className="payment-form">
      <div className="payment-amount">
        <span>Amount to Pay</span>
        <span className="payment-price">₹{amount}</span>
      </div>

      {paymentConfig?.mockMode && !paymentConfig?.razorpay?.configured ? (
        <div className="payment-secure">Development demo only — simulated checkout; no money will be charged.</div>
      ) : paymentConfig?.razorpay?.configured ? (
        <div className="payment-secure">🔒 Secure checkout powered by Razorpay</div>
      ) : providerUnavailable ? (
        <div className="payment-secure">Online payments are unavailable until Razorpay is configured.</div>
      ) : (
        <div className="payment-secure">Online payment availability is checked securely at checkout.</div>
      )}

      <button
        className="btn btn-primary btn-lg btn-full"
        onClick={handlePay}
        disabled={loading || providerUnavailable}
      >
        {loading
          ? '⏳ Processing...'
          : providerUnavailable
            ? 'Payments unavailable'
            : paymentConfig?.mockMode && !paymentConfig?.razorpay?.configured
              ? `Simulate ₹${amount} demo payment`
              : `Pay ₹${amount}`}
      </button>

      <div className="payment-methods">
        <span>Accepted:</span>
        <span className="pm-badge">💳 Cards</span>
        <span className="pm-badge">📱 UPI</span>
        <span className="pm-badge">🏦 Net Banking</span>
        <span className="pm-badge">💰 Wallets</span>
      </div>

    </div>
  );
}
