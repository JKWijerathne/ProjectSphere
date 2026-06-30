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
authRouter.post('/register', registerLimiter, register);

// POST /api/auth/login - Login with email and password
authRouter.post('/login', authLimiter, login);

// Google OAuth routes
// GET /api/auth/google - Initiate Google OAuth flow
authRouter.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // We use JWT, not sessions
  })
);

// GET /api/auth/google/callback - Google OAuth callback
authRouter.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/failure',
    session: false
  }),
  googleCallback
);

// GET /api/auth/failure - OAuth failure handler
authRouter.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'Google authentication failed. Please try again.'
  });
});

// Protected routes - Require authentication
// GET /api/auth/me - Get current user profile
authRouter.get('/me', protect, getMe);

// PUT /api/auth/profile - Update user profile
authRouter.put('/profile', protect, updateProfile);

// POST /api/auth/logout - Logout user (client-side token deletion)
authRouter.post('/logout', protect, logout);

export default authRouter;
