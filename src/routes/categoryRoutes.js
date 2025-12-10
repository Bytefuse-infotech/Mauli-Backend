const express = require('express');
const router = express.Router();
const {
    getActiveCategories,
    createCategory,
    updateCategory,
    listCategories,
    toggleCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public
router.get('/', getActiveCategories); // Map to /api/v1/categories

// Admin
router.get('/all', protect, authorize('admin', 'manager'), listCategories);
router.post('/admin/categories', protect, authorize('admin'), createCategory);
router.put('/admin/categories/:id', protect, authorize('admin'), updateCategory);
router.patch('/admin/categories/:id/toggle', protect, authorize('admin'), toggleCategory);
router.delete('/admin/categories/:id', protect, authorize('admin'), deleteCategory);
// Note: Prompt asked for GET /api/v1/admin/categories usually for listing? 
// Prompt said: GET /api/v1/categories/all -> listCategories (admin)
// And POST /api/v1/admin/categories
// Since we are likely mounting this at /api/v1/categories
// GET /all works.
// POST /admin/categories -> /api/v1/categories/admin/categories ?? 
// This path handling is getting tricky with single file mounting.

// Let's assume this router is mounted at `/api/v1` in index.js to support the diverse paths requested
// "routes/categoryRoutes.js"
// "Route /api/v1/categories -> getActiveCategories"
// "Route /api/v1/admin/categories -> createCategory"

// If I mount it at /api/v1/categories, I can't easily reach /api/v1/admin/categories without it being /api/v1/categories/admin...

// STRATEGY: 
// I will define the routes with full paths relative to /api/v1 and mount at /api/v1 in index.js
// Just like I did for Banners after the fix.

router.get('/categories', getActiveCategories);
router.get('/categories/all', protect, authorize('admin', 'manager'), listCategories);

// Admin Routes
router.post('/admin/categories', protect, authorize('admin'), createCategory);
router.put('/admin/categories/:id', protect, authorize('admin'), updateCategory);
router.patch('/admin/categories/:id/toggle', protect, authorize('admin'), toggleCategory);
router.delete('/admin/categories/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
