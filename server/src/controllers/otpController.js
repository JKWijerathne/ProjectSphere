// OTP verification controller for secure registration
import PendingRegistration from '../models/pendingRegistration.js';
import User from '../models/userModel.js';
import { hashPassword } from '../utils/hashPassword.js';
import { generateToken } from '../utils/jwt.js';
import { sendResponse, sendError } from '../utils/response.js';
import { validateEmailForRole } from '../utils/emailDomainValidator.js';
import { 
  generateOTP, 
  hashOTP, 
  compareOTP, 
  getOTPExpiration, 
  getPendingRegistrationExpiration,
  isOTPExpired 
} from '../utils/otpGenerator.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/emailService.js';

// Maximum OTP attempts before blocking
const MAX_OTP_ATTEMPTS = 3;

// Register with OTP (Step 1: Create pending registration and send OTP)
export const registerWithOTP = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate email domain for role
    const domainValidation = validateEmailForRole(email, role);
    if (!domainValidation.valid) {
      return sendError(res, domainValidation.message, 400);
    }

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 400);
    }

    // Check if there's already a pending registration for this email
    const existingPending = await PendingRegistration.findOne({ email });
    if (existingPending) {
      // Delete old pending registration
      await PendingRegistration.deleteOne({ email });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    console.log(`🔐 Generated OTP for ${email}: ${otp}`); // For development

    // Hash the OTP before storing
    const hashedOTP = await hashOTP(otp);

    // Hash the password before storing (industry standard)
    const hashedPassword = await hashPassword(password);

    // Calculate expiration times
    const otpExpiresAt = getOTPExpiration(); // 2 minutes
    const expiresAt = getPendingRegistrationExpiration(); // 2 minutes

    // Create pending registration with hashed password and OTP
    const pendingReg = await PendingRegistration.create({
      name,
      email,
      password: hashedPassword, // Store hashed password
      role,
      authProviders: ['local'],
      otpHash: hashedOTP, // Store hashed OTP
      otpExpiresAt,
      otpAttempts: 0,
      expiresAt // MongoDB will auto-delete after 2 minutes
    });

    // Send OTP via email (non-blocking - allow registration even if email fails)
    try {
      await sendOTPEmail(email, otp, name);
      console.log('✅ OTP email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Email service error (continuing anyway):', emailError.message);
      // Don't fail registration if email fails - OTP is shown in console for development
      console.log('📧 OTP for development:', otp);
    }

    // Send success response
    sendResponse(res, 201, {
      success: true,
      message: 'Verification code sent to your email. Please verify within 2 minutes.',
      email: email,
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, error.message, 500);
  }
};

// Verify OTP (Step 2: Verify OTP and create permanent account)
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find pending registration with OTP hash
    const pendingReg = await PendingRegistration.findOne({ email }).select('+otpHash +password');
    
    if (!pendingReg) {
      return sendError(res, 'No pending registration found. Please register again.', 404);
    }

    // Check if OTP has expired
    if (isOTPExpired(pendingReg.otpExpiresAt)) {
      await PendingRegistration.deleteOne({ _id: pendingReg._id });
      return sendError(res, 'Verification code has expired. Please register again.', 400);
    }

    // Check if max attempts reached
    if (pendingReg.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await PendingRegistration.deleteOne({ _id: pendingReg._id });
      return sendError(res, 'Maximum verification attempts reached. Please register again.', 400);
    }

    // Compare OTP with hashed OTP (timing-attack safe)
    const isOTPValid = await compareOTP(otp, pendingReg.otpHash);

    if (!isOTPValid) {
      // Increment failed attempts
      pendingReg.otpAttempts += 1;
      await pendingReg.save();

      const attemptsLeft = MAX_OTP_ATTEMPTS - pendingReg.otpAttempts;
      return sendError(
        res, 
        `Invalid verification code. ${attemptsLeft} attempt(s) remaining.`, 
        400
      );
    }

    // OTP is valid! Create permanent user account

    // Transfer data from pending to permanent user (password already hashed)
    const user = await User.create({
      name: pendingReg.name,
      email: pendingReg.email,
      password: pendingReg.password, // Already hashed in pending registration
      role: pendingReg.role,
      profilePicture: pendingReg.profilePicture || '',
      authProviders: ['local']
    });

    // Delete pending registration
    await PendingRegistration.deleteOne({ _id: pendingReg._id });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name, user.role).catch(err => {
      console.error('Welcome email error:', err);
      // Don't fail registration if welcome email fails
    });

    // Send success response with token
    sendResponse(res, 201, {
      success: true,
      message: 'Account verified successfully! Welcome to ProjectSphere.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        authProviders: user.authProviders
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    sendError(res, error.message, 500);
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find pending registration
    const pendingReg = await PendingRegistration.findOne({ email });
    
    if (!pendingReg) {
      return sendError(res, 'No pending registration found. Please register again.', 404);
    }

    // Generate new OTP
    const otp = generateOTP();
    console.log(`🔐 Resent OTP for ${email}: ${otp}`); // For development

    // Hash new OTP
    const hashedOTP = await hashOTP(otp);

    // Update pending registration with new OTP
    pendingReg.otpHash = hashedOTP;
    pendingReg.otpExpiresAt = getOTPExpiration(); // Reset expiration
    pendingReg.otpAttempts = 0; // Reset attempts
    pendingReg.expiresAt = getPendingRegistrationExpiration(); // Reset document expiration
    await pendingReg.save();

    // Send new OTP via email
    try {
      await sendOTPEmail(email, otp, pendingReg.name);
    } catch (emailError) {
      return sendError(res, 'Failed to send verification email. Please try again.', 500);
    }

    // Send success response
    sendResponse(res, 200, {
      success: true,
      message: 'New verification code sent to your email.',
      expiresAt: pendingReg.expiresAt
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    sendError(res, error.message, 500);
  }
};

// Check pending registration status
export const checkPendingStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return sendError(res, 'Email is required', 400);
    }

    const pendingReg = await PendingRegistration.findOne({ email });
    
    if (!pendingReg) {
      return sendResponse(res, 200, {
        success: true,
        pending: false
      });
    }

    // Check if expired
    if (isOTPExpired(pendingReg.expiresAt)) {
      await PendingRegistration.deleteOne({ _id: pendingReg._id });
      return sendResponse(res, 200, {
        success: true,
        pending: false
      });
    }

    sendResponse(res, 200, {
      success: true,
      pending: true,
      email: pendingReg.email,
      name: pendingReg.name,
      role: pendingReg.role,
      expiresAt: pendingReg.expiresAt,
      attemptsLeft: MAX_OTP_ATTEMPTS - pendingReg.otpAttempts
    });
  } catch (error) {
    console.error('Check pending status error:', error);
    sendError(res, error.message, 500);
  }
};
