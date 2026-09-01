const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  fileType: {
    type: String,
    enum: ['lab-report', 'prescription', 'imaging', 'discharge-summary', 'vaccination', 'other'],
    default: 'other'
  },
  fileUrl: String,
  fileName: String,
  tags: [String],
  isShared: { type: Boolean, default: false },
  sharedWith: [{
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    sharedAt: Date,
    permission: { type: String, enum: ['view', 'download'], default: 'view' }
  }],
  labResults: [{
    testName: String,
    value: String,
    unit: String,
    normalRange: String,
    isAbnormal: Boolean
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: String,
    temperature: String,
    weight: String,
    height: String,
    bloodSugar: String,
    oxygenSaturation: String
  }
}, { timestamps: true });

reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ tags: 1 });

module.exports = mongoose.model('Report', reportSchema);
