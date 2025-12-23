/**
 * FCM Push Notification Routes
 */
const express = require('express');
const router = express.Router();
const {
    updateFcmToken,
    removeFcmToken,
    sendPushToUser,
    sendPushToAll,
    getUsersWithFcmTokens,
    getFcmStatus
} = require('../controllers/fcmController');
const { protect, authorize } = require('../middleware/authMiddleware');

// User routes (for updating/removing tokens)
router.post('/fcm-token', protect, updateFcmToken);
router.delete('/fcm-token', protect, removeFcmToken);

// Admin routes (for sending push notifications)
router.post('/admin/push-notifications/send-to-user', protect, authorize('admin', 'manager'), sendPushToUser);
router.post('/admin/push-notifications/send-to-all', protect, authorize('admin', 'manager'), sendPushToAll);
router.get('/admin/push-notifications/users', protect, authorize('admin', 'manager'), getUsersWithFcmTokens);
router.get('/admin/push-notifications/status', protect, authorize('admin', 'manager'), getFcmStatus);

module.exports = router;
