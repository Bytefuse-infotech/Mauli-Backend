require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const authService = require('../services/authService');

const seedUsers = async () => {
    try {
        await connectDB();

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Hash password
        const passwordHash = await authService.hashPassword('Admin123!');
        const passwordHashManager = await authService.hashPassword('Manager123!');
        const passwordHashCustomer = await authService.hashPassword('Customer123!');

        const users = [
            {
                name: 'Admin User',
                email: 'admin@example.com',
                phone: '+919900112233',
                role: 'admin',
                password_hash: passwordHash,
                is_active: true
            },
            {
                name: 'Manager One',
                email: 'manager@example.com',
                phone: '+919900112244',
                role: 'manager',
                password_hash: passwordHashManager,
                is_active: true
            },
            {
                name: 'Customer One',
                email: 'customer1@example.com',
                phone: '+919900112255',
                role: 'customer',
                password_hash: passwordHashCustomer,
                last_login_at: new Date() // Today
            },
            {
                name: 'Customer Two',
                email: 'customer2@example.com',
                phone: '+919900112266',
                role: 'customer',
                password_hash: passwordHashCustomer,
                last_login_at: new Date(new Date().setDate(new Date().getDate() - 1)) // Yesterday
            },
            {
                name: 'Customer Three',
                email: 'customer3@example.com',
                phone: '+919900112277',
                role: 'customer',
                password_hash: passwordHashCustomer,
                is_active: false // Inactive
            }
        ];

        await User.insertMany(users);
        console.log('✅ Users Seeded Successfully');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedUsers();
