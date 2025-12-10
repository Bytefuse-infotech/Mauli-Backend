const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const Banner = require('../src/models/Banner');
const User = require('../src/models/User');

describe('Banner API', () => {
    let adminToken;
    let bannerId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI_PROD, { dbName: 'mauliMarketingTest' });
        await Banner.deleteMany({});
        await User.deleteMany({});

        // Create Admin for tests
        const { hashPassword } = require('../src/services/authService');
        const hash = await hashPassword('password123');
        const admin = await User.create({
            name: 'Test Admin',
            email: 'admin@banners.com',
            phone: '0000000000',
            password_hash: hash,
            role: 'admin'
        });

        // Login to get token
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@banners.com', password: 'password123' });
        adminToken = res.body.accessToken;
    });

    afterAll(async () => {
        await Banner.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it('should create a banner (admin)', async () => {
        const res = await request(app)
            .post('/api/v1/admin/banners')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                image_url: 'http://example.com/img.jpg',
                title: 'Test Banner',
                percentage_off: 20
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.offer_text).toEqual('20% OFF'); // Auto-generated
        bannerId = res.body.data._id;
    });

    it('should get visible banners (public)', async () => {
        const res = await request(app)
            .get('/api/v1/banners');

        expect(res.statusCode).toEqual(200);
        expect(res.body.banners.length).toBeGreaterThan(0);
        expect(res.body.banners[0].title).toEqual('Test Banner');
    });

    it('should not show inactive banners', async () => {
        // Create an inactive banner
        await request(app)
            .post('/api/v1/admin/banners')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                image_url: 'http://example.com/inactive.jpg',
                title: 'Inactive Banner',
                is_active: false
            });

        const res = await request(app).get('/api/v1/banners');
        const titles = res.body.banners.map(b => b.title);
        expect(titles).toContain('Test Banner');
        expect(titles).not.toContain('Inactive Banner');
    });
});
