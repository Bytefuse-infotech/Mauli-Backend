const express = require('express');
const router = express.Router();
const { getSessions, getMySessions } = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// GET /api/v1/me/sessions
router.get('/me/sessions', getMySessions);

// GET /api/v1/admin/sessions
router.get('/admin/sessions', authorize('admin'), getSessions);

module.exports = router;
