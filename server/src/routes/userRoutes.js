import express from 'express';
import { followUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const userRouter = express.Router();

// All user routes require authentication
userRouter.use(protect);

// POST /api/users/:id/follow - Follow/Unfollow a user
userRouter.post('/:id/follow', followUser);

export default userRouter;
