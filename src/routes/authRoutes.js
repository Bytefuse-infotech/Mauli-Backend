const express = require('express');
const router = express.Router();
const {
    // New OTP-based auth endpoints
    requestOtp,
    verifyOtp,
    resendOtp,
    // Common endpoints
    logout,
    refresh,
    getProfile,
    updateProfile,
    // Legacy endpoints (for backward compatibility)
    login,
    signup,
    verifySignup,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpRateLimit, checkOtpRateLimit } = require('../middleware/rateLimitMiddleware');

// New OTP-based authentication routes with rate limiting
router.post('/request-otp', otpRateLimit, requestOtp);
router.post('/verify-otp', verifyOtp);  // No rate limit on verification
router.post('/resend-otp', otpRateLimit, resendOtp);

// Check rate limit status (for UI)
router.get('/check-rate-limit', checkOtpRateLimit);

// Common routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);

// Legacy routes (backward compatibility - will redirect to OTP flow)
router.post('/signup', signup);
router.post('/verify-signup', verifySignup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/update-password', protect, updatePassword);

module.exports = router;
