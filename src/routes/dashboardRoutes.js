const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentOrders } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin Dashboard Routes
router.get('/admin/dashboard/stats', protect, authorize('admin', 'manager'), getDashboardStats);
router.get('/admin/dashboard/recent-orders', protect, authorize('admin', 'manager'), getRecentOrders);

module.exports = router;
