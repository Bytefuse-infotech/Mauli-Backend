const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TEST_USER = {
    name: 'Test Customer',
    email: 'test@customer.com',
    phone: '918108053372',
    password: 'qwerty@123',
    role: 'customer'
};

async function setupTestUser() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI_PROD, {
            dbName: 'mauliMarketing'
        });
        console.log('✅ Connected to MongoDB\n');

        // Check if user exists
        let user = await User.findOne({ phone: TEST_USER.phone });

        if (user) {
            console.log('👤 User already exists:');
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Active: ${user.is_active}`);
            console.log(`   Phone Verified: ${user.is_phone_verified}`);

            // Update password and ensure user is active
            const password_hash = await bcrypt.hash(TEST_USER.password, 10);
            user.password_hash = password_hash;
            user.is_active = true;
            user.is_phone_verified = true;
            user.otp_hash = undefined;
            user.otp_expires_at = undefined;
            await user.save();

            console.log('\n✅ User updated with new password and activated');
        } else {
            console.log('📝 Creating new test user...');

            const password_hash = await bcrypt.hash(TEST_USER.password, 10);

            user = await User.create({
                name: TEST_USER.name,
                email: TEST_USER.email,
                phone: TEST_USER.phone,
                password_hash: password_hash,
                role: TEST_USER.role,
                is_active: true,
                is_phone_verified: true
            });

            console.log('✅ Test user created successfully:');
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Role: ${user.role}`);
        }

        console.log('\n📋 Test Credentials:');
        console.log(`   Phone: ${TEST_USER.phone}`);
        console.log(`   Password: ${TEST_USER.password}`);
        console.log('\n✨ Test user is ready for API testing!\n');

        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupTestUser();
