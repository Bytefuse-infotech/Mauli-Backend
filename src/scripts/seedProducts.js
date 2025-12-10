require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const seedProducts = async () => {
    try {
        await connectDB();

        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Get categories for reference
        const paints = await Category.findOne({ slug: 'paints' });
        const tools = await Category.findOne({ slug: 'tools' });
        const adhesives = await Category.findOne({ slug: 'adhesives' });

        const products = [
            {
                name: 'Asian Paints Royale - 1L',
                price: 599,
                discount: 50,
                unit: 'box',
                description: 'Premium interior emulsion paint with smooth finish',
                category_id: paints?._id,
                images: [
                    { url: 'https://cdn-icons-png.flaticon.com/512/2972/2972106.png', order_index: 0 }
                ],
                is_active: true
            },
            {
                name: 'Berger Easy Clean - 4L',
                price: 1899,
                discount: 100,
                unit: 'box',
                description: 'Washable interior paint for easy maintenance',
                category_id: paints?._id,
                images: [
                    { url: 'https://cdn-icons-png.flaticon.com/512/2972/2972106.png', order_index: 0 }
                ],
                is_active: true
            },
            {
                name: 'Paint Brush Set - Professional',
                price: 299,
                discount: 0,
                unit: 'dozen',
                description: 'Set of 12 professional quality paint brushes',
                category_id: tools?._id,
                images: [
                    { url: 'https://cdn-icons-png.flaticon.com/512/1048/1048950.png', order_index: 0 }
                ],
                is_active: true
            },
            {
                name: 'Fevicol MR - 1kg',
                price: 250,
                discount: 25,
                unit: 'both',
                description: 'Multi-purpose adhesive for wood and furniture',
                category_id: adhesives?._id,
                images: [
                    { url: 'https://cdn-icons-png.flaticon.com/512/3063/3063824.png', order_index: 0 }
                ],
                is_active: true
            },
            {
                name: 'Drill Machine - 13mm',
                price: 2499,
                discount: 200,
                unit: 'box',
                description: 'Heavy duty electric drill machine with variable speed',
                category_id: tools?._id,
                images: [
                    { url: 'https://cdn-icons-png.flaticon.com/512/2558/2558311.png', order_index: 0 }
                ],
                is_active: true
            }
        ];

        for (const prod of products) {
            await new Product(prod).save();
        }

        console.log('✅ Products Seeded Successfully');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedProducts();
