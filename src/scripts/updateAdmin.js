require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const authService = require('../services/authService');

const updateAdminUser = async () => {
    try {
        await connectDB();

        const email = 'admin@gmail.com';
        const newPassword = 'qwerty@123';
        const newPhone = '8108053382';

        // Find existing admin
        const admin = await User.findOne({ email });

        if (!admin) {
            console.log('❌ Admin user not found with email:', email);
            console.log('💡 Run createAdmin.js to create a new admin user.');
            process.exit(1);
        }

        console.log('📋 Current Admin Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Phone:', admin.phone);
        console.log('Role:', admin.role);
        console.log('Status:', admin.is_active ? 'Active' : 'Inactive');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Hash new password
        const password_hash = await authService.hashPassword(newPassword);

        // Update admin user
        admin.phone = newPhone;
        admin.password_hash = password_hash;
        admin.is_active = true;
        admin.is_email_verified = true;
        admin.is_phone_verified = true;

        await admin.save();

        console.log('✅ Admin User Updated Successfully');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Phone:', admin.phone);
        console.log('Password: qwerty@123 (NEW)');
        console.log('Role:', admin.role);
        console.log('Status:', admin.is_active ? 'Active ✅' : 'Inactive');
        console.log('User ID:', admin._id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔐 Updated Login Credentials:');
        console.log('Email: admin@gmail.com');
        console.log('Phone: 8108053382');
        console.log('Password: qwerty@123');
        console.log('\n✨ You can now login with these credentials!');

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

updateAdminUser();
