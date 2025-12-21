const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getKey } = require('../controllers/razorpayController');
const { protect } = require('../middleware/authMiddleware');

// Get Razorpay public key - Public route
router.get('/key', getKey);

// Create Razorpay order - Protected route
router.post('/order', protect, createOrder);

// Verify payment signature - Protected route
router.post('/verify', protect, verifyPayment);

module.exports = router;
