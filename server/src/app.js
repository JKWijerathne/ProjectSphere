// Authentication routes with Google OAuth support
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { forgotPassword, resetPassword } from './controllers/authController.js';
import { validateForgotPassword, validateResetPassword } from './validations/authValidation.js';

// Import and register event listeners
import { initNotificationEvents } from './events/notificationEvents.js';
import './events/projectEvents.js';

// Initialize the event-driven notification systems
initNotificationEvents();

const app = express();

// CORS Configuration - Allow localhost frontend origins during development
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VITE_CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    const isLocalDevOrigin = (
      process.env.NODE_ENV !== 'production'
      && typeof origin === 'string'
      && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    );

    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data
app.use(passport.initialize()); // Initialize Passport for OAuth
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// Password reset compatibility endpoints.
// These are registered directly to avoid proxy/base-path mismatches in local dev.
app.post(
  ['/api/auth/forgot-password', '/auth/forgot-password', '/api/forgot-password', '/forgot-password'],
  validateForgotPassword,
  forgotPassword
);

app.put(
  ['/api/auth/reset-password/:token', '/auth/reset-password/:token', '/api/reset-password/:token', '/reset-password/:token'],
  validateResetPassword,
  resetPassword
);

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/otp', otpRoutes); // OTP verification routes
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware - must be after routes
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Passport authentication errors
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      success: false,
      error: err.message || 'Authentication failed'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry. This record already exists.'
      });
    }
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const getFrontendRedirectBase = (req) => {
  const fallbackUrl = process.env.CLIENT_URL || process.env.VITE_CLIENT_URL || 'http://localhost:5173';
  const referer = req.get('referer');

  if (process.env.NODE_ENV !== 'production' && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(refererOrigin)) {
        return refererOrigin;
      }
    } catch {
      return fallbackUrl;
    }
  }

  return fallbackUrl;
};

const frontendPageRoutes = [
  /^\/forgot-password\/?$/,
  /^\/reset-password\/[^/]+\/?$/,
  /^\/auth\/google\/callback\/?$/,
  /^\/login\/?$/,
  /^\/register\/?$/
];

// Redirect frontend page URLs that accidentally hit the API server.
app.use((req, res, next) => {
  if (req.method === 'GET' && frontendPageRoutes.some((pattern) => pattern.test(req.path))) {
    return res.redirect(`${getFrontendRedirectBase(req)}${req.originalUrl}`);
  }

  next();
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

export default app;
