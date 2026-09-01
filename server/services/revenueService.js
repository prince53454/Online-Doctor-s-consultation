const { Transaction, DoctorEarnings, PlatformRevenue, Payout } = require('../models/Revenue');
const Settings = require('../models/Settings');
const Appointment = require('../models/Appointment');

// ── Calculate Revenue Split ───────────────────────────────────
async function calculateSplit(totalAmount, doctorId) {
  const settings = await Settings.getSettings();
  const { payments } = settings;

  let platformFee = 0;
  let platformFeeType = 'percentage';
  let platformFeeValue = 0;

  if (payments.platformFeeEnabled) {
    platformFeeType = payments.platformFeeType;
    platformFeeValue = payments.platformFeeType === 'percentage'
      ? payments.platformFeePercentage
      : payments.platformFeeFixed;

    platformFee = payments.platformFeeType === 'percentage'
      ? Math.round((totalAmount * payments.platformFeePercentage) / 100)
      : payments.platformFeeFixed;
  }

  const doctorShare = totalAmount - platformFee;

  return {
    totalAmount,
    platformFee,
    doctorShare,
    platformFeeType,
    platformFeeValue,
    taxEnabled: payments.taxEnabled,
    taxPercentage: payments.taxPercentage || 0,
    taxName: payments.taxName || 'GST'
  };
}

// ── Record a Transaction (after payment confirmed) ────────────
async function recordTransaction(appointment) {
  // Check if transaction already exists
  const existing = await Transaction.findOne({ appointment: appointment._id });
  if (existing) return existing;

  const split = await calculateSplit(appointment.payment.amount, appointment.doctor);

  const transaction = await Transaction.create({
    appointment: appointment._id,
    patient: appointment.patient,
    doctor: appointment.doctor,
    totalAmount: split.totalAmount,
    platformFee: split.platformFee,
    doctorShare: split.doctorShare,
    netAmount: split.totalAmount,
    platformFeeType: split.platformFeeType,
    platformFeeValue: split.platformFeeValue,
    taxAmount: split.taxEnabled ? Math.round((split.totalAmount * split.taxPercentage) / 100) : 0,
    status: 'completed',
    stripePaymentId: appointment.payment.stripePaymentId
  });

  // Update doctor earnings
  await updateDoctorEarnings(appointment.doctor, split.doctorShare, transaction._id);

  // Update platform revenue for this period
  await updatePlatformRevenue(split, transaction);

  return transaction;
}

// ── Update Doctor Earnings Ledger ─────────────────────────────
async function updateDoctorEarnings(doctorId, amount, transactionId) {
  let earnings = await DoctorEarnings.findOne({ doctor: doctorId });

  if (!earnings) {
    earnings = await DoctorEarnings.create({
      doctor: doctorId,
      totalEarned: amount,
      pendingBalance: amount,
      totalAppointments: 1,
      averagePerAppointment: amount,
      lastEarningAt: new Date()
    });
  } else {
    earnings.totalEarned += amount;
    earnings.pendingBalance += amount;
    earnings.totalAppointments += 1;
    earnings.averagePerAppointment = Math.round(earnings.totalEarned / earnings.totalAppointments);
    earnings.lastEarningAt = new Date();
    await earnings.save();
  }
}

// ── Update Platform Revenue Summary ───────────────────────────
async function updatePlatformRevenue(split, transaction) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
  const yearKey = `${now.getFullYear()}`;

  // Update monthly
  await upsertRevenuePeriod(monthKey, 'monthly', split, transaction);
  // Update daily
  await upsertRevenuePeriod(dayKey, 'daily', split, transaction);
  // Update weekly
  await upsertRevenuePeriod(weekKey, 'weekly', split, transaction);
  // Update yearly
  await upsertRevenuePeriod(yearKey, 'yearly', split, transaction);
}

async function upsertRevenuePeriod(period, periodType, split, transaction) {
  const update = {
    $inc: {
      totalCollected: split.totalAmount,
      totalPlatformFee: split.platformFee,
      totalDoctorPayout: split.doctorShare,
      totalTax: split.taxEnabled ? Math.round((split.totalAmount * split.taxPercentage) / 100) : 0,
      totalAppointments: 1,
      completedAppointments: 1
    },
    $set: { lastUpdated: new Date() }
  };

  await PlatformRevenue.findOneAndUpdate(
    { period, periodType },
    update,
    { upsert: true, new: true }
  );
}

// ── Handle Refund Revenue Impact ──────────────────────────────
async function recordRefund(appointmentId, refundAmount) {
  const transaction = await Transaction.findOne({ appointment: appointmentId });
  if (!transaction) return null;

  transaction.refundAmount += refundAmount;
  transaction.totalRefunds = (transaction.totalRefunds || 0) + refundAmount;
  transaction.refundedAt = new Date();

  // Calculate platform fee refund (proportional)
  const platformFeeRefund = Math.round((refundAmount * transaction.platformFee) / transaction.totalAmount);
  const doctorShareRefund = refundAmount - platformFeeRefund;

  transaction.status = transaction.refundAmount >= transaction.totalAmount ? 'refunded' : 'partially_refunded';
  await transaction.save();

  // Deduct from doctor earnings
  const earnings = await DoctorEarnings.findOne({ doctor: transaction.doctor });
  if (earnings) {
    earnings.totalRefunds += doctorShareRefund;
    earnings.pendingBalance -= doctorShareRefund;
    earnings.totalPaid = Math.max(0, earnings.totalPaid - doctorShareRefund);
    await earnings.save();
  }

  // Deduct from platform revenue
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await PlatformRevenue.findOneAndUpdate(
    { period: monthKey, periodType: 'monthly' },
    {
      $inc: {
        totalRefunds: refundAmount,
        totalPlatformFee: -platformFeeRefund,
        totalDoctorPayout: -doctorShareRefund,
        totalCollected: -refundAmount
      }
    }
  );

  return transaction;
}

// ── Process Doctor Payout ─────────────────────────────────────
async function processPayout(doctorId, adminUserId) {
  const earnings = await DoctorEarnings.findOne({ doctor: doctorId });
  if (!earnings || earnings.pendingBalance <= 0) {
    throw new Error('No pending balance for this doctor');
  }

  // Get all unpaid transactions for this doctor
  const unpaidTransactions = await Transaction.find({
    doctor: doctorId,
    payoutStatus: 'unpaid',
    status: 'completed'
  });

  if (unpaidTransactions.length === 0) {
    throw new Error('No unpaid transactions found');
  }

  const totalAmount = unpaidTransactions.reduce((sum, t) => sum + t.doctorShare, 0);

  // Create payout record
  const payout = await Payout.create({
    doctor: doctorId,
    amount: totalAmount,
    transactionCount: unpaidTransactions.length,
    transactions: unpaidTransactions.map(t => t._id),
    status: 'processing',
    processedBy: adminUserId
  });

  // Mark transactions as paid
  for (const t of unpaidTransactions) {
    t.payoutStatus = 'processing';
    t.payoutId = payout._id;
    await t.save();
  }

  // Update doctor earnings
  earnings.pendingBalance -= totalAmount;
  earnings.totalPaid += totalAmount;
  earnings.lastPayoutAt = new Date();
  await earnings.save();

  return payout;
}

// ── Get Admin Revenue Dashboard Data ──────────────────────────
async function getAdminDashboardData() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const yearKey = `${now.getFullYear()}`;

  const [currentMonth, lastMonthData, yearData, recentTransactions, pendingPayouts, topDoctors] = await Promise.all([
    PlatformRevenue.findOne({ period: monthKey, periodType: 'monthly' }),
    PlatformRevenue.findOne({ period: lastMonthKey, periodType: 'monthly' }),
    PlatformRevenue.findOne({ period: yearKey, periodType: 'yearly' }),
    Transaction.find({ status: 'completed' })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .populate('patient', 'name avatar')
      .sort('-createdAt')
      .limit(20)
      .lean(),
    Transaction.aggregate([
      { $match: { payoutStatus: 'unpaid', status: 'completed' } },
      { $group: { _id: '$doctor', total: { $sum: '$doctorShare' }, count: { $sum: 1 } } },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctorInfo' } },
      { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'doctorInfo.user', foreignField: '_id', as: 'userInfo' } },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]),
    DoctorEarnings.find()
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .sort('-totalEarned')
      .limit(10)
      .lean()
  ]);

  // Calculate growth
  const revenueGrowth = lastMonthData?.totalPlatformFee
    ? ((currentMonth?.totalPlatformFee - lastMonthData.totalPlatformFee) / lastMonthData.totalPlatformFee * 100).toFixed(1)
    : 0;

  const appointmentGrowth = lastMonthData?.totalAppointments
    ? ((currentMonth?.totalAppointments - lastMonthData.totalAppointments) / lastMonthData.totalAppointments * 100).toFixed(1)
    : 0;

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = await PlatformRevenue.findOne({ period: key, periodType: 'monthly' });
    monthlyTrend.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      platformFee: data?.totalPlatformFee || 0,
      doctorPayout: data?.totalDoctorPayout || 0,
      totalCollected: data?.totalCollected || 0,
      appointments: data?.totalAppointments || 0
    });
  }

  return {
    currentMonth: currentMonth || { totalCollected: 0, totalPlatformFee: 0, totalDoctorPayout: 0, totalAppointments: 0, totalRefunds: 0 },
    yearData: yearData || { totalCollected: 0, totalPlatformFee: 0, totalDoctorPayout: 0, totalAppointments: 0 },
    revenueGrowth: Number(revenueGrowth),
    appointmentGrowth: Number(appointmentGrowth),
    recentTransactions,
    pendingPayouts,
    topDoctors,
    monthlyTrend
  };
}

// ── Get Doctor Earnings Data ──────────────────────────────────
async function getDoctorEarnings(doctorId) {
  const [earnings, transactions, recentPayouts, monthlyData] = await Promise.all([
    DoctorEarnings.findOne({ doctor: doctorId })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar email' } }),
    Transaction.find({ doctor: doctorId, status: 'completed' })
      .populate('patient', 'name avatar')
      .populate({ path: 'appointment', select: 'appointmentType date timeSlot' })
      .sort('-createdAt')
      .limit(50)
      .lean(),
    Payout.find({ doctor: doctorId })
      .sort('-createdAt')
      .limit(10)
      .lean(),
    // Last 6 months earnings
    (async () => {
      const result = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthTransactions = await Transaction.find({
          doctor: doctorId,
          status: 'completed',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const earned = monthTransactions.reduce((sum, t) => sum + t.doctorShare, 0);
        result.push({
          month: monthNames[d.getMonth()],
          earned,
          appointments: monthTransactions.length
        });
      }
      return result;
    })()
  ]);

  // Today's and this week's earnings
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [todayData, weekData] = await Promise.all([
    Transaction.aggregate([
      { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(doctorId), status: 'completed', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$doctorShare' }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(doctorId), status: 'completed', createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$doctorShare' }, count: { $sum: 1 } } }
    ])
  ]);

  return {
    earnings: earnings || { totalEarned: 0, totalPaid: 0, pendingBalance: 0, totalAppointments: 0 },
    transactions,
    recentPayouts,
    monthlyData,
    todayEarned: todayData[0]?.total || 0,
    todayAppointments: todayData[0]?.count || 0,
    weekEarned: weekData[0]?.total || 0,
    weekAppointments: weekData[0]?.count || 0
  };
}

// ── Utility ───────────────────────────────────────────────────
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  calculateSplit,
  recordTransaction,
  recordRefund,
  processPayout,
  getAdminDashboardData,
  getDoctorEarnings
};
