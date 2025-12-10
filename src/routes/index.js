const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const sessionRoutes = require('./sessionRoutes');

const bannerRoutes = require('./bannerRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');

router.use('/', bannerRoutes); // /banners and /admin/banners
router.use('/', categoryRoutes); // /categories and /admin/categories
router.use('/', productRoutes); // /products and /admin/products

router.use('/auth', authRoutes);
router.use('/admin/users', userRoutes);
router.use('/', sessionRoutes);

module.exports = router;
