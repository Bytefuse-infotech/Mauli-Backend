require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const authService = require('../services/authService');

const createAdminUser = async () => {
    try {
        await connectDB();

        const email = 'admin@gmail.com';
        const password = 'qwerty@123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log('❌ Admin user already exists with this email');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            console.log('Phone:', existingAdmin.phone);
            console.log('Status:', existingAdmin.is_active ? 'Active' : 'Inactive');
            console.log('\n💡 If you want to update this admin, delete it first or use a different email.');
            process.exit(1);
        }

        // Hash password
        const password_hash = await authService.hashPassword(password);

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: email,
            phone: '8108053382',
            password_hash: password_hash,
            role: 'admin',
            is_active: true,
            is_email_verified: true,
            is_phone_verified: true
        });

        console.log('✅ Admin User Created Successfully');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Phone:', admin.phone);
        console.log('Password:', password);
        console.log('Role:', admin.role);
        console.log('Status:', admin.is_active ? 'Active ✅' : 'Inactive');
        console.log('User ID:', admin._id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔐 Login Credentials:');
        console.log('Email: admin@gmail.com');
        console.log('Phone: 8108053382');
        console.log('Password: qwerty@123');

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

createAdminUser();
