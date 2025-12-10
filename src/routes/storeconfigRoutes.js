const express = require('express');
const router = express.Router();
const {
    getStoreConfig,
    updateStoreConfig,
    computeCartTotal,
    reserveSlot
} = require('../controllers/storeconfigController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Routes
router.get('/storeconfig', getStoreConfig);
router.post('/storeconfig/compute', computeCartTotal);
router.post('/storeconfig/reserve-slot', reserveSlot);

// Admin Routes
router.put('/storeconfig', protect, authorize('admin'), updateStoreConfig);

module.exports = router;
