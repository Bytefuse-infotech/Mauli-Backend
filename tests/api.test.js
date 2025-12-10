const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const UserSession = require('../src/models/UserSession');

// Mock Redis to avoid connection issues during tests
jest.mock('../src/lib/redis', () => ({
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn()
}));

describe('Auth & User API', () => {
    let adminToken;
    let userId;

    beforeAll(async () => {
        // Connect to a test database or use existing one if careful (safe to use separate DB in real world)
        // For this environment, we just assume connected via app start or explicit connect
        // But app.js doesn't connect DB, server.js does.
        // So we need to connect explicitly here.
        await mongoose.connect(process.env.MONGO_URI_PROD, { dbName: 'mauliMarketingTest' });
        await User.deleteMany({});
        await UserSession.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
        await UserSession.deleteMany({});
        await mongoose.connection.close();
    });

    it('should register a new user (admin)', async () => {
        // First create a user manually or use seed. Let's create an admin first manually to test auth.
        const res = await request(app)
            .post('/api/v1/auth/login') // Fail first
            .send({ email: 'admin@example.com', password: 'password' });
        expect(res.statusCode).toEqual(401);
    });

    // We need to valid user to login.
    // Let's rely on creation via direct DB for setup.
    it('should login successfully', async () => {
        const passwordHash = '$2a$10$abcdefg123456...'; // Fake hash or real one?
        // Actually importing authService to hash is better
        const { hashPassword } = require('../src/services/authService');
        const hash = await hashPassword('password123');

        const user = await User.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            phone: '1234567890',
            password_hash: hash,
            role: 'admin'
        });
        userId = user._id;

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@test.com', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('sessionId');
        adminToken = res.body.accessToken;
    });

    it('should get dashboard stats', async () => {
        const res = await request(app)
            .get('/api/v1/admin/users/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
        expect(res.body.byRole).toHaveProperty('admin');
    });

    it('should logout and update session', async () => {
        // First get a session
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@test.com', password: 'password123' });

        const sessionId = loginRes.body.sessionId;
        const token = loginRes.body.accessToken;

        const res = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${token}`)
            .send({ sessionId }); // pass sessionId

        expect(res.statusCode).toEqual(200);

        // Verify session updated
        const session = await UserSession.findById(sessionId);
        expect(session.end_at).toBeDefined();
        expect(session.duration_seconds).toBeDefined();
    });
});
