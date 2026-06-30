import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect middleware - Verify JWT token and attach user to request
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Additional token format validation
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format',
        });
      }

      // Verify token with algorithm restriction
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });

      // Get user from token (exclude sensitive fields)
      req.user = await User.findById(decoded.id).select('-password -__v');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found. Token may be invalid.',
        });
      }

      // User authenticated successfully, proceed to next middleware
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);

      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. Please login again.',
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired. Please login again.',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Not authorized, token failed',
      });
    }
  }

  // No token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized. No token provided.',
    });
  }
};

// Optional auth middleware - Attach user if token exists
export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Validate token format
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256']
        });
        req.user = await User.findById(decoded.id).select('-password -__v');
      } else {
        req.user = null;
      }
    } catch (error) {
      // If token is invalid or expired, just continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }

  // Always proceed to next middleware
  next();
};
