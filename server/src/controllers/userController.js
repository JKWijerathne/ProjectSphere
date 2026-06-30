import User from '../models/userModel.js';
import eventEmitter from '../events/eventEmitter.js';
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

// Follow/Unfollow (toggle) a user - emits UserFollowed when follow occurs
export const followUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, 'Invalid user ID format', 400);
    }

    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // Prevent self-following
    if (targetUserId.toString() === currentUserId.toString()) {
      return sendError(res, 'You cannot follow yourself', 400);
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return sendError(res, 'User not found', 404);
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    let followed = false;

    if (!isFollowing) {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await currentUser.save();
      await targetUser.save();
      followed = true;

      // Emit UserFollowed event
      eventEmitter.emit('UserFollowed', { followedUser: targetUser, follower: currentUser });
    } else {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId.toString()
      );

      await currentUser.save();
      await targetUser.save();
      followed = false;
    }

    sendResponse(res, 200, {
      success: true,
      followed,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Unfollow a user (explicit) - kept for backward-compatible routes
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
};
