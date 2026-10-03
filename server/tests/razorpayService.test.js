const { isCapturedPaymentForOrder } = require('../services/razorpayService');

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
