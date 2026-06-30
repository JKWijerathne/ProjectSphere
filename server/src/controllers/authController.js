// Authentication controller - handles register, login, profile
import User from '../models/userModel.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { sendResponse, sendError } from '../utils/response.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

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
      return sendError(res, 'Invalid email or password', 401);
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
      return sendError(res, 'Invalid email or password', 401);
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
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        authProviders: user.authProviders,
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

    // Send response without password
    sendResponse(res, 200, {
      success: true,
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

// Google OAuth callback
export const googleCallback = (req, res) => {
  try {
    // User is attached by passport middleware
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/failure`);
    }

    // Generate JWT token
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/auth/failure`);
  }
};

// Logout user (client-side token deletion)
export const logout = (req, res) => {
  sendResponse(res, 200, {
    success: true,
    message: 'Logged out successfully'
  });
};
