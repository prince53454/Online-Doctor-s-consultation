const mongoose = require('mongoose');

const pharmacyOrderSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    prescriptionRequired: { type: Boolean, default: false },
    prescriptionUploaded: { type: Boolean, default: false },
    prescriptionUrl: String
  }],
  prescriptionUrl: String, // Overall prescription for the order
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  deliveryAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    pincode: String,
    landmark: String,
    type: { type: String, enum: ['home', 'office', 'other'], default: 'home' }
  },
  payment: {
    method: { type: String, enum: ['razorpay', 'cod', 'wallet', 'upi'], default: 'razorpay' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
    amount: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  deliveryPartner: {
    name: String,
    phone: String,
    vehicleNumber: String
  },
  cancelReason: String,
  notes: String,
  statusHistory: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

pharmacyOrderSchema.index({ patient: 1, createdAt: -1 });
pharmacyOrderSchema.index({ pharmacy: 1, status: 1 });

module.exports = mongoose.model('PharmacyOrder', pharmacyOrderSchema);
