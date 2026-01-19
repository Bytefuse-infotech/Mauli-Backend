const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_PROD;
        if (!mongoUri) {
            throw new Error('MONGO_URI or MONGO_URI_PROD not found in .env');
        }
        await mongoose.connect(mongoUri, { family: 4 });
        console.log('Connected to MongoDB');

        const email = 'admin@gmail.com';
        const password = 'qwerty';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if exists first to avoid duplicates or errors if partial data exists
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('Admin user already exists. Updating password/role...');
            existingAdmin.password_hash = hashedPassword;
            existingAdmin.role = 'admin';
            existingAdmin.name = 'Admin User';
            existingAdmin.phone = '+910000000000'; // Placeholder phone for admin
            existingAdmin.is_email_verified = true;
            existingAdmin.is_phone_verified = true;
            await existingAdmin.save();
            console.log('Admin user updated successfully');
        } else {
            console.log('Creating new admin user...');
            const adminUser = new User({
                name: 'Admin User',
                email: email,
                password_hash: hashedPassword,
                role: 'admin',
                phone: '+910000000000', // valid dummy phone
                is_active: true,
                is_email_verified: true,
                is_phone_verified: true
            });

            await adminUser.save();
            console.log('Admin user created successfully');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
