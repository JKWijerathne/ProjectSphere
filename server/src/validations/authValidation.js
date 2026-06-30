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
    .withMessage('Please provide a valid email address')
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
    .withMessage('Please provide a valid email address')
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
