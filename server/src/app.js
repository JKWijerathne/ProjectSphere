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

// Import and register event listeners
import { initNotificationEvents } from './events/notificationEvents.js';
import './events/projectEvents.js';

// Initialize the event-driven notification systems
initNotificationEvents();

const app = express();

// CORS Configuration - Allow frontend origin
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
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

// Routes Registration
app.use('/api/auth', authRoutes); 
app.use('/api/otp', otpRoutes); // OTP verification routes
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

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

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

export default app;
