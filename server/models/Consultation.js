const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'chat', 'audio'],
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  roomId: { type: String, required: true, unique: true },
  dailyRoomUrl: String,
  dailyRoomName: String,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in minutes
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'prescription', 'lab-report'],
      default: 'text'
    },
    fileUrl: String,
    fileName: String,
    timestamp: { type: Date, default: Date.now }
  }],
  prescriptions: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    issuedAt: { type: Date, default: Date.now }
  }],
  doctorNotes: String,
  diagnosis: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: { type: Date, default: Date.now }
  }],
  summary: String,
  rating: {
    score: Number,
    review: String
  }
}, { timestamps: true });

consultationSchema.index({ roomId: 1 });
consultationSchema.index({ patient: 1, createdAt: -1 });
consultationSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
