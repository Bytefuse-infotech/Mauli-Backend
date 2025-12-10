require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const StoreConfig = require('../models/StoreConfig');

const seedStoreConfig = async () => {
    try {
        await connectDB();

        await StoreConfig.deleteMany({});
        console.log('Cleared existing store configs');

        const config = await StoreConfig.create({
            tenant_id: null,
            store_address: {
                line1: '12 MG Road',
                line2: 'Near City Center',
                city: 'Pune',
                state: 'Maharashtra',
                postal_code: '411001',
                country: 'India',
                latitude: 18.5204,
                longitude: 73.8567
            },
            delivery_fee: {
                type: 'flat',
                base_fee: 50,
                rate: 0
            },
            cart_discounts: [
                {
                    discount_type: 'flat',
                    min_cart_value: 1000,
                    value: 100,
                    priority: 10,
                    max_discount_amount: 100
                },
                {
                    discount_type: 'percentage',
                    min_cart_value: 2000,
                    value: 10,
                    priority: 20,
                    max_discount_amount: 500
                }
            ],
            delivery_slots: [
                {
                    date: new Date('2025-12-12'),
                    slots: [
                        { start_time: '09:00', end_time: '11:00', capacity: 20, booked: 0 },
                        { start_time: '11:00', end_time: '13:00', capacity: 20, booked: 0 },
                        { start_time: '14:00', end_time: '16:00', capacity: 15, booked: 0 },
                        { start_time: '16:00', end_time: '18:00', capacity: 15, booked: 0 }
                    ]
                },
                {
                    date: new Date('2025-12-13'),
                    slots: [
                        { start_time: '09:00', end_time: '11:00', capacity: 20, booked: 0 },
                        { start_time: '11:00', end_time: '13:00', capacity: 20, booked: 0 },
                        { start_time: '14:00', end_time: '16:00', capacity: 15, booked: 0 }
                    ]
                }
            ],
            is_delivery_enabled: true
        });

        console.log('✅ StoreConfig Seeded Successfully');
        console.log('Config ID:', config._id);

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedStoreConfig();
