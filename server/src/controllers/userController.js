// User controller - handles profile, follow/unfollow operations
import User from '../models/userModel.js';
import { sendResponse, sendError } from '../utils/response.js';

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Find user and populate followers/following
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .populate('followers', 'name email profilePicture')
      .populate('following', 'name email profilePicture');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendResponse(res, 200, {
      success: true,
      user
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Follow a user
export const followUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Check if trying to follow yourself
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot follow yourself', 400);
    }

    // Find both users
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return sendError(res, 'User not found', 404);
    }

    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      return sendError(res, 'You are already following this user', 400);
    }

    // Add to following and followers lists
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    // Save both users
    await currentUser.save();
    await userToFollow.save();

    // TODO: Create notification (Member 6 will implement)
    // eventEmitter.emit('UserFollowed', { follower: currentUser, following: userToFollow });

    sendResponse(res, 200, {
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Check if trying to unfollow yourself
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'Invalid operation', 400);
    }

    // Find both users
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return sendError(res, 'User not found', 404);
    }

    // Check if not following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return sendError(res, 'You are not following this user', 400);
    }

    // Remove from following and followers lists
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    // Save both users
    await currentUser.save();
    await userToUnfollow.save();

    sendResponse(res, 200, {
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get user's followers
export const getUserFollowers = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Find user and populate followers
    const user = await User.findById(req.params.id)
      .populate('followers', 'name email profilePicture role');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendResponse(res, 200, {
      success: true,
      count: user.followers.length,
      followers: user.followers
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get user's following
export const getUserFollowing = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    // Find user and populate following
    const user = await User.findById(req.params.id)
      .populate('following', 'name email profilePicture role');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendResponse(res, 200, {
      success: true,
      count: user.following.length,
      following: user.following
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
