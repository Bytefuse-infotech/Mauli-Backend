const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin Dashboard Routes
router.get('/admin/dashboard/stats', protect, authorize('admin', 'manager'), getDashboardStats);

module.exports = router;
