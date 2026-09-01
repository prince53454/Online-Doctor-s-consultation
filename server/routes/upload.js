const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadToCloudinary, uploadMiddleware, generateSignature } = require('../services/cloudinaryService');

// @route   POST /api/upload/file
// @desc    Upload a file (report, image, document)
// @access  Private
router.post('/file', protect, uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const folder = req.body.folder || 'mediconnect/reports';
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resourceType: 'auto'
    });

    res.json({
      success: true,
      file: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        resourceType: result.resourceType,
        bytes: result.bytes || req.file.size,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', protect, uploadMiddleware.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }

    const folder = req.body.folder || 'mediconnect/reports';
    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, { folder, resourceType: 'auto' })
        .then(result => ({
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          originalName: file.originalname,
          mimeType: file.mimetype,
          bytes: result.bytes || file.size
        }))
    );

    const files = await Promise.all(uploadPromises);

    res.json({ success: true, files });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload and update user avatar
// @access  Private
router.post('/avatar', protect, uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'mediconnect/avatars',
      resourceType: 'image',
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }]
    });

    // Update user avatar
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { avatar: result.url });

    res.json({
      success: true,
      avatar: result.url
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: 'Avatar upload failed' });
  }
});

// @route   GET /api/upload/signature
// @desc    Get Cloudinary upload signature for frontend direct upload
// @access  Private
router.get('/signature', protect, async (req, res) => {
  try {
    const folder = req.query.folder || 'mediconnect/reports';
    const signature = generateSignature(folder);

    if (!signature) {
      return res.json({ success: true, direct: false, message: 'Using server-side upload' });
    }

    res.json({
      success: true,
      direct: true,
      signature: signature.signature,
      timestamp: signature.timestamp,
      folder: signature.folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate signature' });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete an uploaded file
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
  try {
    const { deleteFile } = require('../services/cloudinaryService');
    const publicId = decodeURIComponent(req.params.publicId);
    await deleteFile(publicId);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

module.exports = router;
