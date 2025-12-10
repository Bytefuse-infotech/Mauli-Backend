const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const Category = require('../src/models/Category');
const User = require('../src/models/User');

describe('Category API', () => {
    let adminToken;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI_PROD, { dbName: 'mauliMarketingTest' });
        await Category.deleteMany({});
        await User.deleteMany({});

        // Create Admin
        const { hashPassword } = require('../src/services/authService');
        const hash = await hashPassword('password123');
        const admin = await User.create({
            name: 'Test Admin',
            email: 'admin@cat.com',
            phone: '1111111111',
            password_hash: hash,
            role: 'admin'
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@cat.com', password: 'password123' });
        adminToken = res.body.accessToken;
    });

    afterAll(async () => {
        await Category.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it('should create a category (admin)', async () => {
        const res = await request(app)
            .post('/api/v1/admin/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Paints',
                priority: 10,
                is_active: true
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.slug).toEqual('test-paints');
        expect(res.body.priority).toEqual(10);
    });

    it('should get active categories (public)', async () => {
        const res = await request(app)
            .get('/api/v1/categories');

        expect(res.statusCode).toEqual(200);
        expect(res.body.categories.length).toBeGreaterThan(0);
        expect(res.body.categories[0].name).toEqual('Test Paints');
    });

    it('should sort by priority', async () => {
        // Create lower priority
        await request(app)
            .post('/api/v1/admin/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Low Priority', priority: 1 });

        // Create Higher priority
        await request(app)
            .post('/api/v1/admin/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'High Priority', priority: 20 });

        const res = await request(app).get('/api/v1/categories');

        const names = res.body.categories.map(c => c.name);
        expect(names[0]).toEqual('High Priority');
        expect(names).toContain('Test Paints'); // Priority 10
        expect(names).toContain('Low Priority'); // Priority 1
    });

    it('should toggle category status', async () => {
        // Find High Priority
        const cat = await Category.findOne({ name: 'High Priority' });

        const res = await request(app)
            .patch(`/api/v1/admin/categories/${cat._id}/toggle`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.is_active).toBe(false);

        // Check public list - should be gone
        const publicRes = await request(app).get('/api/v1/categories');
        const publicNames = publicRes.body.categories.map(c => c.name);
        expect(publicNames).not.toContain('High Priority');
    });
});
