// Authentication input validation using express-validator
import { body, validationResult } from 'express-validator';

// Validation error handler - returns errors in standardized format
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Extract first error message for cleaner response
    const firstError = errors.array()[0].msg;
    return res.status(400).json({
      success: false,
      error: firstError,
      errors: errors.array() // Include all errors for debugging
    });
  }
  
  next();
};

// Register validation rules
export const validateRegister = [
  // Name validation
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(), // XSS prevention

  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please use a verified email address to continue')
    .normalizeEmail() // Normalize email format
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // Confirm password validation
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  // Role validation (optional)
  body('role')
    .optional()
    .trim()
    .isIn(['Student', 'Lecturer', 'Recruiter'])
    .withMessage('Role must be Student, Lecturer, or Recruiter')
    .escape(),

  handleValidationErrors
];

// Login validation rules
export const validateLogin = [
  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please use a verified email address to continue')
    .normalizeEmail(),

  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  handleValidationErrors
];

// Update profile validation rules
export const validateUpdateProfile = [
  // Name validation (optional)
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(),

  // Profile picture validation (optional)
  body('profilePicture')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Profile picture must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Profile picture URL must not exceed 500 characters'),

  // Custom validation: at least one field must be provided
  body()
    .custom((_value, { req }) => {
      if (!req.body.name && !req.body.profilePicture) {
        throw new Error('Please provide at least one field to update');
      }
      return true;
    }),

  handleValidationErrors
];

// Update user role validation (admin only)
export const validateUpdateRole = [
  // Role validation
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['Student', 'Lecturer', 'Recruiter'])
    .withMessage('Role must be Student, Lecturer, or Recruiter')
    .escape(),

  handleValidationErrors
];

// OTP verification validation
export const validateOTPVerification = [
  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please use a verified email address to continue')
    .normalizeEmail(),

  // OTP validation
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP code must contain only numbers'),

  handleValidationErrors
];

// Change password validation rules
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('newPassword')
    .custom((value, { req }) => {
      if (value && req.body.currentPassword && value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  handleValidationErrors
];

// Forgot password validation
export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please use a verified email address to continue')
    .normalizeEmail(),

  handleValidationErrors
];

// Reset password validation
export const validateResetPassword = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  handleValidationErrors
];

// Resend OTP validation
export const validateResendOTP = [
  // Email validation
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please use a verified email address to continue')
    .normalizeEmail(),

  handleValidationErrors
];
