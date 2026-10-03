const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const authRouter = require('./routes/auth');

const app = express();

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Honor the reverse proxy address in production so IP-based limits work correctly.
app.set('trust proxy', process.env.TRUST_PROXY_HOPS
  ? Number(process.env.TRUST_PROXY_HOPS)
  : (process.env.NODE_ENV === 'production' ? 1 : false));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again later.' }
});
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many password reset attempts. Please try again later.' }
});

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.post('/api/auth/login', loginLimiter);
app.post('/api/auth/admin-access', loginLimiter);
app.post('/api/auth/forgot-password', passwordResetLimiter);
app.put('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth', authRouter);
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/payments', require('./routes/payments'));
const { adminRouter: settingsAdmin, publicRouter: settingsPublic } = require('./routes/settings');
app.use('/api/admin/settings', settingsAdmin);
app.use('/api/settings', settingsPublic);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/aiBooking'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/labs', require('./routes/labs'));
app.use('/api/pharmacy', require('./routes/pharmacy'));

// Health check
app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'OK' : 'NOT_READY',
    database: databaseReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/live', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Daily.co config for frontend
app.get('/api/video/config', (req, res) => {
  const { getDailyConfig } = require('./services/dailyService');
  res.json({ success: true, config: getDailyConfig() });
});

// Service status check
app.get('/api/status', (req, res) => {
  const { isStripeConfigured } = require('./services/stripeService');
  const { isConfigured: cloudinaryConfigured } = require('./services/cloudinaryService');
  const { isConfigured: dailyConfigured } = require('./services/dailyService');
  const { isConfigured: emailConfigured } = require('./services/emailService');
  res.json({
    success: true,
    services: {
      stripe: isStripeConfigured(),
      cloudinary: cloudinaryConfigured,
      daily: dailyConfigured,
      email: emailConfigured
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  console.error('Request error:', err);
  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || 'Internal Server Error')
  });
});

// Serve static React build in production
const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuild));

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// All other routes serve the React app (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'), (err) => {
    if (err) res.status(404).json({ success: false, error: 'Not found' });
  });
});

module.exports = app;
