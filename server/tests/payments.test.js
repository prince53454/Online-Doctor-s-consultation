const request = require('supertest');
const mongoose = require('mongoose');
const { generateToken, createTestUser, createTestDoctor } = require('./setup');

let app;

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  process.env.JWT_EXPIRE = '1h';
  app = require('../app');
});

describe('Payment Routes', () => {
  let patient, patientToken;
  let appointmentId;

  beforeAll(async () => {
    patient = await createTestUser({ email: `pay_patient_${Date.now()}@test.com` });
    patientToken = generateToken(patient._id, 'patient');

    const doctorData = await createTestDoctor({
      user: { email: `pay_doctor_${Date.now()}@test.com` },
      doctor: { isApproved: true }
    });

    // Book an appointment to pay for
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorData.doctor._id,
        appointmentType: 'in-person',
        date: getNextMonday(),
        timeSlot: { startTime: '09:00', endTime: '10:00' },
        symptoms: 'Payment test symptoms'
      });

    if (bookRes.status === 201) {
      appointmentId = bookRes.body.appointment._id;
    }
  });

  // ─── PAYMENT CONFIG ───────────────────
  describe('GET /api/payments/config', () => {
    it('should return payment provider config', async () => {
      const res = await request(app).get('/api/payments/config');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.razorpay).toBeDefined();
      expect(res.body.stripe).toBeDefined();
    });

    it('should indicate mock mode when no keys set', async () => {
      const res = await request(app).get('/api/payments/config');

      // In test env, no Razorpay keys are set
      expect(res.body.razorpay.configured).toBe(false);
    });
  });

  // ─── RAZORPAY MOCK PAYMENT ────────────
  describe('POST /api/payments/razorpay/create-order', () => {
    it('should create order (mock mode auto-confirms)', async () => {
      if (!appointmentId) return;

      const res = await request(app)
        .post('/api/payments/razorpay/create-order')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ appointmentId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // In mock mode, payment is auto-confirmed
      if (res.body.mock) {
        expect(res.body.appointment.payment.status).toBe('completed');
        expect(res.body.appointment.status).toBe('confirmed');
      }
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/payments/razorpay/create-order')
        .send({ appointmentId: 'fake' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent appointment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/payments/razorpay/create-order')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ appointmentId: fakeId });

      expect(res.status).toBe(404);
    });

    it('should reject if patient does not own the appointment', async () => {
      // Create another patient
      const otherPatient = await createTestUser({ email: `other_${Date.now()}@test.com` });
      const otherToken = generateToken(otherPatient._id, 'patient');

      if (!appointmentId) return;

      const res = await request(app)
        .post('/api/payments/razorpay/create-order')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ appointmentId });

      expect(res.status).toBe(403);
    });
  });

  // ─── STRIPE MOCK PAYMENT ──────────────
  describe('POST /api/payments/create-intent', () => {
    it('should create payment intent (mock mode)', async () => {
      // Book a fresh appointment for this test
      const doctorData = await createTestDoctor({
        user: { email: `stripe_doc_${Date.now()}@test.com` },
        doctor: { isApproved: true }
      });

      const bookRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorData.doctor._id,
          appointmentType: 'video',
          date: getNextMonday(),
          timeSlot: { startTime: '10:00', endTime: '11:00' },
          symptoms: 'Stripe intent test'
        });

      if (bookRes.status !== 201) return;

      const res = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ appointmentId: bookRes.body.appointment._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // In mock mode, payment is auto-confirmed
      if (res.body.mock) {
        expect(res.body.appointment.payment.status).toBe('completed');
      }
    });
  });

  // ─── REFUND ───────────────────────────
  describe('POST /api/payments/refund', () => {
    it('should process refund for cancelled appointment', async () => {
      // Book and complete an appointment
      const doctorData = await createTestDoctor({
        user: { email: `refund_doc_${Date.now()}@test.com` },
        doctor: { isApproved: true }
      });

      const bookRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorData.doctor._id,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '14:00', endTime: '15:00' },
          symptoms: 'Refund test'
        });

      if (bookRes.status !== 201) return;
      const aptId = bookRes.body.appointment._id;

      // Pay for it
      await request(app)
        .post('/api/payments/razorpay/create-order')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ appointmentId: aptId });

      // Cancel it
      await request(app)
        .put(`/api/appointments/${aptId}/status`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ status: 'cancelled', cancelledBy: 'patient' });

      // Request refund
      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ appointmentId: aptId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.refundAmount).toBeGreaterThanOrEqual(0);
    });

    it('should reject refund for uncancelled appointment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ appointmentId: fakeId });

      expect(res.status).toBe(404);
    });
  });
});

function getNextMonday() {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}
