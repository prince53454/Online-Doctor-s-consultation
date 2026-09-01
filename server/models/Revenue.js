const mongoose = require('mongoose');

// ── Individual Transaction Record ─────────────────────────────
const transactionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
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

  // Money breakdown
  totalAmount: { type: Number, required: true },       // What patient paid
  platformFee: { type: Number, required: true },        // Admin's commission
  doctorShare: { type: Number, required: true },        // Doctor's earnings
  taxAmount: { type: Number, default: 0 },              // GST/tax collected
  discountAmount: { type: Number, default: 0 },         // Coupon discount applied
  netAmount: { type: Number, required: true },          // After discount

  // Platform fee config at time of transaction
  platformFeeType: { type: String, enum: ['percentage', 'fixed'], required: true },
  platformFeeValue: { type: Number, required: true },   // % or flat amount

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'partially_refunded', 'disputed'],
    default: 'pending'
  },

  // Refund tracking
  refundAmount: { type: Number, default: 0 },
  refundReason: String,
  refundedAt: Date,

  // Payment info
  paymentMethod: { type: String, default: 'stripe' },
  stripePaymentId: String,

  // Payout tracking
  payoutStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'processing', 'paid', 'failed'],
    default: 'unpaid'
  },
  paidAt: Date,
  payoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout'
  }
}, { timestamps: true });

transactionSchema.index({ doctor: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ payoutStatus: 1 });
transactionSchema.index({ patient: 1, createdAt: -1 });

// ── Doctor Earnings Ledger ────────────────────────────────────
const doctorEarningsSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  totalEarned: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  totalAppointments: { type: Number, default: 0 },
  totalRefunds: { type: Number, default: 0 },
  averagePerAppointment: { type: Number, default: 0 },
  lastPayoutAt: Date,
  lastEarningAt: Date
}, { timestamps: true });

// ── Platform Revenue Summary ──────────────────────────────────
const platformRevenueSchema = new mongoose.Schema({
  // Period identifier (YYYY-MM for monthly, YYYY-Wxx for weekly)
  period: { type: String, required: true, unique: true },
  periodType: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },

  // Revenue
  totalCollected: { type: Number, default: 0 },       // Total patient payments
  totalPlatformFee: { type: Number, default: 0 },     // Admin's total commission
  totalDoctorPayout: { type: Number, default: 0 },    // Total paid to doctors
  totalTax: { type: Number, default: 0 },             // Total tax collected
  totalRefunds: { type: Number, default: 0 },
  netRevenue: { type: Number, default: 0 },           // Platform fee - refunds

  // Counts
  totalAppointments: { type: Number, default: 0 },
  completedAppointments: { type: Number, default: 0 },
  cancelledAppointments: { type: Number, default: 0 },
  newPatients: { type: Number, default: 0 },
  newDoctors: { type: Number, default: 0 },

  // Average
  averageAppointmentValue: { type: Number, default: 0 },
  averagePlatformFee: { type: Number, default: 0 }
}, { timestamps: true });

// ── Payout Record ─────────────────────────────────────────────
const payoutSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  amount: { type: Number, required: true },
  transactionCount: { type: Number, required: true },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],

  // Payment details
  method: { type: String, enum: ['bank_transfer', 'upi', 'manual'], default: 'bank_transfer' },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolder: String,
    upiId: String
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  reference: String,  // Bank reference number
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, { timestamps: true });

payoutSchema.index({ doctor: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
const DoctorEarnings = mongoose.model('DoctorEarnings', doctorEarningsSchema);
const PlatformRevenue = mongoose.model('PlatformRevenue', platformRevenueSchema);
const Payout = mongoose.model('Payout', payoutSchema);

module.exports = { Transaction, DoctorEarnings, PlatformRevenue, Payout };
