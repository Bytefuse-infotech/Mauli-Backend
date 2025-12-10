const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const User = require('../src/models/User');

describe('Product API', () => {
    let adminToken;
    let categoryId;
    let productId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI_PROD, { dbName: 'mauliMarketingTest' });
        await Product.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});

        // Create Admin
        const { hashPassword } = require('../src/services/authService');
        const hash = await hashPassword('password123');
        await User.create({
            name: 'Test Admin',
            email: 'admin@products.com',
            phone: '2222222222',
            password_hash: hash,
            role: 'admin'
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@products.com', password: 'password123' });
        adminToken = res.body.accessToken;

        // Create a test category
        const category = await Category.create({
            name: 'Test Category',
            slug: 'test-category',
            priority: 5
        });
        categoryId = category._id;
    });

    afterAll(async () => {
        await Product.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it('should create a product (admin)', async () => {
        const res = await request(app)
            .post('/api/v1/admin/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Paint',
                price: 599,
                discount: 50,
                unit: 'box',
                description: 'Test product',
                category_id: categoryId.toString(),
                images: [{ url: 'https://example.com/img.jpg', order_index: 0 }]
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toEqual('Test Paint');
        productId = res.body.data._id;
    });

    it('should get all products (public)', async () => {
        const res = await request(app)
            .get('/api/v1/products');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.products.length).toBeGreaterThan(0);
    });

    it('should get single product by id', async () => {
        const res = await request(app)
            .get(`/api/v1/products/${productId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toEqual('Test Paint');
    });

    it('should update product (admin)', async () => {
        const res = await request(app)
            .put(`/api/v1/admin/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ price: 650, discount: 25 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.price).toEqual(650);
        expect(res.body.data.discount).toEqual(25);
    });

    it('should filter products by category', async () => {
        const res = await request(app)
            .get(`/api/v1/products?category_id=${categoryId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.products.length).toBeGreaterThan(0);
        expect(res.body.products[0].category_id._id).toEqual(categoryId.toString());
    });

    it('should soft delete product (admin)', async () => {
        const res = await request(app)
            .delete(`/api/v1/admin/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.is_active).toBe(false);
    });
});
