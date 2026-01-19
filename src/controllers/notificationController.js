const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ recipient: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments({ recipient: req.user._id })
        ]);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            is_read: false
        });

        res.status(200).json({
            success: true,
            data: notifications,
            meta: {
                page,
                limit,
                total,
                unread_count: unreadCount,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.is_read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, is_read: false },
            { $set: { is_read: true } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification removed'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Helper function to create notification internally
// skipPush: Set to true when the caller already sent the push notification (e.g., admin manual push)
const createNotification = async (recipientId, title, message, type = 'system', data = {}, skipPush = false) => {
    try {
        // Create in-app notification record
        const notification = await Notification.create({
            recipient: recipientId,
            title,
            message,
            type,
            data
        });

        // Send FCM push notification asynchronously (unless skipPush is true)
        if (!skipPush) {
            (async () => {
                try {
                    const { sendPushNotification } = require('../utils/firebase');
                    const user = await User.findById(recipientId).select('fcm_tokens');

                    if (user && user.fcm_tokens && user.fcm_tokens.length > 0) {
                        const tokens = user.fcm_tokens.map(t => t.token);
                        await sendPushNotification(tokens, title, message, data);
                        console.log(`[FCM] Push sent for user ${recipientId}`);
                    }
                } catch (err) {
                    console.error('[FCM] Error sending push during createNotification:', err.message);
                }
            })();
        }

        return notification;
    } catch (error) {
        console.error('Error creating internal notification:', error);
        // We don't want to crash the request if notification creation fails
        return null;
    }
};



// @desc    Broadcast notification to all users
// @route   POST /api/v1/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res) => {
    try {
        const { title, message, type = 'promo', data = {} } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        // Get all active users
        const users = await User.find({ is_active: true }).select('_id');

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active users found to broadcast to'
            });
        }

        // Prepare notifications for bulk insert
        const notifications = users.map(user => ({
            recipient: user._id,
            title,
            message,
            type,
            data,
            is_read: false
        }));

        await Notification.insertMany(notifications);

        res.status(200).json({
            success: true,
            message: `Notification broadcasted to ${users.length} users`
        });
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    broadcastNotification
};
