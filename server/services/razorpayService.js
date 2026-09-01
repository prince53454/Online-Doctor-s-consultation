/**
 * Razorpay Payment Service
 * 
 * In production, set these env vars:
 *   RAZORPAY_KEY_ID=rzp_test_xxxxx
 *   RAZORPAY_KEY_SECRET=xxxxx
 * 
 * In development (no keys set), all payments are mocked instantly.
 */

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
      amount: amount * 100, // Razorpay uses paise
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true
    };
  }

  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
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

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;

  return { verified, mock: false };
};

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
  if (amount) refundData.amount = amount * 100; // paise
  if (notes) refundData.notes = notes;

  return await razorpay.payments.refund(refundData);
};

module.exports = {
  isRazorpayConfigured,
  createOrder,
  verifyPayment,
  fetchPayment,
  createRefund
};
