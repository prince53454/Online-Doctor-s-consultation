const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const app = require('./app');
const connectDatabase = require('./config/database');
const { configureSockets } = require('./services/socketService');

const gateway = express();
gateway.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.name);
    res.status(503).json({ success: false, error: 'Database temporarily unavailable' });
  }
});
gateway.use(app);

const server = http.createServer(gateway);
const io = new Server(server, {
  path: '/api/socket/socket.io',
  transports: ['websocket'],
  cors: {
    origin: (process.env.CLIENT_URL || '').split(',').map(origin => origin.trim()),
    credentials: true
  }
});
io.use(async (socket, next) => {
  try { await connectDatabase(); next(); }
  catch { next(new Error('Database temporarily unavailable')); }
});
app.set('io', io);
configureSockets(io);

module.exports = server;
