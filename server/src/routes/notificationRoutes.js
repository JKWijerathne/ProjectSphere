import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const notificationRouter = express.Router();

// All notification routes require authentication
notificationRouter.use(protect);

// GET /api/notifications - Fetch user's notifications
notificationRouter.get('/', getNotifications);

// PUT /api/notifications/:id/read - Mark notification as read
notificationRouter.put('/:id/read', markAsRead);

export default notificationRouter;
