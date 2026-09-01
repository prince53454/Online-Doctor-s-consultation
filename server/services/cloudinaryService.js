const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_CLOUD_NAME.includes('your_');

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Multer memory storage for streaming to Cloudinary
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, gif, webp) and documents (pdf, doc, docx) are allowed'));
  }
});

// Upload buffer to Cloudinary
async function uploadToCloudinary(buffer, options = {}) {
  if (!isConfigured) {
    // Fallback: return a placeholder URL for development
    return {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(options.folder || 'upload')}&background=4F46E5&color=fff`,
      publicId: `dev_${Date.now()}`,
      format: 'png',
      resourceType: 'image'
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'mediconnect',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId || undefined,
        transformation: options.transformation || []
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes
        });
      }
    );
    stream.end(buffer);
  });
}

// Upload from URL
async function uploadFromUrl(url, options = {}) {
  if (!isConfigured) {
    return { url, publicId: `dev_${Date.now()}` };
  }

  const result = await cloudinary.uploader.upload(url, {
    folder: options.folder || 'mediconnect',
    resource_type: options.resourceType || 'auto'
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    resourceType: result.resource_type
  };
}

// Delete a file
async function deleteFile(publicId) {
  if (!isConfigured) return { result: 'ok' };
  return await cloudinary.uploader.destroy(publicId);
}

// Generate upload widget signature (for frontend direct upload)
function generateSignature(folder = 'mediconnect') {
  if (!isConfigured) return null;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  return { timestamp, signature, folder };
}

// Multer middleware for route use
const uploadMiddleware = upload;

module.exports = {
  cloudinary,
  isConfigured,
  uploadToCloudinary,
  uploadFromUrl,
  deleteFile,
  generateSignature,
  uploadMiddleware
};
