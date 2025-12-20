const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// User routes
router.post('/orders', protect, createOrder);
router.get('/orders', protect, getOrders);
router.get('/orders/:id', protect, getOrder);
router.patch('/orders/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/admin/orders', protect, authorize('admin'), getAllOrders);
router.patch('/admin/orders/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
