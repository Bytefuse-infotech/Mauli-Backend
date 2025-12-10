require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');

const seedCategories = async () => {
    try {
        await connectDB();

        await Category.deleteMany({});
        console.log('Cleared existing categories');

        const categories = [
            {
                name: 'Paints',
                priority: 10,
                icon_url: 'https://cdn-icons-png.flaticon.com/512/2972/2972106.png',
                is_active: true
            },
            {
                name: 'Tools',
                priority: 8,
                icon_url: 'https://cdn-icons-png.flaticon.com/512/2558/2558311.png',
                is_active: true
            },
            {
                name: 'Adhesives',
                priority: 5,
                icon_url: 'https://cdn-icons-png.flaticon.com/512/3063/3063824.png',
                is_active: true
            },
            {
                name: 'Brushes',
                priority: 5,
                icon_url: 'https://cdn-icons-png.flaticon.com/512/1048/1048950.png',
                is_active: true
            }
        ];

        // Use save() to trigger pre-save hooks for slug generation
        for (const cat of categories) {
            await new Category(cat).save();
        }
        console.log('✅ Categories Seeded Successfully');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedCategories();
