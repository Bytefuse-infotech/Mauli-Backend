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
router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.patch('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/admin/orders', protect, authorize('admin'), getAllOrders);
router.patch('/admin/orders/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
