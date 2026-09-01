const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: [
      'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
      'Gastroenterologist', 'Neurologist', 'Oncologist', 'Orthopedic Surgeon',
      'Pediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist',
      'ENT Specialist', 'Ophthalmologist', 'Gynecologist', 'Dentist',
      'Ayurvedic', 'Homeopathic', 'Unani', 'Alternative Medicine'
    ]
  },
  subSpecialization: [String],
  qualification: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  consultationFee: {
    inPerson: { type: Number, required: true },
    video: { type: Number, required: true },
    chat: { type: Number, required: true }
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    address: String,
    city: { type: String, required: true },
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  clinicName: String,
  clinicAddress: String,
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [{
      startTime: String,
      endTime: String,
      isAvailable: { type: Boolean, default: true },
      maxPatients: { type: Number, default: 1 }
    }]
  }],
  blockedSlots: [{
    date: Date,
    startTime: String,
    endTime: String,
    reason: String
  }],
  languages: [{ type: String, default: ['English', 'Hindi'] }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  totalPatients: { type: Number, default: 0 },
  about: String,
  awards: [String],
  publications: [String],
  profileImages: [String],
  isOnline: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  responseTime: { type: String, default: '< 30 min' },
  acceptOnlineConsultation: { type: Boolean, default: true },
  languagesKnown: [String],
  tags: [String],
  verificationDocuments: [String]
}, { timestamps: true });

// Geospatial index for location-based search
doctorSchema.index({ 'location': '2dsphere' });

// Text index for search
doctorSchema.index({
  'clinicName': 'text',
  'about': 'text',
  'specialization': 'text',
  'tags': 'text'
});

// Virtual for full name
doctorSchema.virtual('fullName', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

doctorSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Doctor', doctorSchema);
