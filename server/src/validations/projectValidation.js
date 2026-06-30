// Project input validation using express-validator
import { body, param, query, validationResult } from 'express-validator';

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

// Create project validation rules
export const validateCreateProject = [
  // Title validation
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(), // XSS prevention

  // Description validation
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Project description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .escape(),

  // Technologies validation (optional array or comma-separated string)
  body('technologies')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        // If string, split by comma and validate
        const techs = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
        if (techs.length > 20) {
          throw new Error('Maximum 20 technologies allowed');
        }
        return true;
      } else if (Array.isArray(value)) {
        if (value.length > 20) {
          throw new Error('Maximum 20 technologies allowed');
        }
        return true;
      }
      throw new Error('Technologies must be an array or comma-separated string');
    }),

  // Category validation (optional)
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
    .escape(),

  // GitHub URL validation (optional)
  body('githubUrl')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('GitHub URL must be a valid URL')
    .matches(/^https?:\/\/(www\.)?github\.com\//)
    .withMessage('GitHub URL must be from github.com domain')
    .isLength({ max: 500 })
    .withMessage('GitHub URL must not exceed 500 characters'),

  handleValidationErrors
];

// Update project validation rules
export const validateUpdateProject = [
  // Project ID validation
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID format'),

  // Title validation (optional for update)
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .escape(),

  // Description validation (optional for update)
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .escape(),

  // Technologies validation (optional)
  body('technologies')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const techs = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
        if (techs.length > 20) {
          throw new Error('Maximum 20 technologies allowed');
        }
        return true;
      } else if (Array.isArray(value)) {
        if (value.length > 20) {
          throw new Error('Maximum 20 technologies allowed');
        }
        return true;
      }
      throw new Error('Technologies must be an array or comma-separated string');
    }),

  // Category validation (optional)
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
    .escape(),

  // GitHub URL validation (optional)
  body('githubUrl')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('GitHub URL must be a valid URL')
    .matches(/^https?:\/\/(www\.)?github\.com\//)
    .withMessage('GitHub URL must be from github.com domain')
    .isLength({ max: 500 })
    .withMessage('GitHub URL must not exceed 500 characters'),

  handleValidationErrors
];

// Get project by ID validation
export const validateProjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID format'),

  handleValidationErrors
];

// Search projects validation
export const validateSearchProjects = [
  // Search query validation (optional)
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(),

  // Category filter validation (optional)
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
    .escape(),

  handleValidationErrors
];

// Update project status validation (admin/lecturer only)
export const validateUpdateProjectStatus = [
  // Project ID validation
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID format'),

  // Status validation
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Pending', 'Approved', 'Rejected'])
    .withMessage('Status must be Pending, Approved, or Rejected')
    .escape(),

  // Optional rejection reason
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters')
    .escape(),

  handleValidationErrors
];

// Add comment validation
export const validateAddComment = [
  // Project ID validation
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID format'),

  // Comment text validation
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
    .escape(),

  handleValidationErrors
];
