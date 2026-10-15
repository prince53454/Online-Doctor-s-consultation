const request = require('supertest');
const Medicine = require('../../src/models/Medicine');
const Pharmacy = require('../../src/models/Pharmacy');
const PharmacyOrder = require('../../src/models/PharmacyOrder');
const razorpay = require('../../src/services/razorpayService');
const { createTestUser, generateToken } = require('../helpers/setup');
let app, token, medicine, pharmacy;
const address = { fullName: 'Checkout Test', phone: '9876543210', address: '1 Test Street', city: 'Delhi', pincode: '110001' };
const checkout = (items) => request(app).post('/api/pharmacy/orders').set('Authorization', `Bearer ${token}`).send({ items: items || [{ medicineId: medicine.id, quantity: 1 }], deliveryAddress: address });
const pay = id => request(app).post(`/api/pharmacy/orders/${id}/pay`).set('Authorization', `Bearer ${token}`);
const cancel = id => request(app).put(`/api/pharmacy/orders/${id}/cancel`).set('Authorization', `Bearer ${token}`).send({ reason: 'Test cancellation' });
beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  app = require('../../src/app');
  const patient = await createTestUser({ email: 'pharmacy-checkout@test.com' });
  token = generateToken(patient.id);
});
beforeEach(async () => {
  medicine = await Medicine.create({ name: 'Test Medicine', slug: `checkout-${Date.now()}-${Math.random()}`, category: 'otc', price: 100, stockCount: 1 });
  pharmacy = await Pharmacy.create({ name: 'Test Pharmacy', slug: `checkout-${Date.now()}-${Math.random()}`, address: 'Street', city: 'Delhi', medicines: [medicine.id], location: { type: 'Point', coordinates: [77.2, 28.5] } });
});
afterEach(() => jest.restoreAllMocks());
it('allows only one concurrent checkout for the last unit', async () => {
  const results = await Promise.all([checkout(), checkout()]);
  expect(results.filter(r => r.status === 201)).toHaveLength(1);
  expect(results.filter(r => [400, 409].includes(r.status))).toHaveLength(1);
  const current = await Medicine.findById(medicine.id);
  expect(current.stockCount).toBe(0);
  expect(current.totalSold).toBe(1);
});
it('rolls back earlier reservations when a later medicine loses its stock', async () => {
  const second = await Medicine.create({ name: 'Second', slug: `second-${Date.now()}`, category: 'otc', price: 50, stockCount: 1 });
  await Pharmacy.updateOne({ _id: pharmacy.id }, { $push: { medicines: second.id } });
  const original = Medicine.findOneAndUpdate.bind(Medicine);
  jest.spyOn(Medicine, 'findOneAndUpdate').mockImplementation((query, update) => String(query._id) === second.id ? Promise.resolve(null) : original(query, update));
  const result = await checkout([{ medicineId: medicine.id, quantity: 1 }, { medicineId: second.id, quantity: 1 }]);
  expect(result.status).toBe(409);
  expect((await Medicine.findById(medicine.id)).stockCount).toBe(1);
  expect(await PharmacyOrder.countDocuments({ 'items.medicine': medicine.id })).toBe(0);
});
it('restores inventory if saving the order fails', async () => {
  jest.spyOn(PharmacyOrder.prototype, 'save').mockRejectedValueOnce(new Error('Simulated database failure'));
  expect((await checkout()).status).toBe(500);
  const current = await Medicine.findById(medicine.id);
  expect(current.stockCount).toBe(1);
  expect(current.totalSold).toBe(0);
});
it('restores stock only once for concurrent cancellation requests', async () => {
  const created = await checkout();
  expect(created.status).toBe(201);
  const results = await Promise.all([cancel(created.body.order._id), cancel(created.body.order._id)]);
  expect(results.filter(r => r.status === 200)).toHaveLength(1);
  expect(results.filter(r => r.status === 409)).toHaveLength(1);
  expect((await Medicine.findById(medicine.id)).stockCount).toBe(1);
});
it('confirms a mock payment once and prevents cancellation of the paid order', async () => {
  jest.spyOn(razorpay, 'isRazorpayConfigured').mockReturnValue(false);
  const created = await checkout();
  const id = created.body.order._id;
  const results = await Promise.all([pay(id), pay(id)]);
  expect(results.filter(r => r.status === 200)).toHaveLength(1);
  expect(results.filter(r => r.status === 409)).toHaveLength(1);
  expect((await cancel(id)).status).toBe(409);
  const saved = await PharmacyOrder.findById(id);
  expect(saved.payment.status).toBe('completed');
  expect(saved.statusHistory.filter(h => h.status === 'confirmed')).toHaveLength(1);
});
it('reuses an existing Razorpay checkout and validates captured amounts', async () => {
  jest.spyOn(razorpay, 'isRazorpayConfigured').mockReturnValue(true);
  const create = jest.spyOn(razorpay, 'createOrder').mockResolvedValue({ id: 'order_checkout_test', amount: 14900, currency: 'INR' });
  jest.spyOn(razorpay, 'verifyPayment').mockReturnValue({ verified: true });
  const fetch = jest.spyOn(razorpay, 'fetchPayment').mockResolvedValue({ status: 'captured', order_id: 'order_checkout_test', amount: 1, currency: 'INR' });
  const created = await checkout();
  const id = created.body.order._id;
  expect((await pay(id)).status).toBe(200);
  expect((await pay(id)).body.order.id).toBe('order_checkout_test');
  expect(create).toHaveBeenCalledTimes(1);
  const verify = () => request(app).post(`/api/pharmacy/orders/${id}/verify`).set('Authorization', `Bearer ${token}`).send({ razorpay_order_id: 'order_checkout_test', razorpay_payment_id: 'pay_checkout_test', razorpay_signature: 'test_signature' });
  expect((await verify()).status).toBe(400);
  expect((await PharmacyOrder.findById(id)).payment.status).toBe('pending');
  fetch.mockResolvedValue({ status: 'captured', order_id: 'order_checkout_test', amount: 14900, currency: 'INR' });
  expect((await verify()).status).toBe(200);
  expect((await verify()).status).toBe(200);
  expect((await PharmacyOrder.findById(id)).statusHistory.filter(h => h.status === 'confirmed')).toHaveLength(1);
});
it('rejects payment after cancellation', async () => {
  const created = await checkout();
  expect((await cancel(created.body.order._id)).status).toBe(200);
  expect((await pay(created.body.order._id)).status).toBe(409);
});
