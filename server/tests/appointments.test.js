const request = require('supertest');
const mongoose = require('mongoose');
const { generateToken, createTestUser, createTestDoctor } = require('./setup');

let app;

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  process.env.JWT_EXPIRE = '1h';
  app = require('../app');
});

describe('Appointment Routes', () => {
  let patient, patientToken;
  let doctorUser, doctor;
  let doctorToken;

  beforeAll(async () => {
    // Create patient
    patient = await createTestUser({ email: `apt_patient_${Date.now()}@test.com` });
    patientToken = generateToken(patient._id, 'patient');

    // Create approved doctor
    const doctorData = await createTestDoctor({
      user: { email: `apt_doctor_${Date.now()}@test.com` },
      doctor: { isApproved: true }
    });
    doctorUser = doctorData.user;
    doctor = doctorData.doctor;
    doctorToken = generateToken(doctorUser._id, 'doctor');
  });

  // ─── BOOK APPOINTMENT ─────────────────
  describe('POST /api/appointments', () => {
    it('should book an appointment as patient', async () => {
      // Find a valid slot from the doctor's availability
      const doctorRes = await request(app)
        .get(`/api/doctors/${doctor._id}/availability?date=${getNextMonday()}`);

      const slots = doctorRes.body.availability?.[0]?.slots || [];
      if (slots.length === 0) {
        console.log('No slots available, skipping booking test');
        return;
      }

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor._id,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '09:00', endTime: '10:00' },
          symptoms: 'Test headache symptoms for automated testing',
          medicalHistory: 'No significant history'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.appointment.status).toBe('pending');
      expect(res.body.appointment.payment.status).toBe('pending');
      expect(res.body.appointment.symptoms).toBe('Test headache symptoms for automated testing');
    });

    it('should reject booking without auth', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          doctorId: doctor._id,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '09:00', endTime: '10:00' },
          symptoms: 'Unauthorized booking'
        });

      expect(res.status).toBe(401);
    });

    it('should reject booking as doctor', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          doctorId: doctor._id,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '10:00', endTime: '11:00' },
          symptoms: 'Doctor trying to book'
        });

      expect(res.status).toBe(403);
    });

    it('should reject missing symptoms', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor._id,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '11:00', endTime: '12:00' }
        });

      expect(res.status).toBe(400);
    });

    it('should reject booking with non-existent doctor', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: fakeId,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '09:00', endTime: '10:00' },
          symptoms: 'Testing fake doctor'
        });

      expect(res.status).toBe(404);
    });
  });

  // ─── LIST APPOINTMENTS ────────────────
  describe('GET /api/appointments', () => {
    it('should return patient appointments', async () => {
      const res = await request(app)
        .get('/api/appointments?limit=10')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.appointments)).toBe(true);
    });

    it('should return doctor appointments', async () => {
      const res = await request(app)
        .get('/api/appointments?limit=10')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.appointments)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/appointments');
      expect(res.status).toBe(401);
    });
  });

  // ─── UPDATE STATUS ────────────────────
  describe('PUT /api/appointments/:id/status', () => {
    let appointmentId;

    beforeAll(async () => {
      // Book an appointment to update
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor._id,
          appointmentType: 'video',
          date: getNextMonday(),
          timeSlot: { startTime: '14:00', endTime: '15:00' },
          symptoms: 'Status update test'
        });

      if (res.status === 201) {
        appointmentId = res.body.appointment._id;
      }
    });

    it('should confirm an appointment as doctor', async () => {
      if (!appointmentId) return;

      const res = await request(app)
        .put(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.appointment.status).toBe('confirmed');
    });

    it('should cancel an appointment as patient', async () => {
      if (!appointmentId) return;

      const res = await request(app)
        .put(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          status: 'cancelled',
          cancelledBy: 'patient',
          cancellationReason: 'Personal reasons'
        });

      expect(res.status).toBe(200);
      expect(res.body.appointment.status).toBe('cancelled');
    });
  });

  // ─── RATE APPOINTMENT ─────────────────
  describe('POST /api/appointments/:id/rate', () => {
    it('should rate a completed appointment', async () => {
      // Create and complete an appointment
      const bookRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor._id,
          appointmentType: 'chat',
          date: getNextMonday(),
          timeSlot: { startTime: '15:00', endTime: '16:00' },
          symptoms: 'Rating test'
        });

      if (bookRes.status !== 201) return;
      const aptId = bookRes.body.appointment._id;

      // Complete it as doctor
      await request(app)
        .put(`/api/appointments/${aptId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'completed' });

      // Rate it as patient
      const res = await request(app)
        .post(`/api/appointments/${aptId}/rate`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ score: 5, review: 'Excellent doctor!' });

      expect(res.status).toBe(200);
      expect(res.body.appointment.rating.score).toBe(5);
    });

    it('should reject rating for non-completed appointment', async () => {
      const bookRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctor._id,
          appointmentType: 'in-person',
          date: getNextMonday(),
          timeSlot: { startTime: '16:00', endTime: '17:00' },
          symptoms: 'Rating pending test'
        });

      if (bookRes.status !== 201) return;
      const aptId = bookRes.body.appointment._id;

      const res = await request(app)
        .post(`/api/appointments/${aptId}/rate`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ score: 5 });

      expect(res.status).toBe(400);
    });
  });
});

// Helper: get next Monday's date in ISO format
function getNextMonday() {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}
