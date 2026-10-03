const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const emailValidation = body('email')
  .isString().withMessage('Please enter a valid email')
  .bail()
  .trim()
  .isEmail().withMessage('Please enter a valid email')
  .bail()
  .customSanitizer(email => email.toLowerCase());

const registerValidation = [
  body('name').isString().withMessage('Name is required').bail().trim().notEmpty().withMessage('Name is required'),
  emailValidation,
  body('password').isString().withMessage('Password must be at least 6 characters')
    .bail().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^\+?[\d\s-]{10,15}$/).withMessage('Invalid phone number')
];

const loginValidation = [
  emailValidation,
  body('password').isString().withMessage('Password is required').bail().notEmpty().withMessage('Password is required')
];

const adminAccessValidation = [
  body('password')
    .isString().withMessage('Admin access password is required')
    .bail()
    .isLength({ min: 1, max: 256 }).withMessage('Invalid admin access password')
];

const resetPasswordValidation = [
  body('token').isString().withMessage('Token and password are required').bail().notEmpty().withMessage('Token and password are required'),
  body('password').isString().withMessage('Password must be at least 6 characters')
    .bail().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/admin-access', adminAccessValidation, validateRequest, authController.adminAccess);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', emailValidation, validateRequest, authController.forgotPassword);
router.put('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);
router.put('/change-password', protect, authController.changePassword);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
