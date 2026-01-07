const express = require('express');
const router = express.Router();
const {
    login,
    logout,
    refresh,
    signup,
    verifySignup,
    forgotPassword,
    resetPassword,
    updatePassword
} = require('../controllers/authController');
const { getProfile, updateProfile, getSavingsSummary } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/verify-signup', verifySignup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/savings-summary', protect, getSavingsSummary);
router.put('/update-password', protect, updatePassword);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);

module.exports = router;
