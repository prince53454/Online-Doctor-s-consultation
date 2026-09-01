const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const isConfigured = process.env.SMTP_USER && !process.env.SMTP_USER.includes('your_');

  if (!isConfigured) {
    console.warn('⚠️  Email service not configured. Emails will be logged to console.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

// Generic send function
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'MediConnect Pro <noreply@mediconnect.com>',
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]*>/g, '') // Strip HTML for plain text
  };

  if (!transport) {
    console.log(`📧 [DEV] Email to ${to}: ${subject}`);
    return { messageId: 'dev_' + Date.now(), accepted: [to] };
  }

  try {
    const result = await transport.sendMail(mailOptions);
    console.log(`📧 Email sent: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('📧 Email send error:', error.message);
    // Don't throw — email failure shouldn't block the booking
    return { messageId: 'failed', error: error.message };
  }
}

// ─── Appointment Confirmation ────────────────────────────────────
async function sendAppointmentConfirmation(appointment, patient, doctor) {
  const doctorName = doctor.user?.name || 'Doctor';
  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return sendEmail({
    to: patient.email,
    subject: `✅ Appointment Confirmed with ${doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Appointment Confirmed! ✅</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear <strong>${patient.name}</strong>,</p>
          <p>Your appointment has been confirmed. Here are the details:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280;">Doctor</td><td style="padding: 8px 0; font-weight: 600;">${doctorName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Specialty</td><td style="padding: 8px 0;">${doctor.specialization}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="padding: 8px 0; font-weight: 600;">${date}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Time</td><td style="padding: 8px 0;">${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Type</td><td style="padding: 8px 0;"><span style="background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 12px; font-size: 13px;">${appointment.appointmentType}</span></td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Amount Paid</td><td style="padding: 8px 0; font-weight: 700; color: #059669;">₹${appointment.payment.amount}</td></tr>
            </table>
          </div>

          ${appointment.appointmentType === 'video' ? `
            <div style="background: #EEF2FF; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📹 Video Consultation</strong></p>
              <p style="margin: 8px 0 0; color: #4b5563;">You will receive a link to join the video call 15 minutes before your appointment.</p>
            </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 13px;">If you need to cancel, please do so at least 24 hours in advance for a full refund.</p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/appointments" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">View My Appointments</a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>MediConnect Pro — Your Trusted Healthcare Platform</p>
        </div>
      </div>
    `
  });
}

// ─── Appointment Cancellation ────────────────────────────────────
async function sendAppointmentCancellation(appointment, patient, doctor, refundAmount) {
  const doctorName = doctor.user?.name || 'Doctor';
  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return sendEmail({
    to: patient.email,
    subject: `❌ Appointment Cancelled with ${doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #EF4444; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Appointment Cancelled</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear <strong>${patient.name}</strong>,</p>
          <p>Your appointment with <strong>${doctorName}</strong> has been cancelled.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}</p>
            ${refundAmount > 0 ? `<p style="color: #059669; font-weight: 600;">💰 Refund of ₹${refundAmount} will be processed within 5-7 business days.</p>` : '<p>No refund applicable (cancelled within 24 hours).</p>'}
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/doctors" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Book Another Appointment</a>
          </div>
        </div>
      </div>
    `
  });
}

// ─── Appointment Reminder (24h before) ───────────────────────────
async function sendAppointmentReminder(appointment, patient, doctor) {
  const doctorName = doctor.user?.name || 'Doctor';
  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return sendEmail({
    to: patient.email,
    subject: `⏰ Reminder: Appointment tomorrow with ${doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F59E0B; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Appointment Reminder ⏰</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear <strong>${patient.name}</strong>,</p>
          <p>This is a friendly reminder about your appointment tomorrow.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName} (${doctor.specialization})</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}</p>
            <p><strong>Type:</strong> ${appointment.appointmentType}</p>
          </div>

          ${appointment.appointmentType === 'video' ? `
            <div style="background: #EEF2FF; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0;"><strong>📹 Video Call</strong></p>
              <p style="margin: 8px 0 0;">Join link will be available in your dashboard 15 minutes before the appointment.</p>
            </div>
          ` : ''}

          <p style="color: #6b7280;">Please ensure you're ready 5 minutes before your scheduled time.</p>
        </div>
      </div>
    `
  });
}

// ─── New Booking Notification to Doctor ───────────────────────────
async function sendDoctorBookingNotification(appointment, patient, doctor) {
  const doctorEmail = doctor.user?.email;
  if (!doctorEmail) return;

  const date = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return sendEmail({
    to: doctorEmail,
    subject: `📅 New Appointment: ${patient.name} booked for ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">New Appointment Booked! 📅</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear <strong>${doctor.user?.name}</strong>,</p>
          <p>You have a new appointment booking.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p><strong>Patient:</strong> ${patient.name}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}</p>
            <p><strong>Type:</strong> ${appointment.appointmentType}</p>
            <p><strong>Symptoms:</strong> ${appointment.symptoms}</p>
            <p><strong>Fee:</strong> ₹${appointment.payment.amount}</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/appointments" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Appointment</a>
          </div>
        </div>
      </div>
    `
  });
}

// ─── Payment Receipt ─────────────────────────────────────────────
async function sendPaymentReceipt(appointment, patient, doctor) {
  return sendEmail({
    to: patient.email,
    subject: `💳 Payment Receipt — ₹${appointment.payment.amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Payment Receipt 💳</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <div>
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">PAYMENT ID</p>
                <p style="margin: 4px 0 0; font-weight: 600; font-size: 13px;">${appointment.payment.stripePaymentId || 'N/A'}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">DATE</p>
                <p style="margin: 4px 0 0; font-weight: 600;">${new Date(appointment.payment.paidAt).toLocaleDateString()}</p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr><td style="padding: 8px 0; color: #6b7280;">Consultation with</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${doctor.user?.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Type</td><td style="padding: 8px 0; text-align: right;">${appointment.appointmentType}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Date & Time</td><td style="padding: 8px 0; text-align: right;">${new Date(appointment.date).toLocaleDateString()} ${appointment.timeSlot.startTime}</td></tr>
            </table>

            <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between;">
              <span style="font-size: 18px; font-weight: 700;">Total Paid</span>
              <span style="font-size: 22px; font-weight: 900; color: #4F46E5;">₹${appointment.payment.amount}</span>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 13px; text-align: center;">This is a computer-generated receipt. For any billing queries, contact support@mediconnect.com</p>
        </div>
      </div>
    `
  });
}

// ─── Doctor Approval Notification ─────────────────────────────────
async function sendDoctorApprovalStatus(doctor, approved) {
  return sendEmail({
    to: doctor.user?.email,
    subject: approved ? '🎉 Your MediConnect Profile is Approved!' : '📋 MediConnect Profile Update Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${approved ? '#059669' : '#F59E0B'}; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">${approved ? 'Profile Approved! 🎉' : 'Profile Update Required'}</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p>Dear <strong>${doctor.user?.name}</strong>,</p>
          ${approved
            ? `<p>Congratulations! Your doctor profile has been approved. Patients can now find and book appointments with you.</p>
               <div style="text-align: center; margin-top: 24px;">
                 <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
               </div>`
            : `<p>Thank you for registering on MediConnect. Your profile is under review. Our team will verify your credentials shortly. We may reach out if we need additional information.</p>`
          }
        </div>
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentReminder,
  sendDoctorBookingNotification,
  sendPaymentReceipt,
  sendDoctorApprovalStatus
};
