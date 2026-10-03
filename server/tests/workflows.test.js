const request = require('supertest');
const Notification = require('../models/Notification');
const Doctor = require('../models/Doctor');
const { generateToken, createTestUser, createTestDoctor } = require('./setup');

let app;

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  app = require('../app');
});

describe('Patient, doctor, and admin workflows', () => {
  it('notifies admins of a doctor application and keeps approval admin-controlled', async () => {
    const admin = await createTestUser({
      email: `workflow_admin_${Date.now()}@test.com`,
      role: 'admin'
    });
    const doctorUser = await createTestUser({
      email: `workflow_doctor_${Date.now()}@test.com`,
      role: 'doctor'
    });
    const adminToken = generateToken(admin._id, 'admin');
    const doctorToken = generateToken(doctorUser._id, 'doctor');
    const emitted = [];
    app.set('io', {
      to: room => ({
        emit: (event, payload) => emitted.push({ room, event, payload })
      })
    });

    const profileRes = await request(app)
      .put('/api/doctors/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        specialization: 'General Physician',
        experience: 3,
        licenseNumber: `WF-${Date.now()}`,
        consultationFee: { inPerson: 500, video: 300, chat: 200 },
        location: { type: 'Point', coordinates: [77.2, 28.5], city: 'Delhi', state: 'Delhi' },
        clinicName: 'Workflow Test Clinic',
        availability: [],
        isApproved: true,
        isFeatured: true
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.doctor.isApproved).toBe(false);
    expect(profileRes.body.doctor.isFeatured).toBe(false);

    const doctorId = profileRes.body.doctor._id;
    const privateProfileRes = await request(app).get(`/api/doctors/${doctorId}`);
    expect(privateProfileRes.status).toBe(404);

    let applicationNotice = null;
    for (let attempt = 0; attempt < 10 && !applicationNotice; attempt++) {
      applicationNotice = await Notification.findOne({
        recipient: admin._id,
        type: 'doctor_registered',
        'data.doctorId': doctorId
      });
      if (!applicationNotice) await new Promise(resolve => setTimeout(resolve, 20));
    }
    expect(applicationNotice).toBeTruthy();
    expect(emitted).toContainEqual(expect.objectContaining({
      room: `user_${admin._id}`,
      event: 'notification',
      payload: expect.objectContaining({ type: 'doctor_registered' })
    }));

    const approvalRes = await request(app)
      .put(`/api/admin/doctors/${doctorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true });

    expect(approvalRes.status).toBe(200);
    expect(approvalRes.body.doctor.isApproved).toBe(true);
    const publicProfileRes = await request(app).get(`/api/doctors/${doctorId}`);
    expect(publicProfileRes.status).toBe(200);

    let approvalNotice = null;
    for (let attempt = 0; attempt < 10 && !approvalNotice; attempt++) {
      approvalNotice = await Notification.findOne({
        recipient: doctorUser._id,
        type: 'doctor_approved',
        'data.doctorId': doctorId
      });
      if (!approvalNotice) await new Promise(resolve => setTimeout(resolve, 20));
    }
    expect(approvalNotice).toBeTruthy();
    expect(emitted).toContainEqual(expect.objectContaining({
      room: `user_${doctorUser._id}`,
      event: 'notification',
      payload: expect.objectContaining({ type: 'doctor_approved' })
    }));
    app.set('io', undefined);
  });

  it('broadcasts patient booking and rescheduling changes to the doctor and admins', async () => {
    const patient = await createTestUser({ email: `workflow_patient_${Date.now()}@test.com` });
    const admin = await createTestUser({
      email: `workflow_booking_admin_${Date.now()}@test.com`,
      role: 'admin'
    });
    const { user: doctorUser, doctor } = await createTestDoctor({
      user: { email: `workflow_booking_doctor_${Date.now()}@test.com` }
    });
    const patientToken = generateToken(patient._id, 'patient');
    const doctorToken = generateToken(doctorUser._id, 'doctor');
    const emitted = [];
    app.set('io', {
      to: room => ({
        emit: (event, payload) => emitted.push({ room, event, payload })
      })
    });

    const bookingRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctor._id,
        appointmentType: 'video',
        date: getNextMonday(),
        timeSlot: { startTime: '09:00', endTime: '10:00' },
        symptoms: 'Workflow integration test'
      });
    expect(bookingRes.status).toBe(201);

    const appointmentId = bookingRes.body.appointment._id;
    const bookedNotice = await waitForNotification({
      recipient: admin._id,
      type: 'appointment_booked',
      'data.appointmentId': appointmentId
    });
    expect(bookedNotice).toBeTruthy();

    const rescheduleRes = await request(app)
      .put(`/api/appointments/${appointmentId}/reschedule`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        date: getNextMonday(),
        timeSlot: { startTime: '10:00', endTime: '11:00' },
        reason: 'Patient requested another time'
      });
    expect(rescheduleRes.status).toBe(200);
    expect(rescheduleRes.body.appointment.status).toBe('rescheduled');

    const adminUpdate = await waitForNotification({
      recipient: admin._id,
      type: 'appointment_status_updated',
      'data.appointmentId': appointmentId,
      'data.status': 'rescheduled'
    });
    expect(adminUpdate).toBeTruthy();

    const doctorView = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(doctorView.status).toBe(200);
    expect(doctorView.body.appointment.status).toBe('rescheduled');
    expect(doctorView.body.appointment.timeSlot.startTime).toBe('10:00');
    expect(emitted).toContainEqual(expect.objectContaining({
      room: `user_${admin._id}`,
      event: 'notification',
      payload: expect.objectContaining({ type: 'appointment_status_updated' })
    }));
    expect(emitted).toContainEqual(expect.objectContaining({
      room: `user_${doctorUser._id}`,
      event: 'notification',
      payload: expect.objectContaining({ type: 'appointment_rescheduled' })
    }));
    app.set('io', undefined);
  });

  it('rejects malformed approval changes', async () => {
    const admin = await createTestUser({
      email: `workflow_admin_invalid_${Date.now()}@test.com`,
      role: 'admin'
    });
    const { doctor } = await createTestDoctor({
      user: { email: `workflow_doctor_invalid_${Date.now()}@test.com` },
      doctor: { isApproved: false }
    });

    const res = await request(app)
      .put(`/api/admin/doctors/${doctor._id}/approve`)
      .set('Authorization', `Bearer ${generateToken(admin._id, 'admin')}`)
      .send({ approved: 'true' });

    expect(res.status).toBe(400);
    const unchangedDoctor = await Doctor.findById(doctor._id);
    expect(unchangedDoctor.isApproved).toBe(false);
  });

  it('keeps rejected applications distinct and supports reconsideration and featuring', async () => {
    const admin = await createTestUser({
      email: `workflow_review_admin_${Date.now()}@test.com`,
      role: 'admin'
    });
    const { doctor } = await createTestDoctor({
      user: { email: `workflow_review_doctor_${Date.now()}@test.com` },
      doctor: { isApproved: false }
    });
    const adminToken = generateToken(admin._id, 'admin');
    const adminGet = path => request(app).get(path).set('Authorization', `Bearer ${adminToken}`);
    const adminPut = path => request(app).put(path).set('Authorization', `Bearer ${adminToken}`);

    const pendingBefore = await adminGet('/api/admin/doctors/pending');
    expect(pendingBefore.body.doctors.some(item => item._id === doctor.id)).toBe(true);

    const rejection = await adminPut(`/api/admin/doctors/${doctor.id}/approve`)
      .send({ approved: false });
    expect(rejection.status).toBe(200);
    expect(rejection.body.doctor.isApproved).toBe(false);
    expect(rejection.body.doctor.isRejected).toBe(true);

    const pendingAfter = await adminGet('/api/admin/doctors/pending');
    expect(pendingAfter.body.doctors.some(item => item._id === doctor.id)).toBe(false);
    const rejectedList = await adminGet('/api/admin/doctors?status=rejected');
    expect(rejectedList.body.doctors.some(item => item._id === doctor.id)).toBe(true);

    const reconsideration = await adminPut(`/api/admin/doctors/${doctor.id}/approve`)
      .send({ approved: true });
    expect(reconsideration.status).toBe(200);
    expect(reconsideration.body.doctor.isApproved).toBe(true);
    expect(reconsideration.body.doctor.isRejected).toBe(false);

    const featureResult = await adminPut(`/api/admin/doctors/${doctor.id}/feature`);
    expect(featureResult.status).toBe(200);
    expect(featureResult.body.doctor.isFeatured).toBe(true);
  });
});

async function waitForNotification(query) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const notification = await Notification.findOne(query);
    if (notification) return notification;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  return null;
}

function getNextMonday() {
  const now = new Date();
  const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}
