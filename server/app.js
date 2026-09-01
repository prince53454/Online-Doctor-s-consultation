const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

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

// Rate limiting — generous for preview mode
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
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
  res.json({
    success: true,
    services: {
      stripe: isStripeConfigured(),
      cloudinary: cloudinaryConfigured,
      daily: dailyConfigured,
      email: !!(process.env.SMTP_USER && !process.env.SMTP_USER.includes('your_'))
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
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
