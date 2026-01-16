const express = require('express');
const router = express.Router();
const { adminLogin, setAdminPassword } = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin authentication routes
router.post('/login', adminLogin);

// Protected route to set admin password (admin only)
router.post('/set-password', protect, authorize('admin'), setAdminPassword);

module.exports = router;
