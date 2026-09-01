const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // ── GENERAL ──────────────────────────────────
  general: {
    siteName: { type: String, default: 'MediConnect Pro' },
    siteTagline: { type: String, default: 'Your Trusted Healthcare Platform' },
    siteDescription: { type: String, default: 'Connect with top doctors, book appointments, and access quality healthcare from anywhere.' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    contactEmail: { type: String, default: 'support@mediconnect.com' },
    contactPhone: { type: String, default: '+91 1800-123-4567' },
    contactAddress: { type: String, default: '123 Healthcare Avenue, New Delhi, India' },
    supportHours: { type: String, default: '24/7' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are currently undergoing maintenance. Please check back later.' }
  },

  // ── DOCTORS ──────────────────────────────────
  doctors: {
    requireApproval: { type: Boolean, default: true },
    autoApprove: { type: Boolean, default: false },
    maxFeaturedDoctors: { type: Number, default: 10 },
    defaultConsultationFee: { type: Number, default: 500 },
    minExperience: { type: Number, default: 0 },
    maxExperience: { type: Number, default: 50 },
    allowOnlineConsultation: { type: Boolean, default: true },
    doctorVerificationRequired: { type: Boolean, default: true },
    allowedSpecializations: { type: [String], default: [
      'General Physician', 'Cardiologist', 'Dermatologist', 'Endocrinologist',
      'Gastroenterologist', 'Neurologist', 'Oncologist', 'Orthopedic Surgeon',
      'Pediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist',
      'ENT Specialist', 'Ophthalmologist', 'Gynecologist', 'Dentist',
      'Ayurvedic', 'Homeopathic', 'Unani', 'Alternative Medicine'
    ]},
    allowedLanguages: { type: [String], default: ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Malayalam', 'Gujarati', 'Rajasthani', 'Punjabi'] }
  },

  // ── APPOINTMENTS ─────────────────────────────
  appointments: {
    maxAdvanceBookingDays: { type: Number, default: 30 },
    minAdvanceBookingHours: { type: Number, default: 2 },
    slotDurationMinutes: { type: Number, default: 60 },
    bufferBetweenSlots: { type: Number, default: 10 },
    maxDailyAppointmentsPerDoctor: { type: Number, default: 20 },
    cancellationWindowHours: { type: Number, default: 24 },
    fullRefundWindowHours: { type: Number, default: 24 },
    partialRefundWindowHours: { type: Number, default: 12 },
    partialRefundPercentage: { type: Number, default: 50 },
    allowPatientCancellation: { type: Boolean, default: true },
    allowDoctorCancellation: { type: Boolean, default: true },
    autoCancelUnpaidMinutes: { type: Number, default: 30 },
    requireSymptoms: { type: Boolean, default: true },
    allowRescheduling: { type: Boolean, default: true },
    maxReschedules: { type: Number, default: 2 }
  },

  // ── PAYMENTS ─────────────────────────────────
  payments: {
    enabled: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    taxEnabled: { type: Boolean, default: false },
    taxPercentage: { type: Number, default: 18 },
    taxName: { type: String, default: 'GST' },
    platformFeeEnabled: { type: Boolean, default: false },
    platformFeePercentage: { type: Number, default: 5 },
    platformFeeType: { type: String, default: 'percentage', enum: ['percentage', 'fixed'] },
    platformFeeFixed: { type: Number, default: 0 },
    minimumPayoutAmount: { type: Number, default: 1000 },
    payoutCycle: { type: String, default: 'weekly', enum: ['daily', 'weekly', 'biweekly', 'monthly'] },
    acceptedPaymentMethods: { type: [String], default: ['card', 'upi', 'netbanking', 'wallet'] },
    enableWallet: { type: Boolean, default: false },
    enableCouponCodes: { type: Boolean, default: false }
  },

  // ── NOTIFICATIONS ────────────────────────────
  notifications: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },

    appointmentConfirmation: { type: Boolean, default: true },
    appointmentReminder24h: { type: Boolean, default: true },
    appointmentReminder1h: { type: Boolean, default: true },
    appointmentCancellation: { type: Boolean, default: true },
    appointmentReschedule: { type: Boolean, default: true },
    paymentReceipt: { type: Boolean, default: true },
    refundProcessed: { type: Boolean, default: true },
    newDoctorRegistration: { type: Boolean, default: true },
    doctorApproved: { type: Boolean, default: true },
    doctorRejected: { type: Boolean, default: true },
    newReview: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true },

    reminderHoursBefore: { type: Number, default: 24 },
    reminderMinutesBefore: { type: Number, default: 60 }
  },

  // ── VIDEO / CONSULTATION ─────────────────────
  video: {
    enabled: { type: Boolean, default: true },
    provider: { type: String, default: 'daily', enum: ['daily', 'twilio', 'agora', 'zoom'] },
    maxCallDurationMinutes: { type: Number, default: 60 },
    allowScreenSharing: { type: Boolean, default: true },
    allowRecording: { type: Boolean, default: false },
    enableChatDuringCall: { type: Boolean, default: true },
    enableFileSharing: { type: Boolean, default: true },
    waitingRoomEnabled: { type: Boolean, default: true },
    autoStartRecording: { type: Boolean, default: false }
  },

  // ── AI / SYMPTOM CHECKER ─────────────────────
  ai: {
    enabled: { type: Boolean, default: true },
    autoBookingEnabled: { type: Boolean, default: true },
    showUrgencyLevels: { type: Boolean, default: true },
    maxRecommendations: { type: Number, default: 5 },
    autoBookSearchDays: { type: Number, default: 7 },
    confidenceThreshold: { type: Number, default: 30 }
  },

  // ── SECURITY ─────────────────────────────────
  security: {
    rateLimitWindowMinutes: { type: Number, default: 15 },
    rateLimitMaxRequests: { type: Number, default: 100 },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDurationMinutes: { type: Number, default: 30 },
    sessionTimeoutMinutes: { type: Number, default: 1440 },
    requireEmailVerification: { type: Boolean, default: false },
    requirePhoneVerification: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    allowedOrigins: { type: [String], default: ['http://localhost:3000'] },
    corsEnabled: { type: Boolean, default: true }
  },

  // ── APPEARANCE ───────────────────────────────
  appearance: {
    primaryColor: { type: String, default: '#4F46E5' },
    secondaryColor: { type: String, default: '#059669' },
    accentColor: { type: String, default: '#F59E0B' },
    darkMode: { type: Boolean, default: false },
    fontFamily: { type: String, default: 'Inter' },
    heroTitle: { type: String, default: 'Your Health, Our Priority' },
    heroSubtitle: { type: String, default: 'Connect with top-rated doctors, book appointments instantly, and access quality healthcare through video calls, chat, or in-person visits — all from one platform.' },
    heroBackgroundImage: { type: String, default: '' },
    showStats: { type: Boolean, default: true },
    showSpecialties: { type: Boolean, default: true },
    showFeatures: { type: Boolean, default: true },
    showAIBanner: { type: Boolean, default: true },
    footerText: { type: String, default: '© 2024 MediConnect Pro. All rights reserved.' },
    socialLinks: {
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      linkedin: { type: String, default: '' }
    }
  },

  // ── SEO / META ───────────────────────────────
  seo: {
    metaTitle: { type: String, default: 'MediConnect Pro - Online Doctor Appointments & Telemedicine' },
    metaDescription: { type: String, default: 'Connect with top doctors, book appointments, and access quality healthcare from anywhere.' },
    ogImage: { type: String, default: '' },
    googleAnalyticsId: { type: String, default: '' },
    robotsTxt: { type: String, default: 'User-agent: *\nAllow: /' },
    sitemapEnabled: { type: Boolean, default: true }
  },

  // ── EMAIL / SMTP ─────────────────────────────
  email: {
    provider: { type: String, default: 'smtp', enum: ['smtp', 'sendgrid', 'ses', 'mailgun'] },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpSecure: { type: Boolean, default: false },
    fromName: { type: String, default: 'MediConnect Pro' },
    fromEmail: { type: String, default: 'noreply@mediconnect.com' },
    replyTo: { type: String, default: 'support@mediconnect.com' }
  },

  // ── STORAGE / UPLOAD ─────────────────────────
  storage: {
    provider: { type: String, default: 'cloudinary', enum: ['cloudinary', 's3', 'local'] },
    maxFileSizeMB: { type: Number, default: 10 },
    allowedFileTypes: { type: [String], default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    autoCompressImages: { type: Boolean, default: true },
    imageQuality: { type: Number, default: 80 }
  },

  // ── INTEGRATIONS ─────────────────────────────
  integrations: {
    googleAuth: { type: Boolean, default: false },
    appleAuth: { type: Boolean, default: false },
    googleMaps: { type: Boolean, default: false },
    googleMapsApiKey: { type: String, default: '' },
    recaptchaEnabled: { type: Boolean, default: false },
    recaptchaKey: { type: String, default: '' },
    mailchimpEnabled: { type: Boolean, default: false },
    mailchimpApiKey: { type: String, default: '' },
    mailchimpListId: { type: String, default: '' }
  },

  // ── FOOTER / LEGAL ───────────────────────────
  legal: {
    privacyPolicyUrl: { type: String, default: '/privacy' },
    termsUrl: { type: String, default: '/terms' },
    refundPolicyUrl: { type: String, default: '/refund' },
    hipaaCompliance: { type: Boolean, default: true },
    gdprCompliance: { type: Boolean, default: true },
    cookieConsentEnabled: { type: Boolean, default: true },
    dataRetentionDays: { type: Number, default: 365 }
  }
}, {
  timestamps: true,
  strict: false // Allow partial updates
});

// Singleton — only one settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function(section, data) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
  }

  if (section) {
    settings[section] = { ...settings[section]?.toObject(), ...data };
  } else {
    Object.keys(data).forEach(key => {
      if (settings[key] && typeof settings[key] === 'object' && !Array.isArray(settings[key])) {
        settings[key] = { ...settings[key].toObject(), ...data[key] };
      } else {
        settings[key] = data[key];
      }
    });
  }

  await settings.save();
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
