const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const StoreConfig = require('../src/models/StoreConfig');
const User = require('../src/models/User');

describe('StoreConfig API', () => {
    let adminToken;
    let configId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI_PROD, { dbName: 'mauliMarketingTest' });
        await StoreConfig.deleteMany({});
        await User.deleteMany({});

        // Create Admin
        const { hashPassword } = require('../src/services/authService');
        const hash = await hashPassword('password123');
        await User.create({
            name: 'Test Admin',
            email: 'admin@storeconfig.com',
            phone: '3333333333',
            password_hash: hash,
            role: 'admin'
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@storeconfig.com', password: 'password123' });
        adminToken = res.body.accessToken;
    });

    afterAll(async () => {
        await StoreConfig.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    it('should get or create default store config', async () => {
        const res = await request(app)
            .get('/api/v1/storeconfig');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('store_address');
        expect(res.body.data).toHaveProperty('delivery_fee');
        configId = res.body.data._id;
    });

    it('should update store config (admin)', async () => {
        const res = await request(app)
            .put('/api/v1/storeconfig')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                store_address: {
                    line1: 'Updated Address',
                    city: 'Mumbai',
                    state: 'Maharashtra'
                },
                delivery_fee: {
                    type: 'per_km',
                    base_fee: 30,
                    rate: 10
                }
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.store_address.city).toEqual('Mumbai');
        expect(res.body.data.delivery_fee.type).toEqual('per_km');
    });

    it('should compute cart total with flat delivery fee', async () => {
        // First set flat delivery
        await request(app)
            .put('/api/v1/storeconfig')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                delivery_fee: {
                    type: 'flat',
                    base_fee: 50
                },
                cart_discounts: [
                    {
                        discount_type: 'flat',
                        min_cart_value: 1000,
                        value: 100,
                        priority: 10
                    }
                ]
            });

        const res = await request(app)
            .post('/api/v1/storeconfig/compute')
            .send({
                cart_value: 1200,
                distance_km: 5
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.delivery_fee).toEqual(50);
        expect(res.body.data.discount_amount).toEqual(100);
        expect(res.body.data.final_amount).toEqual(1150); // 1200 - 100 + 50
    });

    it('should compute cart total with per_km delivery fee', async () => {
        await request(app)
            .put('/api/v1/storeconfig')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                delivery_fee: {
                    type: 'per_km',
                    base_fee: 30,
                    rate: 10
                }
            });

        const res = await request(app)
            .post('/api/v1/storeconfig/compute')
            .send({
                cart_value: 1200,
                distance_km: 5
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.delivery_fee).toEqual(80); // 30 + (10 * 5)
    });

    it('should apply discount based on priority', async () => {
        await request(app)
            .put('/api/v1/storeconfig')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                cart_discounts: [
                    {
                        discount_type: 'flat',
                        min_cart_value: 1000,
                        value: 100,
                        priority: 10
                    },
                    {
                        discount_type: 'percentage',
                        min_cart_value: 1000,
                        value: 15,
                        priority: 20,
                        max_discount_amount: 300
                    }
                ]
            });

        const res = await request(app)
            .post('/api/v1/storeconfig/compute')
            .send({
                cart_value: 2000
            });

        expect(res.statusCode).toEqual(200);
        // Should apply percentage discount (priority 20 > 10)
        expect(res.body.data.discount_amount).toEqual(300); // 15% of 2000 = 300
        expect(res.body.data.applied_discount_rule.discount_type).toEqual('percentage');
    });

    it('should reserve a delivery slot', async () => {
        const testDate = new Date('2025-12-15T00:00:00.000Z');

        // First add slots
        await request(app)
            .put('/api/v1/storeconfig')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                delivery_slots: [
                    {
                        date: testDate.toISOString(),
                        slots: [
                            { start_time: '09:00', end_time: '11:00', capacity: 5, booked: 0 }
                        ]
                    }
                ]
            });

        const res = await request(app)
            .post('/api/v1/storeconfig/reserve-slot')
            .send({
                date: testDate.toISOString(),
                start_time: '09:00'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);

        // Verify slot was booked
        const config = await StoreConfig.findOne({});
        const slot = config.delivery_slots[0].slots.find(s => s.start_time === '09:00');
        expect(slot.booked).toEqual(1);
    });

    it('should not reserve slot when capacity exceeded', async () => {
        const testDate = new Date('2025-12-16T00:00:00.000Z');

        // Set capacity to 1 and book it
        await request(app)
            .put('/api/v1/storeconfig')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                delivery_slots: [
                    {
                        date: testDate.toISOString(),
                        slots: [
                            { start_time: '10:00', end_time: '12:00', capacity: 1, booked: 1 }
                        ]
                    }
                ]
            });

        const res = await request(app)
            .post('/api/v1/storeconfig/reserve-slot')
            .send({
                date: testDate.toISOString(),
                start_time: '10:00'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
    });
});
