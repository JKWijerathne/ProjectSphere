// OTP verification routes for secure registration
import express from 'express';
import { 
  registerWithOTP, 
  verifyOTP, 
  resendOTP, 
  checkPendingStatus 
} from '../controllers/otpController.js';
import { 
  validateRegister, 
  validateOTPVerification, 
  validateResendOTP 
} from '../validations/authValidation.js';
import rateLimit from 'express-rate-limit';

const otpRouter = express.Router();

// Rate limiter for OTP registration (prevent spam)
const otpRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 registration attempts per hour per IP (increased from 3)
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for OTP verification (prevent brute force)
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 verification attempts per 15 minutes (increased from 10)
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for resend OTP (prevent spam)
const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 resend attempts per 5 minutes (increased from 3)
  message: {
    success: false,
    error: 'Too many resend requests. Please wait 5 minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/otp/register - Register with OTP (Step 1)
otpRouter.post('/register', otpRegisterLimiter, validateRegister, registerWithOTP);

// POST /api/otp/verify - Verify OTP and create account (Step 2)
otpRouter.post('/verify', otpVerifyLimiter, validateOTPVerification, verifyOTP);

// POST /api/otp/resend - Resend OTP code
otpRouter.post('/resend', otpResendLimiter, validateResendOTP, resendOTP);

// GET /api/otp/status - Check pending registration status
otpRouter.get('/status', checkPendingStatus);

export default otpRouter;
