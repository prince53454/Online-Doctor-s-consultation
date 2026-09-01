const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: String,
  tags: [String],
  isVerified: { type: Boolean, default: true },
  doctorReply: {
    content: String,
    repliedAt: Date
  }
}, { timestamps: true });

reviewSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
