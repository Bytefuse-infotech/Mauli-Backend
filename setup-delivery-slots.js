const mongoose = require('mongoose');
const StoreConfig = require('./src/models/StoreConfig');
require('dotenv').config();

async function addDeliverySlots() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI_PROD, {
            dbName: 'mauliMarketing'
        });
        console.log('✅ Connected to MongoDB\n');

        // Get or create store config
        let config = await StoreConfig.findOne({});

        if (!config) {
            console.log('📝 Creating new store configuration...');
            config = await StoreConfig.create({
                delivery_fee: {
                    type: 'flat',
                    base_fee: 50
                },
                cart_discounts: [
                    {
                        discount_type: 'percentage',
                        value: 10,
                        min_cart_value: 1000,
                        priority: 1
                    }
                ],
                delivery_slots: []
            });
        }

        // Add delivery slots for the next 30 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newSlots = [];

        for (let i = 0; i < 30; i++) {
            const slotDate = new Date(today);
            slotDate.setDate(today.getDate() + i);

            // Check if slot already exists for this date
            const existingSlot = config.delivery_slots.find(ds => {
                const existingDate = new Date(ds.date);
                existingDate.setHours(0, 0, 0, 0);
                return existingDate.getTime() === slotDate.getTime();
            });

            if (!existingSlot) {
                newSlots.push({
                    date: slotDate,
                    slots: [
                        {
                            start_time: '09:00',
                            end_time: '11:00',
                            capacity: 10,
                            booked: 0
                        },
                        {
                            start_time: '11:00',
                            end_time: '13:00',
                            capacity: 10,
                            booked: 0
                        },
                        {
                            start_time: '14:00',
                            end_time: '16:00',
                            capacity: 10,
                            booked: 0
                        },
                        {
                            start_time: '16:00',
                            end_time: '18:00',
                            capacity: 10,
                            booked: 0
                        }
                    ]
                });
            }
        }

        if (newSlots.length > 0) {
            config.delivery_slots.push(...newSlots);
            await config.save();
            console.log(`✅ Added ${newSlots.length} delivery slot dates`);
            console.log(`📅 Date range: ${newSlots[0].date.toDateString()} to ${newSlots[newSlots.length - 1].date.toDateString()}`);
            console.log(`⏰ Time slots per day: 4 (09:00-11:00, 11:00-13:00, 14:00-16:00, 16:00-18:00)`);
            console.log(`📦 Capacity per slot: 10 orders\n`);
        } else {
            console.log('ℹ️  All delivery slots already configured for the next 30 days\n');
        }

        // Display current configuration
        console.log('📋 Current Store Configuration:');
        console.log(`   Delivery Fee: ${config.delivery_fee.type} - ₹${config.delivery_fee.base_fee}`);
        console.log(`   Total Delivery Slot Dates: ${config.delivery_slots.length}`);
        console.log(`   Cart Discounts: ${config.cart_discounts.length} rules configured\n`);

        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        console.log('\n✨ You can now create orders with delivery slots!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addDeliverySlots();
