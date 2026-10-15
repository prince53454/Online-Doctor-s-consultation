const { isCapturedPaymentForOrder } = require('../../src/services/razorpayService');

describe('Razorpay captured payment validation', () => {
  const validPayment = {
    status: 'captured',
    order_id: 'order_123',
    amount: 50000,
    currency: 'INR'
  };

  it('accepts a captured payment for the exact INR order amount', () => {
    expect(isCapturedPaymentForOrder({
      payment: validPayment,
      orderId: 'order_123',
      amount: 500
    })).toBe(true);
  });

  it.each([
    ['uncaptured payment', { ...validPayment, status: 'authorized' }],
    ['different order', { ...validPayment, order_id: 'order_other' }],
    ['different amount', { ...validPayment, amount: 49999 }],
    ['different currency', { ...validPayment, currency: 'USD' }],
    ['missing payment', null]
  ])('rejects a %s', (_description, payment) => {
    expect(isCapturedPaymentForOrder({
      payment,
      orderId: 'order_123',
      amount: 500
    })).toBe(false);
  });
});


describe('Razorpay payment signatures', () => {
  const originalEnv = { ...process.env };
  beforeAll(() => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_signature';
    process.env.RAZORPAY_KEY_SECRET = 'test_only_signature_secret';
  });
  afterAll(() => {
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  });
  it('accepts the HMAC for the supplied order and payment', () => {
    const signature = require('crypto').createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update('order_test|pay_test').digest('hex');
    expect(require('../../src/services/razorpayService').verifyPayment({ razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: signature }).verified).toBe(true);
  });
  it('rejects a tampered or missing signature', () => {
    const { verifyPayment } = require('../../src/services/razorpayService');
    expect(verifyPayment({ razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: '0'.repeat(64) }).verified).toBe(false);
    expect(verifyPayment({}).verified).toBe(false);
  });
});
