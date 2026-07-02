import express from 'express';
import { getNotifications, markAllAsRead, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const notificationRouter = express.Router();

// All notification routes require authentication
notificationRouter.use(protect);

// GET /api/notifications - Fetch user's notifications
notificationRouter.get('/', getNotifications);

// PUT /api/notifications/read-all - Mark all notifications as read
notificationRouter.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read - Mark notification as read
notificationRouter.put('/:id/read', markAsRead);

export default notificationRouter;
