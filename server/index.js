const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { configureSockets } = require('./services/socketService');
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

configureSockets(io);

function validateEnvironment() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter(key => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL must be configured in production');
  }
  const proxyHops = process.env.TRUST_PROXY_HOPS;
  if (proxyHops && (!Number.isInteger(Number(proxyHops)) || Number(proxyHops) < 0)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }
}

async function startServer() {
  validateEnvironment();
  await mongoose.connect(process.env.MONGODB_URI);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(process.env.PORT) || 5000, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  console.log(`Server listening on port ${server.address().port}`);
  return server;
}

async function stopServer(signal) {
  console.log(`${signal} received; shutting down`);
  await new Promise(resolve => io.close(resolve));
  await mongoose.disconnect();
  process.exitCode = 0;
}

if (require.main === module) {
  startServer().then(() => {
    process.once('SIGTERM', () => stopServer('SIGTERM'));
    process.once('SIGINT', () => stopServer('SIGINT'));
  }).catch(error => {
    console.error('Server startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, server, io, startServer, stopServer, validateEnvironment };
