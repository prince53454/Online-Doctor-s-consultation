const mongoose = require('mongoose');

const testItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['blood', 'urine', 'imaging', 'cardiac', 'hormone', 'package', 'other'], required: true },
  description: String,
  price: { type: Number, required: true },
  discountPrice: Number,
  duration: { type: String, default: 'Same day' },
  fastingRequired: { type: Boolean, default: false },
  reportTime: { type: String, default: '24 hours' },
  homeCollection: { type: Boolean, default: true },
  popular: { type: Boolean, default: false }
}, { _id: true });

const labSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  avatar: String,
  rating: { type: Number, default: 4.0 },
  totalReviews: { type: Number, default: 0 },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  phone: String,
  email: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  operatingHours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: true } }
  },
  tests: [testItemSchema],
  homeCollectionAvailable: { type: Boolean, default: true },
  homeCollectionFee: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isNABL: { type: Boolean, default: true },
  totalTests: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  images: [String],
  tags: [String]
}, { timestamps: true });

labSchema.index({ location: '2dsphere' });
labSchema.index({ city: 1, isActive: 1 });
labSchema.index({ 'tests.category': 1 });

module.exports = mongoose.model('Lab', labSchema);
