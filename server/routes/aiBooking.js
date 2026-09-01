const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// Symptom to specialization mapping
const symptomSpecialtyMap = {
  'headache': ['Neurologist', 'General Physician'],
  'migraine': ['Neurologist'],
  'chest pain': ['Cardiologist'],
  'heart': ['Cardiologist'],
  'skin': ['Dermatologist', 'General Physician'],
  'rash': ['Dermatologist'],
  'acne': ['Dermatologist'],
  'stomach': ['Gastroenterologist', 'General Physician'],
  'digestive': ['Gastroenterologist'],
  'diabetes': ['Endocrinologist'],
  'thyroid': ['Endocrinologist'],
  'bone': ['Orthopedic Surgeon'],
  'joint': ['Orthopedic Surgeon'],
  'back pain': ['Orthopedic Surgeon', 'General Physician'],
  'knee': ['Orthopedic Surgeon'],
  'child': ['Pediatrician'],
  'baby': ['Pediatrician'],
  'fever': ['General Physician'],
  'cold': ['General Physician', 'ENT Specialist'],
  'cough': ['Pulmonologist', 'General Physician'],
  'breathing': ['Pulmonologist'],
  'anxiety': ['Psychiatrist'],
  'depression': ['Psychiatrist'],
  'mental': ['Psychiatrist'],
  'eye': ['Ophthalmologist'],
  'vision': ['Ophthalmologist'],
  'tooth': ['Dentist'],
  'dental': ['Dentist'],
  'urine': ['Urologist'],
  'kidney': ['Urologist'],
  'ear': ['ENT Specialist'],
  'throat': ['ENT Specialist'],
  'nose': ['ENT Specialist'],
  'women': ['Gynecologist'],
  'pregnancy': ['Gynecologist'],
  'period': ['Gynecologist'],
  'hair': ['Dermatologist'],
  'allergy': ['General Physician', 'Dermatologist'],
  'vomiting': ['Gastroenterologist', 'General Physician'],
  'fatigue': ['General Physician', 'Endocrinologist'],
  'weight': ['Endocrinologist', 'General Physician'],
  'blood pressure': ['Cardiologist', 'General Physician']
};

// @route   POST /api/ai/recommend
// @desc    AI symptom analysis and doctor recommendation
// @access  Private
router.post('/recommend', protect, async (req, res) => {
  try {
    const { symptoms, city, preferredType, maxFee, preferredLanguage } = req.body;

    if (!symptoms) {
      return res.status(400).json({ success: false, error: 'Please describe your symptoms' });
    }

    const symptomLower = symptoms.toLowerCase();

    // Find matching specializations
    let recommendedSpecialties = [];
    let symptomAnalysis = [];

    for (const [keyword, specialties] of Object.entries(symptomSpecialtyMap)) {
      if (symptomLower.includes(keyword)) {
        recommendedSpecialties.push(...specialties);
        symptomAnalysis.push({
          keyword,
          matchConfidence: Math.min(symptomLower.split(keyword).length * 30, 100),
          suggestedSpecialties: specialties
        });
      }
    }

    // Remove duplicates
    recommendedSpecialties = [...new Set(recommendedSpecialties)];

    // If no match, recommend general physician
    if (recommendedSpecialties.length === 0) {
      recommendedSpecialties = ['General Physician'];
      symptomAnalysis.push({
        keyword: 'general',
        matchConfidence: 50,
        suggestedSpecialties: ['General Physician'],
        note: 'Could not determine specific specialty. A general physician is recommended.'
      });
    }

    // Build query
    let query = {
      isApproved: true,
      specialization: { $in: recommendedSpecialties }
    };

    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (maxFee) query['consultationFee.inPerson'] = { $lte: Number(maxFee) };
    if (preferredLanguage) query.languagesKnown = { $in: [preferredLanguage] };

    // Find matching doctors
    let doctors = await Doctor.find(query)
      .populate('user', 'name avatar')
      .sort('-rating.average')
      .limit(10)
      .lean();

    // If no doctors in preferred city, search without city
    if (doctors.length === 0 && city) {
      delete query['location.city'];
      doctors = await Doctor.find(query)
        .populate('user', 'name avatar')
        .sort('-rating.average')
        .limit(10)
        .lean();
    }

    // Generate recommendations
    const recommendations = doctors.map(doc => ({
      doctor: doc,
      matchScore: calculateMatchScore(doc, {
        symptoms: symptomLower,
        preferredType,
        maxFee,
        preferredLanguage
      }),
      reason: generateRecommendationReason(doc, recommendedSpecialties)
    })).sort((a, b) => b.matchScore - a.matchScore);

    // Determine urgency
    const urgency = determineUrgency(symptomLower);

    res.json({
      success: true,
      analysis: {
        symptoms: symptomLower,
        symptomAnalysis,
        recommendedSpecialties,
        urgency,
        recommendations: recommendations.slice(0, 5),
        disclaimer: 'This is an AI-assisted recommendation. Please consult a healthcare professional for accurate diagnosis.'
      }
    });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/ai/auto-book
// @desc    AI auto-booking based on availability and preferences
// @access  Private (Patient)
router.post('/auto-book', protect, authorize('patient'), async (req, res) => {
  try {
    const { doctorId, preferredDate, preferredTime, symptoms, appointmentType } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Find best available slot
    let bestSlot = null;
    let bestDate = null;

    if (preferredDate) {
      // Try preferred date first
      const targetDate = new Date(preferredDate);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()];

      const dayAvailability = doctor.availability.find(a => a.day === dayName);
      if (dayAvailability) {
        const availableSlots = dayAvailability.slots.filter(s => s.isAvailable);
        if (availableSlots.length > 0) {
          if (preferredTime) {
            // Try to match preferred time
            bestSlot = availableSlots.find(s => s.startTime === preferredTime) || availableSlots[0];
          } else {
            bestSlot = availableSlots[0];
          }
          bestDate = targetDate;
        }
      }
    }

    // If no slot found on preferred date, search next 7 days
    if (!bestSlot) {
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDate.getDay()];

        const dayAvailability = doctor.availability.find(a => a.day === dayName);
        if (dayAvailability) {
          const availableSlots = dayAvailability.slots.filter(s => s.isAvailable);
          if (availableSlots.length > 0) {
            // Check for existing appointments
            for (const slot of availableSlots) {
              const existing = await Appointment.findOne({
                doctor: doctorId,
                date: checkDate,
                'timeSlot.startTime': slot.startTime,
                status: { $in: ['pending', 'confirmed'] }
              });

              if (!existing) {
                bestSlot = slot;
                bestDate = checkDate;
                break;
              }
            }
            if (bestSlot) break;
          }
        }
      }
    }

    if (!bestSlot || !bestDate) {
      return res.status(400).json({
        success: false,
        error: 'No available slots found in the next 7 days. Please try a different doctor or date.'
      });
    }

    // Determine fee
    let fee;
    switch (appointmentType) {
      case 'video': fee = doctor.consultationFee.video; break;
      case 'chat': fee = doctor.consultationFee.chat; break;
      default: fee = doctor.consultationFee.inPerson;
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentType: appointmentType || 'in-person',
      date: bestDate,
      timeSlot: { startTime: bestSlot.startTime, endTime: bestSlot.endTime },
      symptoms: symptoms || 'AI-assisted booking',
      isAIBooking: true,
      aiRecommendation: `AI selected ${bestSlot.startTime} - ${bestSlot.endTime} on ${bestDate.toDateString()} based on your preferences`,
      roomId: require('uuid').v4(),
      payment: { amount: fee, currency: 'INR', status: 'pending' }
    });

    await appointment.populate([
      { path: 'doctor', populate: { path: 'user', select: 'name email avatar' } },
      { path: 'patient', select: 'name email avatar' }
    ]);

    res.status(201).json({
      success: true,
      appointment,
      message: `Appointment auto-booked for ${bestDate.toDateString()} at ${bestSlot.startTime}`
    });
  } catch (error) {
    console.error('Auto-book error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Helper: Calculate match score
function calculateMatchScore(doctor, preferences) {
  let score = 50;

  // Rating boost
  score += (doctor.rating.average || 0) * 5;

  // Fee match
  if (preferences.maxFee && doctor.consultationFee.inPerson <= preferences.maxFee) {
    score += 15;
  }

  // Language match
  if (preferences.preferredLanguage && doctor.languagesKnown?.includes(preferences.preferredLanguage)) {
    score += 10;
  }

  // Experience boost
  score += Math.min(doctor.experience * 0.5, 10);

  // Online availability boost
  if (doctor.isOnline) score += 5;

  return Math.min(Math.round(score), 100);
}

// Helper: Generate recommendation reason
function generateRecommendationReason(doctor, specialties) {
  const reasons = [];
  if (specialties.includes(doctor.specialization)) {
    reasons.push(`Specializes in ${doctor.specialization}`);
  }
  if (doctor.rating.average >= 4.5) {
    reasons.push(`Highly rated (${doctor.rating.average}/5)`);
  }
  if (doctor.experience >= 10) {
    reasons.push(`${doctor.experience}+ years of experience`);
  }
  if (doctor.isOnline) {
    reasons.push('Available for online consultation');
  }
  return reasons.join(' • ') || 'Recommended based on your symptoms';
}

// Helper: Determine urgency
function determineUrgency(symptoms) {
  const emergencyKeywords = ['chest pain', 'difficulty breathing', 'severe bleeding', 'stroke', 'seizure', 'unconscious', 'heart attack'];
  const urgentKeywords = ['high fever', 'severe pain', 'vomiting blood', 'broken bone', 'severe allergic'];

  const lower = symptoms.toLowerCase();

  if (emergencyKeywords.some(k => lower.includes(k))) {
    return { level: 'emergency', message: 'Please call emergency services (108) immediately!' };
  }
  if (urgentKeywords.some(k => lower.includes(k))) {
    return { level: 'urgent', message: 'Please seek medical attention as soon as possible.' };
  }
  return { level: 'normal', message: 'You can book a regular appointment.' };
}

module.exports = router;
