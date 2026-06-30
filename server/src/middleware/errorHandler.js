/**
 * Global error handling middleware
 * Catches all errors and sends consistent error responses
 * 
 * IMPORTANT: This should be the LAST middleware in app.js
 */

/**
 * Main error handler middleware
 * Handles various types of errors with appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use a proper logging service)
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ ERROR:', err.name);
  console.error('Message:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation Error';
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      details: errors,
    });
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      field: field,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
    
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
    
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large. Maximum size is 5MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected field: ${err.field}`;
    } else {
      message = err.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    statusCode = 503;
    message = 'Database connection error. Please try again later.';
    
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  // Default error response
  const response = {
    success: false,
    error: message,
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Catches all requests to undefined routes
 * 
 * IMPORTANT: Place this BEFORE the errorHandler middleware in app.js
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  res.status(404);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 * Eliminates the need for try-catch in every async route
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/projects', asyncHandler(async (req, res) => {
 *   const projects = await Project.find();
 *   res.json({ success: true, projects });
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application errors
 * Use this to throw errors with specific status codes
 * 
 * @example
 * throw new AppError('Project not found', 404);
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
