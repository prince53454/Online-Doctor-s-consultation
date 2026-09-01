const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String },
  phone: { type: String },
  email: { type: String },
  avatar: { type: String },
  banner: { type: String },
  licenseNumber: { type: String }, // Drug license number
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0 },
  reviewCount: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  deliveryTime: { type: String, default: '2-4 hours' }, // Estimated delivery time
  freeDeliveryAbove: { type: Number, default: 500 }, // Free delivery above this amount
  deliveryFee: { type: Number, default: 49 },
  operatingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '22:00' }
  },
  tags: [String], // ["24x7", "fast-delivery", "verified"]
  medicines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  }
}, { timestamps: true });

pharmacySchema.index({ city: 1 });
pharmacySchema.index({ name: 'text', tags: 'text' });
pharmacySchema.index({ 'location': '2dsphere' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
