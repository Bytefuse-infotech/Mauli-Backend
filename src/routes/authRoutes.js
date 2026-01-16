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
    // Legacy endpoints (for backward compatibility)
    signup,
    verifySignup,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/authController');
const { getSavingsSummary } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Password-based authentication routes (primary)
router.post('/login', login);
router.post('/register', register);

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
