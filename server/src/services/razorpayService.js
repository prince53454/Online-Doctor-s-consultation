/**
 * Razorpay Payment Service
 * 
 * In production, set these env vars:
 *   RAZORPAY_KEY_ID=rzp_test_xxxxx
 *   RAZORPAY_KEY_SECRET=xxxxx
 * 
 * In development (no keys set), all payments are mocked instantly.
 */

const crypto = require('crypto');

const isRazorpayConfigured = () => {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes('your_'));
};

let razorpay = null;

if (isRazorpayConfigured()) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

/**
 * Create a Razorpay order
 */
const createOrder = async ({ amount, receipt, notes = {} }) => {
  if (!isRazorpayConfigured()) {
    return {
      id: 'mock_order_' + Date.now(),
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true
    };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
    notes
  });

  return order;
};

/**
 * Verify Razorpay payment signature
 */
const verifyPayment = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!isRazorpayConfigured()) {
    return { verified: true, mock: true };
  }

  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(value => typeof value === 'string' && value.length > 0)) {
    return { verified: false, mock: false };
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();

  const suppliedSignature = /^[a-f0-9]{64}$/i.test(razorpay_signature)
    ? Buffer.from(razorpay_signature, 'hex')
    : Buffer.alloc(0);
  const verified = suppliedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(expectedSignature, suppliedSignature);

  return { verified, mock: false };
};

const isCapturedPaymentForOrder = ({ payment, orderId, amount }) => (
  payment?.status === 'captured' &&
  payment.order_id === orderId &&
  payment.amount === Math.round(amount * 100) &&
  payment.currency === 'INR'
);

/**
 * Fetch a payment from Razorpay
 */
const fetchPayment = async (paymentId) => {
  if (!isRazorpayConfigured()) {
    return { id: paymentId, status: 'captured', amount: 0, mock: true };
  }

  return await razorpay.payments.fetch(paymentId);
};

/**
 * Create a refund
 */
const createRefund = async ({ paymentId, amount, notes = {} }) => {
  if (!isRazorpayConfigured()) {
    return { id: 'mock_refund_' + Date.now(), amount, status: 'processed', mock: true };
  }

  const refundData = { payment_id: paymentId };
  if (amount) refundData.amount = Math.round(amount * 100); // paise
  if (notes) refundData.notes = notes;

  return await razorpay.payments.refund(refundData);
};

module.exports = {
  isRazorpayConfigured,
  createOrder,
  verifyPayment,
  isCapturedPaymentForOrder,
  fetchPayment,
  createRefund
};
