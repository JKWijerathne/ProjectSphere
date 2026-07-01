// Authentication routes with Google OAuth support
import express from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  googleCallback,
  logout 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  validateRegister, 
  validateLogin, 
  validateUpdateProfile 
} from '../validations/authValidation.js';
import rateLimit from 'express-rate-limit';

const authRouter = express.Router();

// Rate limiter for auth routes - prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

// Rate limiter for registration - prevent spam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    success: false,
    error: 'Too many accounts created. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes - No authentication required
// POST /api/auth/register - Register new user
authRouter.post('/register', registerLimiter, validateRegister, register);

// POST /api/auth/login - Login with email and password
authRouter.post('/login', authLimiter, validateLogin, login);

// Google OAuth routes - Only register if Google OAuth is configured
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleConfigured) {
  // GET /api/auth/google - Initiate Google OAuth flow
  authRouter.get('/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false // We use JWT, not sessions
    })
  );

  // GET /api/auth/google/callback - Google OAuth callback
  authRouter.get('/google/callback',
    (req, res, next) => {
      passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) {
          // Error occurred during authentication
          console.error('Google OAuth authentication error:', err);
          const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
          return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
        }
        
        if (!user) {
          // Authentication failed (no user returned)
          const errorMessage = info?.message || 'Google authentication failed';
          console.log('Google OAuth failed:', errorMessage);
          const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
          return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`);
        }
        
        // Success - attach user to request and continue to googleCallback
        req.user = user;
        next();
      })(req, res, next);
    },
    googleCallback
  );
} else {
  // Return error if Google OAuth is not configured
  authRouter.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured on this server. Please use email/password registration.'
    });
  });

  authRouter.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured on this server.'
    });
  });

  authRouter.get('/google/failure', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured on this server.'
    });
  });
}

// Protected routes - Require authentication
// GET /api/auth/me - Get current user profile
authRouter.get('/me', protect, getMe);

// PUT /api/auth/profile - Update user profile
authRouter.put('/profile', protect, validateUpdateProfile, updateProfile);

// POST /api/auth/logout - Logout user (client-side token deletion)
authRouter.post('/logout', protect, logout);

export default authRouter;
