const express = require('express');
const router = express.Router();
const { getContent, getAllContent, updateContent } = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.get('/:key', getContent);

// Admin
router.get('/admin/all', protect, authorize('admin', 'manager'), getAllContent);
router.put('/admin/:key', protect, authorize('admin', 'manager'), updateContent);

module.exports = router;
