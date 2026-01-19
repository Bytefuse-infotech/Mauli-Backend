const express = require('express');
const router = express.Router();
const {
    // Common endpoints
    logout,
    refresh,
    getProfile,
    updateProfile,
    // Password-based auth
    login,
    register,
    checkUserExists,
    // Firebase phone OTP auth
    firebaseLogin,
    // OTP-based password reset
    resetPasswordOtp,
    // Legacy endpoints (for backward compatibility)
    signup,
    verifySignup,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/authController');
const { getSavingsSummary } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Firebase phone OTP authentication (primary for customers)
router.post('/firebase-login', firebaseLogin);

// Check if user exists (before OTP signup)
router.post('/check-user', checkUserExists);

// Password-based authentication routes (for admin/legacy)
router.post('/login', login);
router.post('/register', register);

// OTP-based password reset
router.post('/reset-password-otp', resetPasswordOtp);

// Common routes
router.get('/profile', protect, getProfile);
router.get('/savings-summary', protect, getSavingsSummary);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);

// Legacy routes (backward compatibility)
router.post('/signup', signup);
router.post('/verify-signup', verifySignup);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/update-password', protect, updatePassword);

module.exports = router;

