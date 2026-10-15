const request = require('supertest');
const express = require('express');
jest.mock('../../src/middleware/auth', () => ({ protect: (req, res, next) => { req.user = { id: 'patient' }; next(); } }));
jest.mock('../../src/models/Pharmacy', () => ({ findOne: jest.fn() }));
jest.mock('../../src/models/Medicine', () => ({ findById: jest.fn() }));
const Pharmacy = require('../../src/models/Pharmacy');
const Medicine = require('../../src/models/Medicine');
const app = express();
app.use(express.json());
app.use('/api/pharmacy', require('../../src/routes/pharmacy'));
const medicineId = '507f1f77bcf86cd799439011';
const deliveryAddress = { fullName: 'Test', phone: '9876543210', address: 'Street', city: 'Delhi', pincode: '110001' };
beforeEach(() => jest.clearAllMocks());
it.each([{ items: [] }, { items: [{ medicineId, quantity: -1 }] }, { items: [{ medicineId, quantity: 1.5 }] }])('rejects invalid order items %j', async ({ items }) => {
  const response = await request(app).post('/api/pharmacy/orders').send({ items, deliveryAddress });
  expect(response.status).toBe(400);
  expect(Pharmacy.findOne).not.toHaveBeenCalled();
});
it('selects an online pharmacy carrying every medicine when no pharmacy ID is supplied', async () => {
  Pharmacy.findOne.mockResolvedValue(null);
  const response = await request(app).post('/api/pharmacy/orders').send({ items: [{ medicineId, quantity: 1 }], deliveryAddress });
  expect(response.status).toBe(404);
  expect(Pharmacy.findOne).toHaveBeenCalledWith({ isOnline: true, medicines: { $all: [medicineId] } });
});
it('requires an uploaded prescription before creating an Rx order', async () => {
  Pharmacy.findOne.mockResolvedValue({ _id: medicineId });
  Medicine.findById.mockResolvedValue({ inStock: true, stockCount: 10, requirePrescription: true });
  const response = await request(app).post('/api/pharmacy/orders').send({ items: [{ medicineId, quantity: 1 }], deliveryAddress });
  expect(response.status).toBe(400);
  expect(response.body.error).toMatch(/prescription/);
});
it('rejects quantities above available stock', async () => {
  Pharmacy.findOne.mockResolvedValue({ _id: medicineId });
  Medicine.findById.mockResolvedValue({ name: 'Test medicine', inStock: true, stockCount: 1 });
  const response = await request(app).post('/api/pharmacy/orders').send({ items: [{ medicineId, quantity: 2 }], deliveryAddress });
  expect(response.status).toBe(400);
});
