const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// @route   GET /api/doctors
// @desc    Search doctors with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      search, specialization, city, state,
      minFee, maxFee, minRating, minExperience,
      language, consultationType,
      page = 1, limit = 12, sort = '-rating.average',
      latitude, longitude, maxDistance = 50
    } = req.query;

    let query = { isApproved: true };

    // Text search (name, clinic, specialization)
    if (search) {
      query.$or = [
        { specialization: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];

      // Also search by user name
      const users = await User.find({
        name: { $regex: search, $options: 'i' },
        role: 'doctor'
      }).select('_id');
      if (users.length > 0) {
        query.$or.push({ user: { $in: users.map(u => u._id) } });
      }
    }

    // Specialization filter
    if (specialization) {
      query.specialization = specialization;
    }

    // Location filters
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (state) query['location.state'] = { $regex: state, $options: 'i' };

    // Fee range
    if (minFee || maxFee) {
      query['consultationFee.inPerson'] = {};
      if (minFee) query['consultationFee.inPerson'].$gte = Number(minFee);
      if (maxFee) query['consultationFee.inPerson'].$lte = Number(maxFee);
    }

    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: Number(minRating) };
    }

    // Experience filter
    if (minExperience) {
      query.experience = { $gte: Number(minExperience) };
    }

    // Language filter
    if (language) {
      query.languagesKnown = { $in: [language] };
    }

    // Geospatial query
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)]
          },
          $maxDistance: Number(maxDistance) * 1000 // Convert km to meters
        }
      };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('user', 'name email avatar phone')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Doctor.countDocuments(query)
    ]);

    res.json({
      success: true,
      doctors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/doctors/specializations
// @desc    Get all specializations
// @access  Public
router.get('/specializations', async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization', { isApproved: true });
    res.json({ success: true, specializations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/doctors/cities
// @desc    Get all cities with doctors
// @access  Public
router.get('/cities', async (req, res) => {
  try {
    const cities = await Doctor.distinct('location.city', { isApproved: true });
    res.json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/doctors/featured
// @desc    Get featured doctors
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: true, isFeatured: true })
      .populate('user', 'name email avatar')
      .sort('-rating.average')
      .limit(8)
      .lean();

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email avatar phone');

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Get recent reviews
    const reviews = await Review.find({ doctor: doctor._id })
      .populate('patient', 'name avatar')
      .sort('-createdAt')
      .limit(10)
      .lean();

    res.json({ success: true, doctor, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/doctors/:id/availability
// @desc    Get doctor availability for a specific date range
// @access  Public
router.get('/:id/availability', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    let availability = doctor.availability;

    // Get blocked slots
    const blockedSlots = doctor.blockedSlots || [];
    if (date) {
      const targetDate = new Date(date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()];

      availability = availability.filter(a => a.day === dayName);

      // Remove blocked slots for this date
      blockedSlots.forEach(blocked => {
        if (blocked.date.toDateString() === targetDate.toDateString()) {
          availability.forEach(day => {
            day.slots = day.slots.filter(slot =>
              slot.startTime !== blocked.startTime || slot.endTime !== blocked.endTime
            );
          });
        }
      });
    }

    res.json({ success: true, availability, blockedSlots });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile (doctor only)
// @access  Private (Doctor)
router.put('/profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const updates = req.body;
    let doctor = await Doctor.findOne({ user: req.user.id });

    if (doctor) {
      // Update existing
      Object.assign(doctor, updates);
      await doctor.save();
    } else {
      // Create new doctor profile for newly registered doctor
      updates.user = req.user.id;
      updates.licenseNumber = updates.licenseNumber || 'MCI-' + Math.floor(10000 + Math.random() * 90000);
      // Ensure location has required geospatial fields
      if (updates.location && !updates.location.type) {
        updates.location.type = 'Point';
      }
      if (updates.location && !updates.location.coordinates) {
        updates.location.coordinates = [77.2 + Math.random() * 10, 28.5 + Math.random() * 5];
      }
      doctor = await Doctor.create(updates);
    }

    await doctor.populate('user', 'name email avatar');

    res.json({ success: true, doctor });
  } catch (error) {
    console.error('Doctor profile error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// @route   PUT /api/doctors/availability
// @desc    Update doctor availability
// @access  Private (Doctor)
router.put('/availability', protect, authorize('doctor'), async (req, res) => {
  try {
    const { availability } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { $set: { availability } },
      { new: true, runValidators: true }
    );

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
