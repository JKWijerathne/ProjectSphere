import express from 'express';
import {
  followUser,
  getUserFollowers,
  getUserFollowing,
  unfollowUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

// All user routes require authentication
userRouter.use(protect);

// POST /api/users/:id/follow - Follow/Unfollow a user
userRouter.post('/:id/follow', followUser);

// DELETE /api/users/:id/follow - Explicitly unfollow a user
userRouter.delete('/:id/follow', unfollowUser);

// GET /api/users/:id/followers - Get user's followers
userRouter.get('/:id/followers', getUserFollowers);

// GET /api/users/:id/following - Get user's following
userRouter.get('/:id/following', getUserFollowing);

export default userRouter;
