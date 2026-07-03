// Authentication controller - handles register, login, profile
import crypto from 'crypto';
import User from '../models/userModel.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { sendResponse, sendError } from '../utils/response.js';
import { validateEmailForRole } from '../utils/emailDomainValidator.js';
import { uploadSingleImage } from '../utils/cloudinaryHelper.js';
import { removeAllUserData } from '../utils/userCleanup.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
  authProviders: user.authProviders,
  createdAt: user.createdAt,
});

const getAllowedFrontendUrl = (origin) => {
  const fallbackUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.VITE_CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  if (
    process.env.NODE_ENV !== 'production'
    && typeof origin === 'string'
    && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  ) {
    return origin;
  }

  return fallbackUrl;
};

// Register new user (DEPRECATED - Use OTP flow instead)
// This is kept for backward compatibility but should use /auth/register-otp
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate email domain for role
    const domainValidation = validateEmailForRole(email, role);
    if (!domainValidation.valid) {
      return sendError(res, domainValidation.message, 400);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists with this email', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with hashed password and local auth provider
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Student',
      authProviders: ['local'] // User registered with email+password
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response without password
    sendResponse(res, 201, {
      success: true,
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
    sendError(res, error.message, 500);
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'invalid username or password', 401);
    }

    // Check if user has password (supports local auth)
    if (!user.password) {
      return sendError(res, 'This account uses Google Sign-In only. Please login with Google.', 401);
    }

    // Check if local auth is enabled for this user
    if (!user.authProviders.includes('local')) {
      return sendError(res, 'This account uses Google Sign-In only. Please login with Google.', 401);
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return sendError(res, 'invalid username or password', 401);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response without password
    sendResponse(res, 200, {
      success: true,
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
    sendError(res, error.message, 500);
  }
};

// Get current logged in user
export const getMe = async (req, res) => {
  try {
    // User is already attached by protect middleware
    const user = await User.findById(req.user._id).select('-password -__v');

    sendResponse(res, 200, {
      success: true,
      user: {
        ...formatUserResponse(user),
        followers: user.followers,
        following: user.following
      }
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Update fields
    if (name) {
      user.name = name.trim();
    }
    
    if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    sendResponse(res, 200, {
      success: true,
      user: formatUserResponse(user)
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Change password for local auth accounts
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.password || !user.authProviders.includes('local')) {
      return sendError(res, 'Password change is not available for Google-only accounts', 400);
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    sendResponse(res, 200, {
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Request a password reset email for local auth accounts
export const forgotPassword = async (req, res) => {
  try {
    const { email, origin } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const genericMessage = 'If an email/password account exists for that email, a reset link has been sent.';

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordResetToken +passwordResetExpires');

    if (!user || !user.authProviders.includes('local')) {
      return sendResponse(res, 200, {
        success: true,
        message: genericMessage
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = getAllowedFrontendUrl(origin);
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw error;
    }

    sendResponse(res, 200, {
      success: true,
      message: genericMessage
    });
  } catch (error) {
    sendError(res, error.message || 'Unable to send password reset email', 500);
  }
};

// Reset password using a valid email token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      return sendError(res, 'Password reset link is invalid or has expired', 400);
    }

    if (!user.authProviders.includes('local')) {
      return sendError(res, 'Password reset is not available for Google-only accounts', 400);
    }

    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendResponse(res, 200, {
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    sendError(res, error.message || 'Unable to reset password', 500);
  }
};

// Upload profile picture
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const imageUrl = await uploadSingleImage(req.file, 'projectsphere/avatars');
    user.profilePicture = imageUrl;
    await user.save();

    sendResponse(res, 200, {
      success: true,
      user: formatUserResponse(user)
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Remove profile picture
export const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.profilePicture = '';
    await user.save();

    sendResponse(res, 200, {
      success: true,
      message: 'Profile picture removed successfully',
      user: formatUserResponse(user)
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Google OAuth callback
export const googleCallback = (req, res) => {
  const state = req.query.state;
  const frontendUrl = state || process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    // User is attached by passport middleware
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
    }

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication error occurred')}`);
  }
};

// Logout user (client-side token deletion)
export const logout = (req, res) => {
  sendResponse(res, 200, {
    success: true,
    message: 'Logged out successfully'
  });
};

// Delete current user's account and all associated data
export const deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const cleanup = await removeAllUserData(user._id, user.email);

    sendResponse(res, 200, {
      success: true,
      message: 'Your account and all associated data have been deleted successfully',
      cleanup,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
