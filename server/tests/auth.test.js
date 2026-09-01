const request = require('supertest');
const mongoose = require('mongoose');
const { generateToken, createTestUser } = require('./setup');

// We test against the Express app directly (no server.listen needed)
let app;

beforeAll(() => {
  // Set env for tests
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
  process.env.JWT_EXPIRE = '1h';

  // Import app after env is set
  app = require('../app');
});

describe('Auth Routes', () => {
  let testUser;
  let testEmail;

  // ─── REGISTER ─────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new patient', async () => {
      testEmail = `patient_${Date.now()}@test.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Patient',
          email: testEmail,
          password: 'password123',
          phone: '+919876543210',
          role: 'patient'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('Test Patient');
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('patient');
      expect(res.body.user.password).toBeUndefined(); // Password not leaked
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: testEmail,
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: `short_${Date.now()}@test.com`,
          password: '12345'
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `noname_${Date.now()}@test.com`,
          password: 'password123'
        });

      expect(res.status).toBe(400);
    });

    it('should not allow admin role via registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker',
          email: `hacker_${Date.now()}@test.com`,
          password: 'password123',
          role: 'admin'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('patient'); // Forced to patient
    });
  });

  // ─── LOGIN ────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should reject empty body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── GET PROFILE ──────────────────────
  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const user = await createTestUser({ email: `me_test_${Date.now()}@test.com` });
      const token = generateToken(user._id, user.role);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(user.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });
  });

  // ─── CHANGE PASSWORD ──────────────────
  describe('PUT /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const user = await createTestUser({ email: `changepw_${Date.now()}@test.com` });
      const token = generateToken(user._id, user.role);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'testpass123', newPassword: 'newpass456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'newpass456' });
      expect(loginRes.status).toBe(200);
    });

    it('should reject wrong current password', async () => {
      const user = await createTestUser({ email: `wrongpw_${Date.now()}@test.com` });
      const token = generateToken(user._id, user.role);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpass456' });

      expect(res.status).toBe(401);
    });

    it('should reject short new password', async () => {
      const user = await createTestUser({ email: `shortpw_${Date.now()}@test.com` });
      const token = generateToken(user._id, user.role);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'testpass123', newPassword: '12345' });

      expect(res.status).toBe(400);
    });
  });

  // ─── FORGOT PASSWORD ──────────────────
  describe('POST /api/auth/forgot-password', () => {
    it('should always return success (security)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should accept valid email', async () => {
      const user = await createTestUser({ email: `forgot_${Date.now()}@test.com` });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email });

      expect(res.status).toBe(200);
    });
  });
});
