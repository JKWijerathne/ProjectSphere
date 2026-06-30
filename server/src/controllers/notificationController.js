import Notification from '../models/notificationModel.js';

/**
 * GET /notifications - Get all notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'name profilePicture email')
            .populate('relatedProject', 'title thumbnail')
            .sort({ createdAt: -1 });

        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT /notifications/:id/read - Mark notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to read this notification' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
