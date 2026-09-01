const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');
const { uploadToCloudinary, uploadMiddleware } = require('../services/cloudinaryService');

// @route   POST /api/reports
// @desc    Upload a report (supports both file upload and JSON body)
// @access  Private
router.post('/', protect, uploadMiddleware.single('file'), async (req, res) => {
  try {
    let fileData = {};

    // If file was uploaded via multer
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'mediconnect/reports',
        resourceType: 'auto'
      });
      fileData = {
        fileUrl: result.url,
        fileName: req.file.originalname
      };
    } else {
      // JSON body with existing URL
      fileData = {
        fileUrl: req.body.fileUrl,
        fileName: req.body.fileName
      };
    }

    const report = await Report.create({
      patient: req.user.id,
      title: req.body.title,
      description: req.body.description,
      fileType: req.body.fileType,
      tags: req.body.tags,
      labResults: req.body.labResults,
      vitalSigns: req.body.vitalSigns,
      ...fileData
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Report upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// @route   GET /api/reports
// @desc    Get patient's reports
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, page = 1, limit = 20, search } = req.query;
    let query = { patient: req.user.id };

    if (type) query.fileType = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Report.countDocuments(query)
    ]);

    res.json({
      success: true,
      reports,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get report details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (report.patient.toString() !== req.user.id) {
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: req.user.id });
        const isShared = report.sharedWith.some(s => s.doctor.toString() === doctor?._id.toString());
        if (!isShared) {
          return res.status(403).json({ success: false, error: 'Not authorized' });
        }
      } else {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT /api/reports/:id/share
// @desc    Share report with doctor
// @access  Private
router.put('/:id/share', protect, async (req, res) => {
  try {
    const { doctorId, permission } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report || report.patient.toString() !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const alreadyShared = report.sharedWith.some(s => s.doctor.toString() === doctorId);
    if (alreadyShared) {
      return res.status(400).json({ success: false, error: 'Report already shared with this doctor' });
    }

    report.sharedWith.push({
      doctor: doctorId,
      sharedAt: new Date(),
      permission: permission || 'view'
    });
    report.isShared = true;
    await report.save();

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report (and remove from Cloudinary)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report || report.patient.toString() !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Delete from Cloudinary if has a public ID
    if (report.fileUrl && report.fileUrl.includes('cloudinary')) {
      try {
        const { deleteFile } = require('../services/cloudinaryService');
        const urlParts = report.fileUrl.split('/');
        const folderIndex = urlParts.findIndex(p => p === 'mediconnect');
        if (folderIndex > -1) {
          const publicId = urlParts.slice(folderIndex).join('/').replace(/\.[^.]+$/, '');
          await deleteFile(publicId);
        }
      } catch (e) { /* Cloudinary delete failed, still delete record */ }
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
