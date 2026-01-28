const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage, bannerStorage } = require('../config/cloudinary');
const { uploadImage, uploadImages } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: storage });
const bannerUpload = multer({ storage: bannerStorage });

router.post('/image', protect, authorize('admin', 'manager'), upload.single('image'), uploadImage);
router.post('/images', protect, authorize('admin', 'manager'), upload.array('images', 5), uploadImages);

// Specific route for banner uploads with optimized settings
router.post('/banner', protect, authorize('admin', 'manager'), bannerUpload.single('banner'), uploadImage);

module.exports = router;
