const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProduct,
    listProducts,
    updateProduct,
    deleteProduct,
    getProductsByCategory
} = require('../controllers/productController');
const { createProductSchema, updateProductSchema, validate } = require('../validators/productValidator');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Routes
router.get('/products', listProducts);
router.get('/products/category/:categoryId', getProductsByCategory);
router.get('/products/:id', getProduct);

// Admin Routes
router.post('/admin/products', protect, authorize('admin'), validate(createProductSchema), createProduct);
router.put('/admin/products/:id', protect, authorize('admin'), validate(updateProductSchema), updateProduct);
router.delete('/admin/products/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
