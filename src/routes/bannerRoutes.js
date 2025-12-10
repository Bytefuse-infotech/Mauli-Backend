const express = require('express');
const router = express.Router();
const {
    getVisibleBanners,
    createBanner,
    listBanners,
    updateBanner,
    deleteBanner
} = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.get('/banners', getVisibleBanners);
router.get('/banners/visible', getVisibleBanners);

// Admin
router.get('/admin/banners', protect, authorize('admin'), listBanners);
router.post('/admin/banners', protect, authorize('admin'), createBanner);
router.put('/admin/banners/:id', protect, authorize('admin'), updateBanner);
router.delete('/admin/banners/:id', protect, authorize('admin'), deleteBanner);

module.exports = router;
