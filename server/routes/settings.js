const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

// All settings routes require admin authentication
router.use(protect, authorize('admin'));

// ── GET all settings ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Mask sensitive fields
    const safe = settings.toObject();
    if (safe.email?.smtpPass) safe.email.smtpPass = '••••••••';
    if (safe.integrations?.googleMapsApiKey) safe.integrations.googleMapsApiKey = '••••••••';
    if (safe.integrations?.recaptchaKey) safe.integrations.recaptchaKey = '••••••••';
    if (safe.integrations?.mailchimpApiKey) safe.integrations.mailchimpApiKey = '••••••••';

    res.json({ success: true, settings: safe });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to load settings' });
  }
});

// ── GET a specific section ────────────────────
router.get('/:section', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const section = settings[req.params.section];

    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    res.json({ success: true, settings: section });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load settings' });
  }
});

// ── UPDATE a specific section ─────────────────
router.put('/:section', async (req, res) => {
  try {
    const validSections = [
      'general', 'doctors', 'appointments', 'payments', 'notifications',
      'video', 'ai', 'security', 'appearance', 'seo', 'email',
      'storage', 'integrations', 'legal'
    ];

    if (!validSections.includes(req.params.section)) {
      return res.status(400).json({ success: false, error: 'Invalid settings section' });
    }

    const settings = await Settings.updateSettings(req.params.section, req.body);

    // Mask sensitive fields
    const safe = settings.toObject();
    if (safe.email?.smtpPass && req.body.smtpPass !== '••••••••') {
      // Keep the real password if user didn't change it
    } else if (safe.email?.smtpPass) {
      safe.email.smtpPass = '••••••••';
    }

    res.json({ success: true, settings: safe, message: `${req.params.section} settings updated` });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// ── UPDATE multiple sections at once ──────────
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.updateSettings(null, req.body);
    res.json({ success: true, settings, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// ── RESET settings to defaults ────────────────
router.post('/reset/:section', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return res.status(404).json({ success: false, error: 'No settings found' });

    const defaults = new Settings();
    if (req.params.section === 'all') {
      await Settings.deleteMany({});
      const fresh = await Settings.getSettings();
      return res.json({ success: true, settings: fresh, message: 'All settings reset to defaults' });
    }

    if (defaults[req.params.section]) {
      settings[req.params.section] = defaults[req.params.section];
      await settings.save();
      return res.json({ success: true, settings, message: `${req.params.section} reset to defaults` });
    }

    res.status(404).json({ success: false, error: 'Section not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Reset failed' });
  }
});

// ── EXPORT all settings as JSON ───────────────
router.get('/export/all', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    // Remove sensitive data
    const exported = settings.toObject();
    delete exported._id;
    delete exported.__v;
    delete exported.createdAt;
    delete exported.updatedAt;
    if (exported.email?.smtpPass) exported.email.smtpPass = '';
    if (exported.integrations?.googleMapsApiKey) exported.integrations.googleMapsApiKey = '';
    if (exported.integrations?.recaptchaKey) exported.integrations.recaptchaKey = '';
    if (exported.integrations?.mailchimpApiKey) exported.integrations.mailchimpApiKey = '';

    res.setHeader('Content-Disposition', 'attachment; filename=mediconnect-settings.json');
    res.json({ success: true, settings: exported });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// ── IMPORT settings from JSON ─────────────────
router.post('/import/all', async (req, res) => {
  try {
    const { settings: imported } = req.body;
    if (!imported) {
      return res.status(400).json({ success: false, error: 'No settings data provided' });
    }

    await Settings.deleteMany({});
    const settings = new Settings(imported);
    await settings.save();

    res.json({ success: true, settings, message: 'Settings imported successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Import failed' });
  }
});

// ── PUBLIC settings (no auth required) ────────
const publicRouter = express.Router();
publicRouter.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      settings: {
        general: {
          siteName: settings.general.siteName,
          siteTagline: settings.general.siteTagline,
          siteDescription: settings.general.siteDescription,
          logo: settings.general.logo,
          contactEmail: settings.general.contactEmail,
          contactPhone: settings.general.contactPhone,
          contactAddress: settings.general.contactAddress,
          supportHours: settings.general.supportHours,
          maintenanceMode: settings.general.maintenanceMode,
          maintenanceMessage: settings.general.maintenanceMessage
        },
        appearance: settings.appearance,
        seo: settings.seo,
        legal: settings.legal,
        payments: {
          currency: settings.payments.currency,
          currencySymbol: settings.payments.currencySymbol,
          taxEnabled: settings.payments.taxEnabled,
          taxPercentage: settings.payments.taxPercentage,
          taxName: settings.payments.taxName
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = { adminRouter: router, publicRouter };
