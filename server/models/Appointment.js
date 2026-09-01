const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  appointmentType: {
    type: String,
    enum: ['in-person', 'video', 'chat'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show', 'rescheduled'],
    default: 'pending'
  },
  symptoms: {
    type: String,
    required: [true, 'Please describe your symptoms']
  },
  medicalHistory: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  consultation: {
    notes: String,
    prescription: [{
      medicine: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    diagnosis: String,
    followUpDate: Date,
    labTests: [String],
    referrals: [String]
  },
  payment: {
    amount: Number,
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentId: String,
    paidAt: Date
  },
  roomId: String,
  isAIBooking: { type: Boolean, default: false },
  aiRecommendation: String,
  rating: {
    score: { type: Number, min: 1, max: 5 },
    review: String,
    reviewedAt: Date
  },
  reminderSent: { type: Boolean, default: false },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'admin']
  },
  cancellationReason: String,
  refundAmount: Number
}, { timestamps: true });

// Indexes
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
