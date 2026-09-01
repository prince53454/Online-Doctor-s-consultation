import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';
import './Settings.css';

const TABS = [
  { id: 'general', icon: '⚙️', label: 'General' },
  { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors' },
  { id: 'appointments', icon: '📅', label: 'Appointments' },
  { id: 'payments', icon: '💳', label: 'Payments' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'video', icon: '📹', label: 'Video Calls' },
  { id: 'ai', icon: '🤖', label: 'AI Settings' },
  { id: 'security', icon: '🔒', label: 'Security' },
  { id: 'appearance', icon: '🎨', label: 'Appearance' },
  { id: 'seo', icon: '🔍', label: 'SEO & Meta' },
  { id: 'email', icon: '📧', label: 'Email / SMTP' },
  { id: 'storage', icon: '☁️', label: 'Storage' },
  { id: 'integrations', icon: '🔗', label: 'Integrations' },
  { id: 'legal', icon: '📜', label: 'Legal' },
];

function getDefaultSettings() {
  return {
    general: { siteName: 'MediConnect', siteTagline: 'Your Health, Our Priority', siteDescription: 'Healthcare platform', contactEmail: 'support@mediconnect.com', contactPhone: '+91 1800-123-4567', contactAddress: 'New Delhi, India', supportHours: '24/7', timezone: 'Asia/Kolkata', language: 'en', maintenanceMode: false, maintenanceMessage: 'Under maintenance' },
    doctors: { requireApproval: true, autoApprove: false, allowOnlineConsultation: true, doctorVerificationRequired: true, maxFeaturedDoctors: 10, defaultConsultationFee: 500, minExperience: 1, maxExperience: 50, allowedSpecializations: ['Cardiology', 'Dermatology', 'Pediatrics', 'Neurology'], allowedLanguages: ['English', 'Hindi'] },
    appointments: { maxAdvanceBookingDays: 30, minAdvanceBookingHours: 2, slotDurationMinutes: 30, bufferBetweenSlots: 10, maxDailyAppointmentsPerDoctor: 20, fullRefundWindowHours: 24, partialRefundWindowHours: 4, partialRefundPercentage: 50, maxReschedules: 2, autoCancelUnpaidMinutes: 15, allowPatientCancellation: true, allowDoctorCancellation: true, requireSymptoms: true, allowRescheduling: true },
    payments: { enabled: true, currency: 'INR', currencySymbol: '₹', taxEnabled: false, taxName: 'GST', taxPercentage: 18, platformFeeEnabled: true, platformFeeType: 'percentage', platformFeePercentage: 10, platformFeeFixed: 0, minimumPayoutAmount: 1000, payoutCycle: 'weekly', enableWallet: true, enableCouponCodes: false, acceptedPaymentMethods: ['card', 'upi', 'netbanking', 'wallet'] },
    notifications: { emailEnabled: true, smsEnabled: false, pushEnabled: true, whatsappEnabled: false, appointmentConfirmation: true, appointmentReminder24h: true, appointmentReminder1h: true, appointmentCancellation: true, appointmentReschedule: true, paymentReceipt: true, refundProcessed: true, newDoctorRegistration: true, doctorApproved: true, newReview: true, weeklyReport: true },
    video: { enabled: true, provider: 'daily', maxCallDurationMinutes: 30, allowScreenSharing: true, allowRecording: false, enableChatDuringCall: true, enableFileSharing: true, waitingRoomEnabled: true },
    ai: { enabled: true, autoBookingEnabled: false, showUrgencyLevels: true, maxRecommendations: 5, autoBookSearchDays: 7, confidenceThreshold: 70 },
    security: { rateLimitWindowMinutes: 15, rateLimitMaxRequests: 100, maxLoginAttempts: 5, lockoutDurationMinutes: 30, sessionTimeoutMinutes: 60, requireEmailVerification: true, requirePhoneVerification: false, twoFactorEnabled: false, corsEnabled: true, allowedOrigins: ['http://localhost:3000'] },
    appearance: { primaryColor: '#4F46E5', secondaryColor: '#7C3AED', accentColor: '#10B981', fontFamily: 'Inter', heroTitle: 'Your Health, Our Priority', heroSubtitle: 'Connect with top doctors', heroBackgroundImage: '', footerText: '© 2026 MediConnect', showStats: true, showSpecialties: true, showFeatures: true, showAIBanner: true, darkMode: false, socialLinks: {} },
    seo: { metaTitle: 'MediConnect - Healthcare Platform', metaDescription: 'Book doctor appointments', ogImage: '', googleAnalyticsId: '', robotsTxt: 'User-agent: *\nAllow: /', sitemapEnabled: true },
    email: { provider: 'smtp', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: true, fromName: 'MediConnect', fromEmail: 'noreply@mediconnect.com', replyTo: 'support@mediconnect.com' },
    storage: { provider: 'cloudinary', maxFileSizeMB: 10, autoCompressImages: true, imageQuality: 80, allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
    integrations: { googleAuth: false, appleAuth: false, googleMaps: false, googleMapsApiKey: '', recaptchaEnabled: false, recaptchaKey: '', mailchimpEnabled: false, mailchimpApiKey: '', mailchimpListId: '' },
    legal: { privacyPolicyUrl: '', termsUrl: '', refundPolicyUrl: '', hipaaCompliance: true, gdprCompliance: false, cookieConsentEnabled: true, dataRetentionDays: 365 }
  };
}

export default function AdminSettings() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    api.get('/admin/settings')
      .then(res => setSettings(res.data.settings))
      .catch(() => {
        // Fallback to defaults if API fails
        setSettings(getDefaultSettings());
        toast.error('Using default settings (API unavailable)');
      })
      .finally(() => setLoading(false));
  }, [authLoading]);

  const updateSection = (section, data) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/settings/${activeTab}`, settings[activeTab]);
      toast.success(`${activeTab} settings saved!`);
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (section) => {
    if (!window.confirm(`Reset ${section} to defaults?`)) return;
    try {
      await api.post(`/admin/settings/reset/${section}`);
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
      toast.success(`${section} reset to defaults`);
    } catch (error) {
      toast.error('Reset failed');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/settings/export/all');
      const blob = new Blob([JSON.stringify(res.data.settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'mediconnect-settings.json'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Settings exported!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api.post('/admin/settings/import/all', { settings: data });
        const res = await api.get('/admin/settings');
        setSettings(res.data.settings);
        toast.success('Settings imported!');
      } catch (error) {
        toast.error('Import failed — invalid JSON');
      }
    };
    input.click();
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!settings) return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}><h2>Loading settings...</h2></div>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span style={{ fontSize: '24px' }}>🩺</span><h2>MediConnect</h2></div>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-item">📊 Dashboard</Link>
          <Link to="/admin/doctors" className="admin-nav-item">👨‍⚕️ Doctors</Link>
          <Link to="/admin/appointments" className="admin-nav-item">📅 Appointments</Link>
          <Link to="/admin/users" className="admin-nav-item">👥 Users</Link>
          <Link to="/admin/revenue" className="admin-nav-item">💰 Revenue</Link>
          <Link to="/admin/settings" className="admin-nav-item active">⚙️ Settings</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user"><img src={user?.avatar} alt="" /><span>{user?.name}</span></div>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="settings-header">
          <div>
            <h1>⚙️ Settings</h1>
            <p className="text-muted">Manage all website configuration from one place</p>
          </div>
          <div className="settings-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleExport}>📥 Export</button>
            <button className="btn btn-ghost btn-sm" onClick={handleImport}>📤 Import</button>
            {hasChanges && (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            )}
          </div>
        </div>

        <div className="settings-layout">
          {/* Tabs Sidebar */}
          <div className="settings-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {/* ── GENERAL ──────────────────────── */}
            {activeTab === 'general' && (
              <SettingsSection title="General Settings" icon="⚙️" onReset={() => handleReset('general')}>
                <div className="settings-grid-2">
                  <Field label="Site Name" value={settings.general.siteName}
                    onChange={v => updateSection('general', { siteName: v })} />
                  <Field label="Site Tagline" value={settings.general.siteTagline}
                    onChange={v => updateSection('general', { siteTagline: v })} />
                </div>
                <Field label="Site Description" value={settings.general.siteDescription} type="textarea"
                  onChange={v => updateSection('general', { siteDescription: v })} />
                <div className="settings-grid-2">
                  <Field label="Contact Email" value={settings.general.contactEmail} type="email"
                    onChange={v => updateSection('general', { contactEmail: v })} />
                  <Field label="Contact Phone" value={settings.general.contactPhone}
                    onChange={v => updateSection('general', { contactPhone: v })} />
                </div>
                <Field label="Contact Address" value={settings.general.contactAddress}
                  onChange={v => updateSection('general', { contactAddress: v })} />
                <div className="settings-grid-2">
                  <Field label="Support Hours" value={settings.general.supportHours}
                    onChange={v => updateSection('general', { supportHours: v })} />
                  <Field label="Timezone" value={settings.general.timezone}
                    onChange={v => updateSection('general', { timezone: v })} type="select"
                    options={['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo']} />
                </div>
                <Field label="Language" value={settings.general.language} type="select"
                  options={['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'ml', 'gu']}
                  onChange={v => updateSection('general', { language: v })} />
                <Toggle label="Maintenance Mode" checked={settings.general.maintenanceMode}
                  onChange={v => updateSection('general', { maintenanceMode: v })} />
                {settings.general.maintenanceMode && (
                  <Field label="Maintenance Message" value={settings.general.maintenanceMessage}
                    type="textarea" onChange={v => updateSection('general', { maintenanceMessage: v })} />
                )}
              </SettingsSection>
            )}

            {/* ── DOCTORS ──────────────────────── */}
            {activeTab === 'doctors' && (
              <SettingsSection title="Doctor Settings" icon="👨‍⚕️" onReset={() => handleReset('doctors')}>
                <Toggle label="Require Admin Approval" checked={settings.doctors.requireApproval}
                  onChange={v => updateSection('doctors', { requireApproval: v })} description="New doctors must be approved before appearing in search" />
                <Toggle label="Auto-Approve Doctors" checked={settings.doctors.autoApprove}
                  onChange={v => updateSection('doctors', { autoApprove: v })} description="Automatically approve new doctor registrations" />
                <Toggle label="Allow Online Consultation" checked={settings.doctors.allowOnlineConsultation}
                  onChange={v => updateSection('doctors', { allowOnlineConsultation: v })} />
                <Toggle label="Doctor Verification Required" checked={settings.doctors.doctorVerificationRequired}
                  onChange={v => updateSection('doctors', { doctorVerificationRequired: v })} />
                <div className="settings-grid-2">
                  <Field label="Max Featured Doctors" value={settings.doctors.maxFeaturedDoctors} type="number"
                    onChange={v => updateSection('doctors', { maxFeaturedDoctors: Number(v) })} />
                  <Field label="Default Consultation Fee (₹)" value={settings.doctors.defaultConsultationFee} type="number"
                    onChange={v => updateSection('doctors', { defaultConsultationFee: Number(v) })} />
                </div>
                <div className="settings-grid-2">
                  <Field label="Min Experience (years)" value={settings.doctors.minExperience} type="number"
                    onChange={v => updateSection('doctors', { minExperience: Number(v) })} />
                  <Field label="Max Experience (years)" value={settings.doctors.maxExperience} type="number"
                    onChange={v => updateSection('doctors', { maxExperience: Number(v) })} />
                </div>
                <TagInput label="Allowed Specializations" tags={settings.doctors.allowedSpecializations}
                  onChange={v => updateSection('doctors', { allowedSpecializations: v })} />
                <TagInput label="Allowed Languages" tags={settings.doctors.allowedLanguages}
                  onChange={v => updateSection('doctors', { allowedLanguages: v })} />
              </SettingsSection>
            )}

            {/* ── APPOINTMENTS ─────────────────── */}
            {activeTab === 'appointments' && (
              <SettingsSection title="Appointment Settings" icon="📅" onReset={() => handleReset('appointments')}>
                <div className="settings-grid-2">
                  <Field label="Max Advance Booking (days)" value={settings.appointments.maxAdvanceBookingDays} type="number"
                    onChange={v => updateSection('appointments', { maxAdvanceBookingDays: Number(v) })} />
                  <Field label="Min Advance Booking (hours)" value={settings.appointments.minAdvanceBookingHours} type="number"
                    onChange={v => updateSection('appointments', { minAdvanceBookingHours: Number(v) })} />
                </div>
                <div className="settings-grid-2">
                  <Field label="Slot Duration (minutes)" value={settings.appointments.slotDurationMinutes} type="number"
                    onChange={v => updateSection('appointments', { slotDurationMinutes: Number(v) })} />
                  <Field label="Buffer Between Slots (min)" value={settings.appointments.bufferBetweenSlots} type="number"
                    onChange={v => updateSection('appointments', { bufferBetweenSlots: Number(v) })} />
                </div>
                <Field label="Max Daily Appointments per Doctor" value={settings.appointments.maxDailyAppointmentsPerDoctor} type="number"
                  onChange={v => updateSection('appointments', { maxDailyAppointmentsPerDoctor: Number(v) })} />
                <div className="settings-grid-2">
                  <Field label="Full Refund Window (hours)" value={settings.appointments.fullRefundWindowHours} type="number"
                    onChange={v => updateSection('appointments', { fullRefundWindowHours: Number(v) })} />
                  <Field label="Partial Refund Window (hours)" value={settings.appointments.partialRefundWindowHours} type="number"
                    onChange={v => updateSection('appointments', { partialRefundWindowHours: Number(v) })} />
                </div>
                <div className="settings-grid-2">
                  <Field label="Partial Refund %" value={settings.appointments.partialRefundPercentage} type="number"
                    onChange={v => updateSection('appointments', { partialRefundPercentage: Number(v) })} />
                  <Field label="Max Reschedules" value={settings.appointments.maxReschedules} type="number"
                    onChange={v => updateSection('appointments', { maxReschedules: Number(v) })} />
                </div>
                <Field label="Auto-Cancel Unpaid After (minutes)" value={settings.appointments.autoCancelUnpaidMinutes} type="number"
                  onChange={v => updateSection('appointments', { autoCancelUnpaidMinutes: Number(v) })} />
                <Toggle label="Allow Patient Cancellation" checked={settings.appointments.allowPatientCancellation}
                  onChange={v => updateSection('appointments', { allowPatientCancellation: v })} />
                <Toggle label="Allow Doctor Cancellation" checked={settings.appointments.allowDoctorCancellation}
                  onChange={v => updateSection('appointments', { allowDoctorCancellation: v })} />
                <Toggle label="Require Symptoms" checked={settings.appointments.requireSymptoms}
                  onChange={v => updateSection('appointments', { requireSymptoms: v })} />
                <Toggle label="Allow Rescheduling" checked={settings.appointments.allowRescheduling}
                  onChange={v => updateSection('appointments', { allowRescheduling: v })} />
              </SettingsSection>
            )}

            {/* ── PAYMENTS ─────────────────────── */}
            {activeTab === 'payments' && (
              <SettingsSection title="Payment Settings" icon="💳" onReset={() => handleReset('payments')}>
                <Toggle label="Enable Payments" checked={settings.payments.enabled}
                  onChange={v => updateSection('payments', { enabled: v })} />
                <div className="settings-grid-2">
                  <Field label="Currency" value={settings.payments.currency}
                    onChange={v => updateSection('payments', { currency: v })} type="select"
                    options={['INR', 'USD', 'EUR', 'GBP', 'AED']} />
                  <Field label="Currency Symbol" value={settings.payments.currencySymbol}
                    onChange={v => updateSection('payments', { currencySymbol: v })} />
                </div>
                <Toggle label="Enable Tax" checked={settings.payments.taxEnabled}
                  onChange={v => updateSection('payments', { taxEnabled: v })} />
                {settings.payments.taxEnabled && (
                  <div className="settings-grid-2">
                    <Field label="Tax Name" value={settings.payments.taxName}
                      onChange={v => updateSection('payments', { taxName: v })} />
                    <Field label="Tax Percentage" value={settings.payments.taxPercentage} type="number"
                      onChange={v => updateSection('payments', { taxPercentage: Number(v) })} />
                  </div>
                )}
                <Toggle label="Enable Platform Fee" checked={settings.payments.platformFeeEnabled}
                  onChange={v => updateSection('payments', { platformFeeEnabled: v })} />
                {settings.payments.platformFeeEnabled && (
                  <div className="settings-grid-2">
                    <Field label="Fee Type" value={settings.payments.platformFeeType} type="select"
                      options={['percentage', 'fixed']} onChange={v => updateSection('payments', { platformFeeType: v })} />
                    <Field label={settings.payments.platformFeeType === 'percentage' ? 'Fee %' : 'Fee Amount (₹)'}
                      value={settings.payments.platformFeeType === 'percentage' ? settings.payments.platformFeePercentage : settings.payments.platformFeeFixed}
                      type="number"
                      onChange={v => updateSection('payments', settings.payments.platformFeeType === 'percentage'
                        ? { platformFeePercentage: Number(v) } : { platformFeeFixed: Number(v) })} />
                  </div>
                )}
                <div className="settings-grid-2">
                  <Field label="Minimum Payout (₹)" value={settings.payments.minimumPayoutAmount} type="number"
                    onChange={v => updateSection('payments', { minimumPayoutAmount: Number(v) })} />
                  <Field label="Payout Cycle" value={settings.payments.payoutCycle} type="select"
                    options={['daily', 'weekly', 'biweekly', 'monthly']}
                    onChange={v => updateSection('payments', { payoutCycle: v })} />
                </div>
                <Toggle label="Enable Wallet" checked={settings.payments.enableWallet}
                  onChange={v => updateSection('payments', { enableWallet: v })} />
                <Toggle label="Enable Coupon Codes" checked={settings.payments.enableCouponCodes}
                  onChange={v => updateSection('payments', { enableCouponCodes: v })} />
                <CheckboxGroup label="Accepted Payment Methods" options={['card', 'upi', 'netbanking', 'wallet', 'emi']}
                  selected={settings.payments.acceptedPaymentMethods}
                  onChange={v => updateSection('payments', { acceptedPaymentMethods: v })} />
              </SettingsSection>
            )}

            {/* ── NOTIFICATIONS ────────────────── */}
            {activeTab === 'notifications' && (
              <SettingsSection title="Notification Settings" icon="🔔" onReset={() => handleReset('notifications')}>
                <h4 className="settings-subtitle">Channels</h4>
                <div className="settings-grid-2">
                  <Toggle label="📧 Email Notifications" checked={settings.notifications.emailEnabled}
                    onChange={v => updateSection('notifications', { emailEnabled: v })} />
                  <Toggle label="📱 SMS Notifications" checked={settings.notifications.smsEnabled}
                    onChange={v => updateSection('notifications', { smsEnabled: v })} />
                </div>
                <div className="settings-grid-2">
                  <Toggle label="🔔 Push Notifications" checked={settings.notifications.pushEnabled}
                    onChange={v => updateSection('notifications', { pushEnabled: v })} />
                  <Toggle label="💬 WhatsApp" checked={settings.notifications.whatsappEnabled}
                    onChange={v => updateSection('notifications', { whatsappEnabled: v })} />
                </div>

                <h4 className="settings-subtitle">Email Triggers</h4>
                <Toggle label="Appointment Confirmation" checked={settings.notifications.appointmentConfirmation}
                  onChange={v => updateSection('notifications', { appointmentConfirmation: v })} />
                <Toggle label="24-Hour Reminder" checked={settings.notifications.appointmentReminder24h}
                  onChange={v => updateSection('notifications', { appointmentReminder24h: v })} />
                <Toggle label="1-Hour Reminder" checked={settings.notifications.appointmentReminder1h}
                  onChange={v => updateSection('notifications', { appointmentReminder1h: v })} />
                <Toggle label="Appointment Cancellation" checked={settings.notifications.appointmentCancellation}
                  onChange={v => updateSection('notifications', { appointmentCancellation: v })} />
                <Toggle label="Reschedule Notification" checked={settings.notifications.appointmentReschedule}
                  onChange={v => updateSection('notifications', { appointmentReschedule: v })} />
                <Toggle label="Payment Receipt" checked={settings.notifications.paymentReceipt}
                  onChange={v => updateSection('notifications', { paymentReceipt: v })} />
                <Toggle label="Refund Processed" checked={settings.notifications.refundProcessed}
                  onChange={v => updateSection('notifications', { refundProcessed: v })} />
                <Toggle label="New Doctor Registration" checked={settings.notifications.newDoctorRegistration}
                  onChange={v => updateSection('notifications', { newDoctorRegistration: v })} />
                <Toggle label="Doctor Approved/Rejected" checked={settings.notifications.doctorApproved}
                  onChange={v => updateSection('notifications', { doctorApproved: v })} />
                <Toggle label="New Review Posted" checked={settings.notifications.newReview}
                  onChange={v => updateSection('notifications', { newReview: v })} />
                <Toggle label="Weekly Analytics Report" checked={settings.notifications.weeklyReport}
                  onChange={v => updateSection('notifications', { weeklyReport: v })} />
              </SettingsSection>
            )}

            {/* ── VIDEO ────────────────────────── */}
            {activeTab === 'video' && (
              <SettingsSection title="Video Call Settings" icon="📹" onReset={() => handleReset('video')}>
                <Toggle label="Enable Video Consultation" checked={settings.video.enabled}
                  onChange={v => updateSection('video', { enabled: v })} />
                <Field label="Provider" value={settings.video.provider} type="select"
                  options={['daily', 'twilio', 'agora', 'zoom']}
                  onChange={v => updateSection('video', { provider: v })} />
                <Field label="Max Call Duration (minutes)" value={settings.video.maxCallDurationMinutes} type="number"
                  onChange={v => updateSection('video', { maxCallDurationMinutes: Number(v) })} />
                <Toggle label="Allow Screen Sharing" checked={settings.video.allowScreenSharing}
                  onChange={v => updateSection('video', { allowScreenSharing: v })} />
                <Toggle label="Allow Recording" checked={settings.video.allowRecording}
                  onChange={v => updateSection('video', { allowRecording: v })} />
                <Toggle label="Chat During Call" checked={settings.video.enableChatDuringCall}
                  onChange={v => updateSection('video', { enableChatDuringCall: v })} />
                <Toggle label="File Sharing" checked={settings.video.enableFileSharing}
                  onChange={v => updateSection('video', { enableFileSharing: v })} />
                <Toggle label="Waiting Room" checked={settings.video.waitingRoomEnabled}
                  onChange={v => updateSection('video', { waitingRoomEnabled: v })} />
              </SettingsSection>
            )}

            {/* ── AI ────────────────────────────── */}
            {activeTab === 'ai' && (
              <SettingsSection title="AI / Symptom Checker Settings" icon="🤖" onReset={() => handleReset('ai')}>
                <Toggle label="Enable AI Symptom Checker" checked={settings.ai.enabled}
                  onChange={v => updateSection('ai', { enabled: v })} />
                <Toggle label="Enable Auto-Booking" checked={settings.ai.autoBookingEnabled}
                  onChange={v => updateSection('ai', { autoBookingEnabled: v })} />
                <Toggle label="Show Urgency Levels" checked={settings.ai.showUrgencyLevels}
                  onChange={v => updateSection('ai', { showUrgencyLevels: v })} />
                <div className="settings-grid-2">
                  <Field label="Max Recommendations" value={settings.ai.maxRecommendations} type="number"
                    onChange={v => updateSection('ai', { maxRecommendations: Number(v) })} />
                  <Field label="Auto-Book Search Window (days)" value={settings.ai.autoBookSearchDays} type="number"
                    onChange={v => updateSection('ai', { autoBookSearchDays: Number(v) })} />
                </div>
                <Field label="Confidence Threshold (%)" value={settings.ai.confidenceThreshold} type="number"
                  onChange={v => updateSection('ai', { confidenceThreshold: Number(v) })} />
              </SettingsSection>
            )}

            {/* ── SECURITY ─────────────────────── */}
            {activeTab === 'security' && (
              <SettingsSection title="Security Settings" icon="🔒" onReset={() => handleReset('security')}>
                <div className="settings-grid-2">
                  <Field label="Rate Limit Window (minutes)" value={settings.security.rateLimitWindowMinutes} type="number"
                    onChange={v => updateSection('security', { rateLimitWindowMinutes: Number(v) })} />
                  <Field label="Max Requests per Window" value={settings.security.rateLimitMaxRequests} type="number"
                    onChange={v => updateSection('security', { rateLimitMaxRequests: Number(v) })} />
                </div>
                <div className="settings-grid-2">
                  <Field label="Max Login Attempts" value={settings.security.maxLoginAttempts} type="number"
                    onChange={v => updateSection('security', { maxLoginAttempts: Number(v) })} />
                  <Field label="Lockout Duration (minutes)" value={settings.security.lockoutDurationMinutes} type="number"
                    onChange={v => updateSection('security', { lockoutDurationMinutes: Number(v) })} />
                </div>
                <Field label="Session Timeout (minutes)" value={settings.security.sessionTimeoutMinutes} type="number"
                  onChange={v => updateSection('security', { sessionTimeoutMinutes: Number(v) })} />
                <Toggle label="Require Email Verification" checked={settings.security.requireEmailVerification}
                  onChange={v => updateSection('security', { requireEmailVerification: v })} />
                <Toggle label="Require Phone Verification" checked={settings.security.requirePhoneVerification}
                  onChange={v => updateSection('security', { requirePhoneVerification: v })} />
                <Toggle label="Two-Factor Authentication" checked={settings.security.twoFactorEnabled}
                  onChange={v => updateSection('security', { twoFactorEnabled: v })} />
                <Toggle label="CORS Enabled" checked={settings.security.corsEnabled}
                  onChange={v => updateSection('security', { corsEnabled: v })} />
                <TagInput label="Allowed Origins" tags={settings.security.allowedOrigins}
                  onChange={v => updateSection('security', { allowedOrigins: v })} />
              </SettingsSection>
            )}

            {/* ── APPEARANCE ───────────────────── */}
            {activeTab === 'appearance' && (
              <SettingsSection title="Appearance & Branding" icon="🎨" onReset={() => handleReset('appearance')}>
                <div className="settings-grid-3">
                  <ColorPicker label="Primary Color" value={settings.appearance.primaryColor}
                    onChange={v => updateSection('appearance', { primaryColor: v })} />
                  <ColorPicker label="Secondary Color" value={settings.appearance.secondaryColor}
                    onChange={v => updateSection('appearance', { secondaryColor: v })} />
                  <ColorPicker label="Accent Color" value={settings.appearance.accentColor}
                    onChange={v => updateSection('appearance', { accentColor: v })} />
                </div>
                <Field label="Font Family" value={settings.appearance.fontFamily} type="select"
                  options={['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Nunito']}
                  onChange={v => updateSection('appearance', { fontFamily: v })} />
                <Field label="Hero Title" value={settings.appearance.heroTitle}
                  onChange={v => updateSection('appearance', { heroTitle: v })} />
                <Field label="Hero Subtitle" value={settings.appearance.heroSubtitle} type="textarea"
                  onChange={v => updateSection('appearance', { heroSubtitle: v })} />
                <Field label="Hero Background Image URL" value={settings.appearance.heroBackgroundImage}
                  onChange={v => updateSection('appearance', { heroBackgroundImage: v })} />
                <Field label="Footer Text" value={settings.appearance.footerText}
                  onChange={v => updateSection('appearance', { footerText: v })} />
                <Toggle label="Show Stats Section" checked={settings.appearance.showStats}
                  onChange={v => updateSection('appearance', { showStats: v })} />
                <Toggle label="Show Specialties Section" checked={settings.appearance.showSpecialties}
                  onChange={v => updateSection('appearance', { showSpecialties: v })} />
                <Toggle label="Show Features Section" checked={settings.appearance.showFeatures}
                  onChange={v => updateSection('appearance', { showFeatures: v })} />
                <Toggle label="Show AI Banner" checked={settings.appearance.showAIBanner}
                  onChange={v => updateSection('appearance', { showAIBanner: v })} />
                <Toggle label="Dark Mode" checked={settings.appearance.darkMode}
                  onChange={v => updateSection('appearance', { darkMode: v })} />

                <h4 className="settings-subtitle">Social Links</h4>
                <div className="settings-grid-2">
                  <Field label="Twitter" value={settings.appearance.socialLinks?.twitter || ''}
                    onChange={v => updateSection('appearance', { socialLinks: { ...settings.appearance.socialLinks, twitter: v } })} />
                  <Field label="Facebook" value={settings.appearance.socialLinks?.facebook || ''}
                    onChange={v => updateSection('appearance', { socialLinks: { ...settings.appearance.socialLinks, facebook: v } })} />
                  <Field label="Instagram" value={settings.appearance.socialLinks?.instagram || ''}
                    onChange={v => updateSection('appearance', { socialLinks: { ...settings.appearance.socialLinks, instagram: v } })} />
                  <Field label="YouTube" value={settings.appearance.socialLinks?.youtube || ''}
                    onChange={v => updateSection('appearance', { socialLinks: { ...settings.appearance.socialLinks, youtube: v } })} />
                  <Field label="LinkedIn" value={settings.appearance.socialLinks?.linkedin || ''}
                    onChange={v => updateSection('appearance', { socialLinks: { ...settings.appearance.socialLinks, linkedin: v } })} />
                </div>
              </SettingsSection>
            )}

            {/* ── SEO ──────────────────────────── */}
            {activeTab === 'seo' && (
              <SettingsSection title="SEO & Meta Settings" icon="🔍" onReset={() => handleReset('seo')}>
                <Field label="Meta Title" value={settings.seo.metaTitle}
                  onChange={v => updateSection('seo', { metaTitle: v })} />
                <Field label="Meta Description" value={settings.seo.metaDescription} type="textarea"
                  onChange={v => updateSection('seo', { metaDescription: v })} />
                <Field label="OG Image URL" value={settings.seo.ogImage}
                  onChange={v => updateSection('seo', { ogImage: v })} />
                <Field label="Google Analytics ID" value={settings.seo.googleAnalyticsId}
                  onChange={v => updateSection('seo', { googleAnalyticsId: v })} />
                <Field label="Robots.txt" value={settings.seo.robotsTxt} type="textarea"
                  onChange={v => updateSection('seo', { robotsTxt: v })} />
                <Toggle label="Enable Sitemap" checked={settings.seo.sitemapEnabled}
                  onChange={v => updateSection('seo', { sitemapEnabled: v })} />
              </SettingsSection>
            )}

            {/* ── EMAIL ────────────────────────── */}
            {activeTab === 'email' && (
              <SettingsSection title="Email / SMTP Settings" icon="📧" onReset={() => handleReset('email')}>
                <Field label="Provider" value={settings.email.provider} type="select"
                  options={['smtp', 'sendgrid', 'ses', 'mailgun']}
                  onChange={v => updateSection('email', { provider: v })} />
                <div className="settings-grid-2">
                  <Field label="SMTP Host" value={settings.email.smtpHost}
                    onChange={v => updateSection('email', { smtpHost: v })} />
                  <Field label="SMTP Port" value={settings.email.smtpPort} type="number"
                    onChange={v => updateSection('email', { smtpPort: Number(v) })} />
                </div>
                <div className="settings-grid-2">
                  <Field label="SMTP Username" value={settings.email.smtpUser}
                    onChange={v => updateSection('email', { smtpUser: v })} />
                  <Field label="SMTP Password" value={settings.email.smtpPass} type="password"
                    onChange={v => updateSection('email', { smtpPass: v })} />
                </div>
                <Toggle label="Use TLS/SSL" checked={settings.email.smtpSecure}
                  onChange={v => updateSection('email', { smtpSecure: v })} />
                <div className="settings-grid-3">
                  <Field label="From Name" value={settings.email.fromName}
                    onChange={v => updateSection('email', { fromName: v })} />
                  <Field label="From Email" value={settings.email.fromEmail}
                    onChange={v => updateSection('email', { fromEmail: v })} />
                  <Field label="Reply-To" value={settings.email.replyTo}
                    onChange={v => updateSection('email', { replyTo: v })} />
                </div>
              </SettingsSection>
            )}

            {/* ── STORAGE ──────────────────────── */}
            {activeTab === 'storage' && (
              <SettingsSection title="File Storage Settings" icon="☁️" onReset={() => handleReset('storage')}>
                <Field label="Provider" value={settings.storage.provider} type="select"
                  options={['cloudinary', 's3', 'local']}
                  onChange={v => updateSection('storage', { provider: v })} />
                <Field label="Max File Size (MB)" value={settings.storage.maxFileSizeMB} type="number"
                  onChange={v => updateSection('storage', { maxFileSizeMB: Number(v) })} />
                <Toggle label="Auto-Compress Images" checked={settings.storage.autoCompressImages}
                  onChange={v => updateSection('storage', { autoCompressImages: v })} />
                {settings.storage.autoCompressImages && (
                  <Field label="Image Quality (%)" value={settings.storage.imageQuality} type="number"
                    onChange={v => updateSection('storage', { imageQuality: Number(v) })} />
                )}
                <TagInput label="Allowed File Types" tags={settings.storage.allowedFileTypes}
                  onChange={v => updateSection('storage', { allowedFileTypes: v })} />
              </SettingsSection>
            )}

            {/* ── INTEGRATIONS ─────────────────── */}
            {activeTab === 'integrations' && (
              <SettingsSection title="Third-Party Integrations" icon="🔗" onReset={() => handleReset('integrations')}>
                <h4 className="settings-subtitle">Authentication</h4>
                <div className="settings-grid-2">
                  <Toggle label="Google OAuth" checked={settings.integrations.googleAuth}
                    onChange={v => updateSection('integrations', { googleAuth: v })} />
                  <Toggle label="Apple Sign-In" checked={settings.integrations.appleAuth}
                    onChange={v => updateSection('integrations', { appleAuth: v })} />
                </div>

                <h4 className="settings-subtitle">Maps</h4>
                <Toggle label="Google Maps" checked={settings.integrations.googleMaps}
                  onChange={v => updateSection('integrations', { googleMaps: v })} />
                {settings.integrations.googleMaps && (
                  <Field label="Google Maps API Key" value={settings.integrations.googleMapsApiKey} type="password"
                    onChange={v => updateSection('integrations', { googleMapsApiKey: v })} />
                )}

                <h4 className="settings-subtitle">Security</h4>
                <Toggle label="reCAPTCHA" checked={settings.integrations.recaptchaEnabled}
                  onChange={v => updateSection('integrations', { recaptchaEnabled: v })} />
                {settings.integrations.recaptchaEnabled && (
                  <Field label="reCAPTCHA Site Key" value={settings.integrations.recaptchaKey} type="password"
                    onChange={v => updateSection('integrations', { recaptchaKey: v })} />
                )}

                <h4 className="settings-subtitle">Marketing</h4>
                <Toggle label="Mailchimp" checked={settings.integrations.mailchimpEnabled}
                  onChange={v => updateSection('integrations', { mailchimpEnabled: v })} />
                {settings.integrations.mailchimpEnabled && (
                  <div className="settings-grid-2">
                    <Field label="API Key" value={settings.integrations.mailchimpApiKey} type="password"
                      onChange={v => updateSection('integrations', { mailchimpApiKey: v })} />
                    <Field label="List ID" value={settings.integrations.mailchimpListId}
                      onChange={v => updateSection('integrations', { mailchimpListId: v })} />
                  </div>
                )}
              </SettingsSection>
            )}

            {/* ── LEGAL ────────────────────────── */}
            {activeTab === 'legal' && (
              <SettingsSection title="Legal & Compliance" icon="📜" onReset={() => handleReset('legal')}>
                <div className="settings-grid-2">
                  <Field label="Privacy Policy URL" value={settings.legal.privacyPolicyUrl}
                    onChange={v => updateSection('legal', { privacyPolicyUrl: v })} />
                  <Field label="Terms of Service URL" value={settings.legal.termsUrl}
                    onChange={v => updateSection('legal', { termsUrl: v })} />
                </div>
                <Field label="Refund Policy URL" value={settings.legal.refundPolicyUrl}
                  onChange={v => updateSection('legal', { refundPolicyUrl: v })} />
                <div className="settings-grid-2">
                  <Toggle label="HIPAA Compliance" checked={settings.legal.hipaaCompliance}
                    onChange={v => updateSection('legal', { hipaaCompliance: v })} />
                  <Toggle label="GDPR Compliance" checked={settings.legal.gdprCompliance}
                    onChange={v => updateSection('legal', { gdprCompliance: v })} />
                </div>
                <Toggle label="Cookie Consent Banner" checked={settings.legal.cookieConsentEnabled}
                  onChange={v => updateSection('legal', { cookieConsentEnabled: v })} />
                <Field label="Data Retention Period (days)" value={settings.legal.dataRetentionDays} type="number"
                  onChange={v => updateSection('legal', { dataRetentionDays: Number(v) })} />
              </SettingsSection>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Reusable Field Components ──────────────────
function Field({ label, value, onChange, type = 'text', options = [], placeholder = '' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'textarea' ? (
        <textarea className="form-textarea" value={value || ''} onChange={e => onChange(e.target.value)} rows={3} />
      ) : type === 'select' ? (
        <select className="form-select" value={value || ''} onChange={e => onChange(e.target.value)}>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : type === 'password' ? (
        <input type="password" className="form-input" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="••••••••" />
      ) : (
        <input type={type} className="form-input" value={value ?? ''} onChange={e => onChange(type === 'number' ? e.target.value : e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange, description }) {
  return (
    <div className="toggle-row">
      <div>
        <span className="toggle-label">{label}</span>
        {description && <span className="toggle-desc">{description}</span>}
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={checked || false} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="color-picker">
        <input type="color" value={value || '#4F46E5'} onChange={e => onChange(e.target.value)} />
        <input type="text" className="form-input" value={value || ''} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function TagInput({ label, tags = [], onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()]);
      setInput('');
    }
  };
  const remove = (tag) => onChange(tags.filter(t => t !== tag));
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1]);
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="tag-input-container">
        {tags.map(tag => (
          <span key={tag} className="tag-item">
            {tag}
            <button onClick={() => remove(tag)} type="button">✕</button>
          </span>
        ))}
        <input className="tag-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Type and press Enter..." />
      </div>
    </div>
  );
}

function CheckboxGroup({ label, options, selected = [], onChange }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="checkbox-group">
        {options.map(opt => (
          <label key={opt} className="checkbox-item">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SettingsSection({ title, icon, children, onReset }) {
  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>{icon} {title}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>🔄 Reset to Defaults</button>
      </div>
      <div className="settings-section-body">
        {children}
      </div>
    </div>
  );
}
