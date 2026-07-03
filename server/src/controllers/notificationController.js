import Notification from '../models/notificationModel.js';

/**
 * GET /notifications - Get all notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ recipient: req.user._id })
                .populate('sender', 'name profilePicture email role')
                .populate('relatedProject', 'title thumbnail status')
                .sort({ createdAt: -1 })
                .limit(30),
            Notification.countDocuments({ recipient: req.user._id, isRead: false })
        ]);

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT /notifications/:id/read - Mark notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        )
            .populate('sender', 'name profilePicture email role')
            .populate('relatedProject', 'title thumbnail status');

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.json({ success: true, notification, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT /notifications/read-all - Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, unreadCount: 0 });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
