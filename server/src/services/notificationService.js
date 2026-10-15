const Notification = require('../models/Notification');
const User = require('../models/User');

async function createNotification(io, { recipientId, senderId, type, title, message, data = {} }) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      data
    });
    const populated = await notification.populate('sender', 'name avatar role');

    if (io) {
      io.to(`user_${recipientId}`).emit('notification', {
        _id: populated._id,
        type: populated.type,
        title: populated.title,
        message: populated.message,
        data: populated.data,
        sender: populated.sender,
        createdAt: populated.createdAt,
        read: false
      });
    }

    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    return null;
  }
}

async function notifyDoctorBooked(io, appointment, patient, doctor) {
  const doctorNotification = createNotification(io, {
    recipientId: doctorUser(doctor),
    senderId: patient._id,
    type: 'appointment_booked',
    title: '📅 New Appointment Booked',
    message: `${patient.name || 'A patient'} booked a ${appointment.appointmentType} consultation for ${formatDate(appointment.date)} at ${appointment.timeSlot?.startTime}.`,
    data: {
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: doctor._id,
      amount: appointment.payment?.amount,
      status: appointment.status
    }
  });

  await Promise.all([
    doctorNotification,
    notifyAdminsAppointment(io, appointment, 'booked', 'patient', patient.name)
  ]);
}

async function notifyPatientConfirmed(io, appointment, patient, doctor) {
  const doctorName = doctor.user?.name || doctor.user?.toString?.() || 'Your doctor';
  return createNotification(io, {
    recipientId: userId(patient),
    senderId: doctorUser(doctor),
    type: 'appointment_confirmed',
    title: '✅ Appointment Confirmed',
    message: `Your appointment with ${doctorName} on ${formatDate(appointment.date)} at ${appointment.timeSlot?.startTime} has been confirmed.`,
    data: {
      appointmentId: appointment._id,
      doctorId: doctor._id,
      roomId: appointment.roomId,
      status: appointment.status
    }
  });
}

async function notifyAppointmentCancelled(io, appointment, recipientId, cancelledByName, reason) {
  return createNotification(io, {
    recipientId,
    type: 'appointment_cancelled',
    title: '❌ Appointment Cancelled',
    message: `Your appointment on ${formatDate(appointment.date)} at ${appointment.timeSlot?.startTime} has been cancelled by ${cancelledByName}.${reason ? ` Reason: ${reason}` : ''}`,
    data: {
      appointmentId: appointment._id,
      doctorId: userId(appointment.doctor),
      patientId: userId(appointment.patient),
      amount: appointment.payment?.amount,
      status: appointment.status,
      actorRole: cancelledByName
    }
  });
}

async function notifyAppointmentRescheduled(io, appointment, recipientId, actorRole) {
  const notification = await createNotification(io, {
    recipientId,
    senderId: actorRole === 'doctor' ? doctorUser(appointment.doctor) : userId(appointment.patient),
    type: 'appointment_rescheduled',
    title: '🔄 Appointment Rescheduled',
    message: `Your appointment has been rescheduled to ${formatDate(appointment.date)} at ${appointment.timeSlot?.startTime}.`,
    data: {
      appointmentId: appointment._id,
      doctorId: doctorId(appointment.doctor),
      patientId: userId(appointment.patient),
      roomId: appointment.roomId,
      status: appointment.status,
      actorRole
    }
  });
  await notifyAdminsAppointment(io, appointment, 'rescheduled', actorRole);
  return notification;
}

async function notifyAdminsAppointment(io, appointment, action, actorRole, actorName) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const doctorIdValue = doctorId(appointment.doctor);
  const patientIdValue = userId(appointment.patient);
  const message = actorName
    ? `${actorName} ${action} an appointment.`
    : `An appointment was ${action} by a ${actorRole}.`;

  return Promise.all(admins.map(admin => createNotification(io, {
    recipientId: admin._id,
    senderId: actorRole === 'patient'
      ? patientIdValue
      : actorRole === 'doctor' ? doctorUser(appointment.doctor) : undefined,
    type: action === 'booked' ? 'appointment_booked' : 'appointment_status_updated',
    title: action === 'booked' ? '📅 New Appointment' : '📋 Appointment Updated',
    message,
    data: {
      appointmentId: appointment._id,
      doctorId: doctorIdValue,
      patientId: patientIdValue,
      status: appointment.status,
      actorRole
    }
  })));
}

async function notifyAdminsDoctorRegistered(io, doctor) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const doctorUserId = doctorUser(doctor);
  const doctorName = doctor.user?.name || 'A doctor';

  return Promise.all(admins.map(admin => createNotification(io, {
    recipientId: admin._id,
    senderId: doctorUserId,
    type: 'doctor_registered',
    title: '🩺 Doctor Application Submitted',
    message: `${doctorName} submitted a doctor profile for review.`,
    data: { doctorId: doctor._id, status: 'pending' }
  })));
}

async function notifyDoctorApproval(io, doctor, approved) {
  return createNotification(io, {
    recipientId: doctorUser(doctor),
    type: approved ? 'doctor_approved' : 'doctor_rejected',
    title: approved ? '✅ Doctor Profile Approved' : 'Doctor Application Update',
    message: approved
      ? 'Your doctor profile was approved. You can now access your doctor dashboard.'
      : 'Your doctor profile was not approved. Please contact support for details.',
    data: { doctorId: doctor._id, status: approved ? 'approved' : 'rejected' }
  });
}

async function notifyPaymentReceived(io, appointment, doctor) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  return Promise.all([
    createNotification(io, {
      recipientId: doctorUser(doctor),
      type: 'payment_received',
      title: '💰 Payment Received',
      message: `Payment of ₹${appointment.payment?.amount} received for appointment.`,
      data: {
        appointmentId: appointment._id,
        doctorId: doctor._id,
        amount: appointment.payment?.amount,
        status: appointment.payment?.status
      }
    }),
    ...admins.map(admin => createNotification(io, {
      recipientId: admin._id,
      type: 'payment_received',
      title: '💰 Appointment Payment Received',
      message: `Payment of ₹${appointment.payment?.amount} was received for an appointment.`,
      data: {
        appointmentId: appointment._id,
        doctorId: doctor._id,
        patientId: userId(appointment.patient),
        amount: appointment.payment?.amount,
        status: appointment.payment?.status
      }
    }))
  ]);
}

async function notifyReviewReceived(io, appointment, patient, doctor) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const notificationData = {
    appointmentId: appointment._id,
    doctorId: doctor._id,
    patientId: userId(patient),
    score: appointment.rating?.score
  };

  return Promise.all([
    createNotification(io, {
      recipientId: doctorUser(doctor),
      senderId: userId(patient),
      type: 'review_received',
      title: '⭐ New Patient Review',
      message: `A patient left a ${appointment.rating?.score || ''}-star review for your consultation.`,
      data: notificationData
    }),
    ...admins.map(admin => createNotification(io, {
      recipientId: admin._id,
      senderId: userId(patient),
      type: 'review_received',
      title: '⭐ New Patient Review',
      message: 'A patient submitted a consultation review.',
      data: notificationData
    }))
  ]);
}

async function notifyVideoCall(io, appointment, recipientId, callerName, started) {
  return createNotification(io, {
    recipientId,
    senderId: userId(appointment.patient),
    type: started ? 'video_call_started' : 'video_call_ended',
    title: started ? '📹 Video Call Started' : '📹 Video Call Ended',
    message: started
      ? `${callerName} has started a video consultation. Join now!`
      : `Video consultation with ${callerName} has ended.`,
    data: {
      appointmentId: appointment._id,
      roomId: appointment.roomId
    }
  });
}

function userId(user) {
  return user?._id || user;
}

function doctorId(doctor) {
  return doctor?._id || doctor;
}

function doctorUser(doctor) {
  return userId(doctor?.user);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

module.exports = {
  createNotification,
  notifyDoctorBooked,
  notifyPatientConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyAdminsAppointment,
  notifyAdminsDoctorRegistered,
  notifyDoctorApproval,
  notifyPaymentReceived,
  notifyReviewReceived,
  notifyVideoCall
};
