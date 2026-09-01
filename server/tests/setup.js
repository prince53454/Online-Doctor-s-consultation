const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_test';

// Connect to test database before all tests
beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
});

// Clean up after all tests
afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await mongoose.connection.close();
});

// Helper: generate JWT token for a user
function generateToken(userId, role = 'patient') {
  return jwt.sign(
    { id: userId, role, email: `${role}@test.com` },
    process.env.JWT_SECRET || 'test-secret-key-for-jest',
    { expiresIn: '1h' }
  );
}

// Helper: create a test user in the database
async function createTestUser(overrides = {}) {
  const User = require('../models/User');

  const userData = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'testpass123',
    role: 'patient',
    phone: '+919876543210',
    ...overrides
  };

  // Use new User + save() so the pre-save hook hashes the password
  const user = new User(userData);
  await user.save();

  return user;
}

// Helper: create a test doctor
async function createTestDoctor(overrides = {}) {
  const User = require('../models/User');
  const Doctor = require('../models/Doctor');

  const email = `doctor_${Date.now()}@example.com`;

  const user = new User({
    name: 'Dr. Test Doctor',
    email,
    password: 'doctorpass123',
    role: 'doctor',
    phone: '+919876543210',
    ...overrides.user
  });
  await user.save();

  const doctor = await Doctor.create({
    user: user._id,
    specialization: 'General Physician',
    experience: 10,
    licenseNumber: 'MCI-TEST-' + Date.now(),
    consultationFee: { inPerson: 500, video: 300, chat: 200 },
    location: { type: 'Point', coordinates: [77.2, 28.5], city: 'Delhi', state: 'Delhi', country: 'India' },
    clinicName: 'Test Clinic',
    availability: [{
      day: 'Monday',
      slots: [
        { startTime: '09:00', endTime: '10:00', isAvailable: true, maxPatients: 1 },
        { startTime: '10:00', endTime: '11:00', isAvailable: true, maxPatients: 1 }
      ]
    }],
    isApproved: true,
    ...overrides.doctor
  });

  return { user, doctor };
}

module.exports = {
  generateToken,
  createTestUser,
  createTestDoctor,
  MONGODB_URI
};
