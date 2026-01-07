const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StoreConfig = require('../src/models/StoreConfig');

// Load env vars
dotenv.config();
console.log('URI loaded:', !!process.env.MONGO_URI_PROD);

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_PROD, {
            dbName: 'mauliMarketing'
        });
        console.log('MongoDB Connected');

        // Define the new default slabs
        const newDiscounts = [
            {
                discount_type: 'flat',
                min_cart_value: 500,
                value: 50,
                priority: 1
            },
            {
                discount_type: 'flat',
                min_cart_value: 1000,
                value: 150,
                priority: 2
            },
            {
                discount_type: 'flat',
                min_cart_value: 2000,
                value: 400,
                priority: 3
            }
        ];

        // Check count
        const count = await StoreConfig.countDocuments({});
        console.log(`Debug: Found ${count} StoreConfig documents`);

        // Find existing config (assuming single tenant/default for now)
        const config = await StoreConfig.findOne({});

        if (config) {
            console.log('Found existing config. Updating discounts...');
            config.cart_discounts = newDiscounts;
            await config.save();
            console.log('Successfully updated discounts locally.');
        } else {
            console.log('No existing config found. Default creation logic should handle it on next request.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();
