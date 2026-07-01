// Authentication routes with Google OAuth support
import express from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  getMe, 
  updateProfile,
  changePassword,
  updateProfilePicture,
  googleCallback,
  logout,
  deleteMyAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { 
  validateRegister, 
  validateLogin, 
  validateUpdateProfile,
  validateChangePassword
} from '../validations/authValidation.js';
import rateLimit from 'express-rate-limit';

const authRouter = express.Router();

// Rate limiter for auth routes - prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window (increased from 5)
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
  max: 50, // 50 registrations per hour (increased from 3)
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
    (req, res, next) => {
      const origin = req.query.origin || process.env.CLIENT_URL || 'http://localhost:5173';
      passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false, // We use JWT, not sessions
        state: origin // roundtrip origin via state parameter
      })(req, res, next);
    }
  );

  // GET /api/auth/google/callback - Google OAuth callback
  authRouter.get('/google/callback',
    (req, res, next) => {
      passport.authenticate('google', { session: false }, (err, user, info) => {
        const state = req.query.state;
        const frontendUrl = state || process.env.CLIENT_URL || 'http://localhost:5173';
        if (err) {
          // Error occurred during authentication
          console.error('Google OAuth authentication error:', err);
          return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
        }
        
        if (!user) {
          // Authentication failed (no user returned)
          const errorMessage = info?.message || 'Google authentication failed';
          console.log('Google OAuth failed:', errorMessage);
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

// PUT /api/auth/password - Change password
authRouter.put('/password', protect, validateChangePassword, changePassword);

// PATCH /api/auth/profile-picture - Upload profile picture
authRouter.patch('/profile-picture', protect, upload.single('image'), updateProfilePicture);

// POST /api/auth/logout - Logout user (client-side token deletion)
authRouter.post('/logout', protect, logout);

// DELETE /api/auth/account - Delete current user account
authRouter.delete('/account', protect, deleteMyAccount);

export default authRouter;
