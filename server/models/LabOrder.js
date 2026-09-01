const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  tests: [{
    testId: mongoose.Schema.Types.ObjectId,
    name: String,
    category: String,
    price: Number,
    fastingRequired: Boolean,
    reportTime: String
  }],
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  homeCollectionFee: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  appointmentDate: { type: Date, required: true },
  appointmentTime: String,
  homeCollection: { type: Boolean, default: false },
  collectionAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'online' },
  paymentId: String,
  reportUrl: String,
  reportUploadedAt: Date,
  notes: String,
  specialInstructions: String,
  cancellationReason: String,
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

labOrderSchema.index({ patient: 1, createdAt: -1 });
labOrderSchema.index({ lab: 1, status: 1 });
labOrderSchema.index({ status: 1, appointmentDate: 1 });

module.exports = mongoose.model('LabOrder', labOrderSchema);
