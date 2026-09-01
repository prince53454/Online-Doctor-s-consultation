const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  category: {
    type: String,
    enum: ['prescription', 'otc', 'wellness', 'personal-care', 'baby-care', 'diabetic-care', 'ayurvedic', 'homeopathy'],
    required: true
  },
  subcategory: { type: String }, // e.g., "Pain Relief", "Antibiotics", "Vitamins"
  description: { type: String },
  composition: { type: String }, // e.g., "Paracetamol 500mg"
  manufacturer: { type: String },
  dosageForm: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'ointment', 'inhaler', 'powder', 'gel', 'spray', 'sachet'] },
  strength: { type: String }, // e.g., "500mg", "10ml"
  packSize: { type: String }, // e.g., "1 strip of 10", "1 bottle of 60ml"
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  prescriptionRequired: { type: Boolean, default: false },
  image: { type: String }, // Medicine box image
  thumbnail: { type: String },
  sideEffects: [String],
  warnings: [String],
  storageInstructions: { type: String },
  expiryDate: { type: Date },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 100 },
  tags: [String],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  alternateMedicines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }], // Generic alternatives
  requirePrescription: { type: Boolean, default: false }
}, { timestamps: true });

medicineSchema.index({ name: 'text', genericName: 'text', description: 'text', tags: 'text' });
medicineSchema.index({ category: 1 });
medicineSchema.index({ slug: 1 });
medicineSchema.index({ price: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
