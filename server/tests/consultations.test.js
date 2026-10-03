const request = require('supertest');
const { generateToken, createTestUser, createTestDoctor } = require('./setup');
const { configureSockets } = require('../services/socketService');

let app;
let patient;
let doctorUser;
let otherUser;
let appointment;
let patientToken;
let doctorToken;
let otherToken;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  process.env.JWT_EXPIRE = '1h';

  app = require('../app');
  patient = await createTestUser({ email: `consult_patient_${Date.now()}@test.com` });
  otherUser = await createTestUser({ email: `consult_other_${Date.now()}@test.com` });
  const doctorData = await createTestDoctor({
    user: { email: `consult_doctor_${Date.now()}@test.com` },
    doctor: { isApproved: true }
  });
  doctorUser = doctorData.user;

  const Appointment = require('../models/Appointment');
  appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctorData.doctor._id,
    appointmentType: 'chat',
    date: new Date(Date.now() + 86400000),
    timeSlot: { startTime: '09:00', endTime: '10:00' },
    symptoms: 'Consultation integration test',
    roomId: `appointment-room-${Date.now()}`,
    status: 'confirmed',
    payment: { amount: 200, currency: 'INR', status: 'completed' }
  });

  patientToken = generateToken(patient._id, 'patient');
  doctorToken = generateToken(doctorUser._id, 'doctor');
  otherToken = generateToken(otherUser._id, 'patient');
});

describe('Consultation Routes', () => {
  it('creates and resolves a consultation using the appointment room ID', async () => {
    const res = await request(app)
      .get(`/api/consultations/${appointment.roomId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.consultation.appointment).toBe(appointment._id.toString());
    expect(res.body.consultation.roomId).toBe(appointment.roomId);
    expect(res.body.consultation.type).toBe('chat');

    const history = await request(app)
      .get('/api/consultations/my-history')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(history.status).toBe(200);
    expect(history.body.consultations).toHaveLength(1);
  });

  it('allows appointment participants and rejects unrelated users', async () => {
    const doctorRead = await request(app)
      .get(`/api/consultations/${appointment.roomId}/messages`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(doctorRead.status).toBe(200);

    const unrelatedRead = await request(app)
      .get(`/api/consultations/${appointment.roomId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(unrelatedRead.status).toBe(403);

    const unrelatedMessage = await request(app)
      .post(`/api/consultations/${appointment.roomId}/message`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'unauthorized' });
    expect(unrelatedMessage.status).toBe(403);
  });

  it('authenticates sockets and restricts room joins to appointment participants', async () => {
    let authenticate;
    let onConnection;
    const io = {
      use: handler => { authenticate = handler; },
      on: (event, handler) => {
        if (event === 'connection') onConnection = handler;
      },
      sockets: { sockets: new Map() }
    };
    configureSockets(io);

    const handlers = {};
    const patientSocket = {
      handshake: { auth: { token: patientToken } },
      data: {},
      rooms: new Set(['patient-socket']),
      join: jest.fn(),
      on: (event, handler) => { handlers[event] = handler; },
      to: jest.fn()
    };
    const patientAuthError = await new Promise(resolve => authenticate(patientSocket, resolve));
    expect(patientAuthError).toBeUndefined();
    onConnection(patientSocket);

    const allowed = await new Promise(resolve => {
      handlers['join-room'](appointment.roomId, resolve);
    });
    expect(allowed).toEqual({ success: true });
    expect(patientSocket.join).toHaveBeenCalledWith(appointment.roomId);

    const otherHandlers = {};
    const otherSocket = {
      handshake: { auth: { token: otherToken } },
      data: {},
      rooms: new Set(['other-socket']),
      join: jest.fn(),
      on: (event, handler) => { otherHandlers[event] = handler; },
      to: jest.fn()
    };
    const otherAuthError = await new Promise(resolve => authenticate(otherSocket, resolve));
    expect(otherAuthError).toBeUndefined();
    onConnection(otherSocket);

    const denied = await new Promise(resolve => {
      otherHandlers['join-room'](appointment.roomId, resolve);
    });
    expect(denied).toEqual({ success: false, error: 'Not authorized' });
    expect(otherSocket.join).not.toHaveBeenCalledWith(appointment.roomId);

    const anonymousSocket = { handshake: { auth: {} } };
    const anonymousError = await new Promise(resolve => authenticate(anonymousSocket, resolve));
    expect(anonymousError).toBeInstanceOf(Error);
    expect(anonymousError.message).toMatch(/authentication required/i);
  });
});
