const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config({ override: true });

const app = require('./app');
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

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined notification room`);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('video-signal', ({ roomId, signal, userId }) => {
    io.to(roomId).emit('video-signal', { signal, userId });
  });

  socket.on('chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('chat-message', message);
  });

  socket.on('typing', ({ roomId, userId }) => {
    socket.to(roomId).emit('typing', { userId });
  });

  socket.on('stop-typing', ({ roomId, userId }) => {
    socket.to(roomId).emit('stop-typing', { userId });
  });

  socket.on('end-call', ({ roomId }) => {
    io.to(roomId).emit('call-ended');
  });

  socket.on('rtc-offer', ({ roomId, offer, to }) => {
    io.to(to).emit('rtc-offer', { offer, from: socket.id });
  });

  socket.on('rtc-answer', ({ roomId, answer, to }) => {
    io.to(to).emit('rtc-answer', { answer, from: socket.id });
  });

  socket.on('rtc-ice-candidate', ({ roomId, candidate, to }) => {
    io.to(to).emit('rtc-ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Database connection
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_pro')
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket ready`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, server, io };
