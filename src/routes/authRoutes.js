const express = require('express');
const router = express.Router();
const {
    // OTP-based auth endpoints
    requestOtp,
    verifyOtp,
    resendOtp,
    // Common endpoints
    logout,
    refresh,
    getProfile,
    updateProfile
} = require('../controllers/authController');
const { getSavingsSummary } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { otpRateLimit, checkOtpRateLimit } = require('../middleware/rateLimitMiddleware');
const OtpAttempt = require('../models/OtpAttempt');

// OTP-based authentication routes with rate limiting
router.post('/request-otp', otpRateLimit, requestOtp);
router.post('/verify-otp', verifyOtp);  // No rate limit on verification
router.post('/resend-otp', otpRateLimit, resendOtp);

// Check rate limit status (for UI)
router.get('/check-rate-limit', checkOtpRateLimit);

// Development only: Clear rate limits (remove in production!)
router.delete('/clear-rate-limits', async (req, res) => {
    try {
        const result = await OtpAttempt.deleteMany({});
        res.json({ success: true, message: `Cleared ${result.deletedCount} rate limit records` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Common routes
router.get('/profile', protect, getProfile);
router.get('/savings-summary', protect, getSavingsSummary);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);

module.exports = router;

