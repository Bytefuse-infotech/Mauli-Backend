/**
 * FCM Push Notification Controller
 * Handles Firebase Cloud Messaging push notifications
 */
const User = require('../models/User');
const { sendPushNotification, getFirebaseAdmin } = require('../utils/firebase');
const { createNotification } = require('./notificationController');

/**
 * @desc    Update user's FCM token
 * @route   POST /api/v1/users/fcm-token
 * @access  Private
 */
const updateFcmToken = async (req, res) => {
    try {
        const { token, device_info } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if token already exists
        const existingTokenIndex = user.fcm_tokens?.findIndex(t => t.token === token);

        if (existingTokenIndex >= 0) {
            // Update existing token's timestamp
            user.fcm_tokens[existingTokenIndex].created_at = new Date();
            if (device_info) {
                user.fcm_tokens[existingTokenIndex].device_info = device_info;
            }
        } else {
            // Add new token
            if (!user.fcm_tokens) {
                user.fcm_tokens = [];
            }
            user.fcm_tokens.push({
                token,
                device_info: device_info || 'Unknown',
                created_at: new Date()
            });
        }

        // Keep only the last 5 tokens per user (for multiple devices)
        if (user.fcm_tokens.length > 5) {
            user.fcm_tokens = user.fcm_tokens.slice(-5);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'FCM token updated successfully'
        });
    } catch (error) {
        console.error('Error updating FCM token:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * @desc    Remove FCM token (on logout)
 * @route   DELETE /api/v1/users/fcm-token
 * @access  Private
 */
const removeFcmToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { fcm_tokens: { token } }
        });

        res.status(200).json({
            success: true,
            message: 'FCM token removed successfully'
        });
    } catch (error) {
        console.error('Error removing FCM token:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * @desc    Send push notification to a specific user
 * @route   POST /api/v1/admin/push-notifications/send-to-user
 * @access  Private/Admin
 */
const sendPushToUser = async (req, res) => {
    try {
        const { userId, title, body, data = {} } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'userId, title, and body are required'
            });
        }

        const user = await User.findById(userId).select('fcm_tokens name');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const tokens = user.fcm_tokens?.map(t => t.token).filter(Boolean) || [];

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User has no registered FCM tokens'
            });
        }

        const result = await sendPushNotification(tokens, title, body, data);

        // Also create in-app notification (skipPush=true since we already sent it above)
        await createNotification(userId, title, body, 'system', data, true);

        // Clean up failed tokens
        if (result.failedTokens && result.failedTokens.length > 0) {
            await User.findByIdAndUpdate(userId, {
                $pull: { fcm_tokens: { token: { $in: result.failedTokens } } }
            });
        }

        res.status(200).json({
            success: true,
            message: `Push notification sent to ${user.name}`,
            details: result
        });
    } catch (error) {
        console.error('Error sending push to user:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * @desc    Send push notification to all users with FCM tokens
 * @route   POST /api/v1/admin/push-notifications/send-to-all
 * @access  Private/Admin
 */
const sendPushToAll = async (req, res) => {
    try {
        const { title, body, data = {}, type = 'promo' } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'title and body are required'
            });
        }

        // Get all users with FCM tokens
        const users = await User.find({
            is_active: true,
            'fcm_tokens.0': { $exists: true }
        }).select('_id fcm_tokens');

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No users with FCM tokens found'
            });
        }

        // Collect all tokens
        const allTokens = [];
        const userTokenMap = new Map(); // For tracking which tokens belong to which users

        users.forEach(user => {
            user.fcm_tokens.forEach(t => {
                if (t.token) {
                    allTokens.push(t.token);
                    userTokenMap.set(t.token, user._id);
                }
            });
        });

        // Send in batches (FCM supports max 500 tokens per request)
        const batchSize = 500;
        let totalSuccess = 0;
        let totalFailure = 0;
        const allFailedTokens = [];

        for (let i = 0; i < allTokens.length; i += batchSize) {
            const batch = allTokens.slice(i, i + batchSize);
            const result = await sendPushNotification(batch, title, body, data);

            if (result.success) {
                totalSuccess += result.successCount || 0;
                totalFailure += result.failureCount || 0;
                if (result.failedTokens) {
                    allFailedTokens.push(...result.failedTokens);
                }
            }
        }

        // Also create in-app notifications for all users
        const { broadcastNotification } = require('./notificationController');
        // Create a mock req/res for internal broadcast
        const mockReq = {
            body: { title, message: body, type, data }
        };
        const mockRes = {
            status: () => ({ json: () => { } })
        };
        await broadcastNotification(mockReq, mockRes);

        // Clean up failed tokens
        if (allFailedTokens.length > 0) {
            await User.updateMany(
                {},
                { $pull: { fcm_tokens: { token: { $in: allFailedTokens } } } }
            );
        }

        res.status(200).json({
            success: true,
            message: `Push notification sent to ${users.length} users`,
            details: {
                totalTokens: allTokens.length,
                successCount: totalSuccess,
                failureCount: totalFailure,
                usersReached: users.length
            }
        });
    } catch (error) {
        console.error('Error broadcasting push notification:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * @desc    Get users with FCM tokens (for admin dropdown)
 * @route   GET /api/v1/admin/push-notifications/users
 * @access  Private/Admin
 */
const getUsersWithFcmTokens = async (req, res) => {
    try {
        const users = await User.find({
            is_active: true,
            'fcm_tokens.0': { $exists: true }
        }).select('_id name email phone fcm_tokens');

        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            deviceCount: user.fcm_tokens?.length || 0
        }));

        res.status(200).json({
            success: true,
            data: formattedUsers,
            total: formattedUsers.length
        });
    } catch (error) {
        console.error('Error fetching users with FCM tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

/**
 * @desc    Check FCM configuration status
 * @route   GET /api/v1/admin/push-notifications/status
 * @access  Private/Admin
 */
const getFcmStatus = async (req, res) => {
    try {
        const admin = getFirebaseAdmin();
        const isConfigured = admin !== null;

        const usersWithTokens = await User.countDocuments({
            'fcm_tokens.0': { $exists: true }
        });

        res.status(200).json({
            success: true,
            data: {
                fcmConfigured: isConfigured,
                usersWithTokens
            }
        });
    } catch (error) {
        console.error('Error checking FCM status:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    updateFcmToken,
    removeFcmToken,
    sendPushToUser,
    sendPushToAll,
    getUsersWithFcmTokens,
    getFcmStatus
};
