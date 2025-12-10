const express = require('express');
const router = express.Router();
const { login, logout, refresh } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);

module.exports = router;
