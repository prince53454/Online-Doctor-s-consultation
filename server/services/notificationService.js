const Notification = require('../models/Notification');

/**
 * Create and emit a real-time notification
 * @param {Object} io - Socket.IO instance
 * @param {Object} params - Notification parameters
 */
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

    // Populate sender info for real-time
    const populated = await notification.populate('sender', 'name avatar role');

    // Emit via Socket.IO for real-time delivery
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

/**
 * Send appointment booked notification to doctor
 */
async function notifyDoctorBooked(io, appointment, patient, doctor) {
  const doctorUser = doctor.user?._id || doctor.user;
  const patientName = patient.name || 'A patient';
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return createNotification(io, {
    recipientId: doctorUser,
    senderId: patient._id,
    type: 'appointment_booked',
    title: '📅 New Appointment Booked',
    message: `${patientName} has booked a ${appointment.appointmentType} consultation for ${dateStr} at ${appointment.timeSlot?.startTime}.`,
    data: {
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: doctor._id,
      amount: appointment.payment?.amount
    }
  });
}

/**
 * Send appointment confirmed notification to patient
 */
async function notifyPatientConfirmed(io, appointment, patient, doctor) {
  const doctorName = doctor.user?.name || doctor.user?.toString?.() || 'Your doctor';
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return createNotification(io, {
    recipientId: patient._id,
    senderId: doctorUser(doctor),
    type: 'appointment_confirmed',
    title: '✅ Appointment Confirmed',
    message: `Your appointment with ${doctorName} on ${dateStr} at ${appointment.timeSlot?.startTime} has been confirmed.`,
    data: {
      appointmentId: appointment._id,
      doctorId: doctor._id,
      roomId: appointment.roomId
    }
  });
}

/**
 * Send appointment cancelled notification
 */
async function notifyAppointmentCancelled(io, appointment, recipientId, cancelledByName, reason) {
  const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return createNotification(io, {
    recipientId,
    type: 'appointment_cancelled',
    title: '❌ Appointment Cancelled',
    message: `Your appointment on ${dateStr} at ${appointment.timeSlot?.startTime} has been cancelled by ${cancelledByName}.${reason ? ` Reason: ${reason}` : ''}`,
    data: {
      appointmentId: appointment._id,
      amount: appointment.payment?.amount
    }
  });
}

/**
 * Send payment received notification to doctor
 */
async function notifyPaymentReceived(io, appointment, doctor) {
  const doctorUser = doctor.user?._id || doctor.user;

  return createNotification(io, {
    recipientId: doctorUser,
    type: 'payment_received',
    title: '💰 Payment Received',
    message: `Payment of ₹${appointment.payment?.amount} received for appointment.`,
    data: {
      appointmentId: appointment._id,
      amount: appointment.payment?.amount
    }
  });
}

/**
 * Send video call notification
 */
async function notifyVideoCall(io, appointment, recipientId, callerName, started) {
  return createNotification(io, {
    recipientId,
    senderId: appointment.patient?._id || appointment.patient,
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

function doctorUser(doctor) {
  return doctor.user?._id || doctor.user;
}

module.exports = {
  createNotification,
  notifyDoctorBooked,
  notifyPatientConfirmed,
  notifyAppointmentCancelled,
  notifyPaymentReceived,
  notifyVideoCall
};
