const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const sessionRoutes = require('./sessionRoutes');

const bannerRoutes = require('./bannerRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const storeconfigRoutes = require('./storeconfigRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const addressRoutes = require('./addressRoutes');

const contentRoutes = require('./contentRoutes');

router.use('/', bannerRoutes); // /banners and /admin/banners
router.use('/', categoryRoutes); // /categories and /admin/categories
router.use('/', productRoutes); // /products and /admin/products
router.use('/', storeconfigRoutes); // /storeconfig
router.use('/cart', cartRoutes); // /cart
router.use('/', orderRoutes); // /orders and /admin/orders
router.use('/addresses', addressRoutes); // /addresses
router.use('/content', contentRoutes); // /content and /content/admin/:key

router.use('/auth', authRoutes);
router.use('/admin/users', userRoutes);
router.use('/', sessionRoutes);

module.exports = router;
