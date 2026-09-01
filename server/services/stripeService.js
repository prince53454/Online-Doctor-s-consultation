const Stripe = require('stripe');

let stripe;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

const isStripeConfigured = () => !!stripe;

// Create a payment intent
async function createPaymentIntent({ amount, currency = 'inr', metadata = {}, receiptEmail }) {
  if (!stripe) throw new Error('Stripe not configured');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
    currency,
    metadata,
    receipt_email: receiptEmail,
    automatic_payment_methods: { enabled: true }
  });

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: amount,
    currency,
    status: paymentIntent.status
  };
}

// Confirm a payment
async function confirmPayment(paymentIntentId) {
  if (!stripe) throw new Error('Stripe not configured');

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || null
  };
}

// Process a refund
async function createRefund({ paymentIntentId, amount, reason = 'requested_by_customer' }) {
  if (!stripe) throw new Error('Stripe not configured');

  const refundParams = {
    payment_intent: paymentIntentId,
    reason
  };

  // Partial refund if amount specified
  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  const refund = await stripe.refunds.create(refundParams);
  return {
    id: refund.id,
    status: refund.status,
    amount: refund.amount / 100
  };
}

// Create a checkout session (alternative flow)
async function createCheckoutSession({ appointmentId, amount, doctorName, patientEmail, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'inr',
        product_data: {
          name: `Consultation with ${doctorName}`,
          description: 'Online Doctor Appointment'
        },
        unit_amount: Math.round(amount * 100)
      },
      quantity: 1
    }],
    mode: 'payment',
    metadata: { appointmentId },
    customer_email: patientEmail,
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return {
    sessionId: session.id,
    url: session.url,
    expiresAt: session.expires_at
  };
}

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  stripe,
  isStripeConfigured,
  createPaymentIntent,
  confirmPayment,
  createRefund,
  createCheckoutSession,
  verifyWebhookSignature
};
