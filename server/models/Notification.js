const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'appointment_booked',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_rescheduled',
      'payment_received',
      'payment_failed',
      'new_message',
      'video_call_started',
      'video_call_ended',
      'prescription_shared',
      'doctor_approved',
      'doctor_rejected',
      'reminder_24h',
      'reminder_1h',
      'review_received'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    appointmentId: mongoose.Schema.Types.ObjectId,
    doctorId: mongoose.Schema.Types.ObjectId,
    patientId: mongoose.Schema.Types.ObjectId,
    roomId: String,
    amount: Number,
    url: String
  },
  read: { type: Boolean, default: false },
  readAt: Date,
  emailSent: { type: Boolean, default: false },
  smsSent: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
