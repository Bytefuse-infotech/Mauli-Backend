const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const { uploadImage, uploadImages } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: storage });

router.post('/image', protect, authorize('admin', 'manager'), upload.single('image'), uploadImage);
router.post('/images', protect, authorize('admin', 'manager'), upload.array('images', 5), uploadImages);

module.exports = router;
