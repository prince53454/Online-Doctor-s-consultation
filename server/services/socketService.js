const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');

function configureSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role isActive');
      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.data.user = { id: user._id.toString(), name: user.name, role: user.role };
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    socket.join(`user_${userId}`);

    socket.on('join-room', async (roomId, callback) => {
      if (typeof roomId !== 'string' || roomId.length === 0 || roomId.length > 128) {
        if (typeof callback === 'function') callback({ success: false, error: 'Invalid room' });
        return;
      }

      try {
        if (!(await canAccessRoom(roomId, socket.data.user))) {
          if (typeof callback === 'function') callback({ success: false, error: 'Not authorized' });
          return;
        }

        socket.join(roomId);
        if (typeof callback === 'function') callback({ success: true });
      } catch (error) {
        console.error('Socket room authorization error:', error);
        if (typeof callback === 'function') callback({ success: false, error: 'Unable to join room' });
      }
    });

    socket.on('leave-room', (payload) => {
      const roomId = typeof payload === 'string' ? payload : payload?.roomId;
      if (typeof roomId === 'string') socket.leave(roomId);
    });

    socket.on('video-signal', (payload = {}) => {
      const { roomId, signal } = payload;
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('video-signal', { signal, userId });
    });

    socket.on('chat-message', (payload = {}) => {
      const { roomId, message } = payload;
      if (!socket.rooms.has(roomId) || typeof message?.content !== 'string') return;
      socket.to(roomId).emit('chat-message', {
        ...message,
        sender: userId,
        senderName: socket.data.user.name
      });
    });

    socket.on('typing', ({ roomId } = {}) => {
      if (socket.rooms.has(roomId)) socket.to(roomId).emit('typing', { userId });
    });

    socket.on('stop-typing', ({ roomId } = {}) => {
      if (socket.rooms.has(roomId)) socket.to(roomId).emit('stop-typing', { userId });
    });

    socket.on('end-call', ({ roomId } = {}) => {
      if (socket.rooms.has(roomId)) socket.to(roomId).emit('call-ended');
    });

    socket.on('rtc-offer', ({ roomId, offer, to } = {}) => {
      relayToRoomParticipant(io, socket, roomId, to, 'rtc-offer', { offer });
    });

    socket.on('rtc-answer', ({ roomId, answer, to } = {}) => {
      relayToRoomParticipant(io, socket, roomId, to, 'rtc-answer', { answer });
    });

    socket.on('rtc-ice-candidate', ({ roomId, candidate, to } = {}) => {
      relayToRoomParticipant(io, socket, roomId, to, 'rtc-ice-candidate', { candidate });
    });
  });
}

async function canAccessRoom(roomId, user) {
  const consultation = await Consultation.findOne({ roomId });
  if (consultation) {
    if (consultation.patient.toString() === user.id) return true;
    const doctor = await Doctor.findById(consultation.doctor);
    return Boolean(doctor && doctor.user.toString() === user.id);
  }

  const appointment = await Appointment.findOne({ roomId });
  if (!appointment) return false;
  if (appointment.patient.toString() === user.id) return true;
  const doctor = await Doctor.findById(appointment.doctor);
  return Boolean(doctor && doctor.user.toString() === user.id);
}

function relayToRoomParticipant(io, socket, roomId, targetSocketId, event, payload) {
  if (!socket.rooms.has(roomId) || typeof targetSocketId !== 'string') return;
  const target = io.sockets.sockets.get(targetSocketId);
  if (target?.rooms.has(roomId)) {
    target.emit(event, { ...payload, from: socket.id });
  }
}

module.exports = { configureSockets, canAccessRoom };
