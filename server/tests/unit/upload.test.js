const request = require('supertest');
const express = require('express');
jest.mock('../../src/middleware/auth', () => ({ protect: (req, res, next) => { req.user = { id: 'upload-test' }; next(); } }));
const originalEnv = { ...process.env };
let app, uploadStream;
beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  const cloudinary = require('cloudinary').v2;
  uploadStream = jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options, callback) => ({ end: buffer => callback(null, { secure_url: 'https://res.cloudinary.com/test-cloud/prescription.png', public_id: 'test-prescription', format: 'png', resource_type: 'image', bytes: buffer.length }) }));
  app = express();
  app.use('/api/upload', require('../../src/routes/upload'));
});
afterAll(() => {
  jest.restoreAllMocks();
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});
it('passes multipart prescription content to storage and returns its real URL', async () => {
  const response = await request(app).post('/api/upload/file').field('folder', 'mediconnect/prescriptions').attach('file', Buffer.from('test-image'), { filename: 'prescription.png', contentType: 'image/png' });
  expect(response.status).toBe(200);
  expect(response.body.file.url).toBe('https://res.cloudinary.com/test-cloud/prescription.png');
  expect(uploadStream).toHaveBeenCalledWith(expect.objectContaining({ folder: 'mediconnect/prescriptions' }), expect.any(Function));
});
it('rejects unsupported prescription file types', async () => {
  const response = await request(app).post('/api/upload/file').attach('file', Buffer.from('test'), { filename: 'prescription.exe', contentType: 'application/octet-stream' });
  expect(response.status).toBe(400);
});
it('rejects oversized files with a useful error', async () => {
  const response = await request(app).post('/api/upload/file').attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), { filename: 'prescription.pdf', contentType: 'application/pdf' });
  expect(response.status).toBe(413);
});
