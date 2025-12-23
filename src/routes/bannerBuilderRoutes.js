const express = require('express');
const router = express.Router();
const {
    getAllBannerBuilders,
    getBannerBuilderById,
    createBannerBuilder,
    updateBannerBuilder,
    deleteBannerBuilder,
    hardDeleteBannerBuilder,
    duplicateBannerBuilder,
    updateBannerStatus,
    getVisibleBanners,
    getBannerForRender,
    trackBannerClick,
    getDefaultTemplate
} = require('../controllers/bannerBuilderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin authorization middleware
const isAdmin = authorize('admin', 'manager');

// ==========================================
// PUBLIC ROUTES (for frontend rendering)
// ==========================================

// Get all visible banners for customer-facing frontend
router.get('/banner-builder/visible', getVisibleBanners);

// Get single banner for rendering (increments impressions)
router.get('/banner-builder/:id/render', getBannerForRender);

// Track banner click analytics
router.post('/banner-builder/:id/click', trackBannerClick);

// ==========================================
// ADMIN ROUTES (protected)
// ==========================================

// Get default template for new banners
router.get('/admin/banner-builder/template', protect, isAdmin, getDefaultTemplate);

// Get all banner builders (Admin list view)
router.get('/admin/banner-builder', protect, isAdmin, getAllBannerBuilders);

// Get single banner builder by ID
router.get('/admin/banner-builder/:id', protect, isAdmin, getBannerBuilderById);

// Create new banner
router.post('/admin/banner-builder', protect, isAdmin, createBannerBuilder);

// Update banner
router.put('/admin/banner-builder/:id', protect, isAdmin, updateBannerBuilder);

// Update banner status (publish/unpublish)
router.patch('/admin/banner-builder/:id/status', protect, isAdmin, updateBannerStatus);

// Duplicate banner
router.post('/admin/banner-builder/:id/duplicate', protect, isAdmin, duplicateBannerBuilder);

// Soft delete banner
router.delete('/admin/banner-builder/:id', protect, isAdmin, deleteBannerBuilder);

// Hard delete banner
router.delete('/admin/banner-builder/:id/permanent', protect, isAdmin, hardDeleteBannerBuilder);

module.exports = router;
