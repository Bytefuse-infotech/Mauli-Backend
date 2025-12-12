const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const AppContent = require('../models/AppContent');

const seedContent = async () => {
    try {
        console.log('MONGO_URI_PROD Present:', !!process.env.MONGO_URI_PROD);
        if (!process.env.MONGO_URI_PROD) {
            throw new Error('MONGO_URI_PROD is undefined');
        }
        await mongoose.connect(process.env.MONGO_URI_PROD, {
            dbName: 'mauliMarketing'
        });
        console.log('MongoDB Connected check...');

        const contents = [
            {
                key: 'terms_and_conditions',
                title: 'Terms and Conditions',
                content: `
                    <h1>Terms and Conditions</h1>
                    <p>Welcome to Mauli Marketing. specific terms...</p>
                    <p>1. <strong>Acceptance of Terms</strong>: By using our app, you agree to these terms.</p>
                    <p>2. <strong>Usage</strong>: You agree to use the app for lawful purposes only.</p>
                    <p>3. <strong>Orders</strong>: All orders are subject to availability and confirmation.</p>
                    <p>4. <strong>Pricing</strong>: Prices are subject to change without notice.</p>
                `,
                is_visible: true
            },
            {
                key: 'refund_policy',
                title: 'Refund Policy',
                content: `
                    <h1>Refund Policy</h1>
                    <p>We strive to ensure you are happy with your purchase.</p>
                    <p><strong>Eligibility</strong>: Refunds are processed for damaged or incorrect items only.</p>
                    <p><strong>Timeline</strong>: Please report issues within 24 hours of delivery.</p>
                    <p><strong>Process</strong>: Contact support with photos of the issue to initiate a refund.</p>
                `,
                is_visible: true
            },
            {
                key: 'about_us',
                title: 'About Us',
                content: `
                    <h1>About Mauli Marketing</h1>
                    <p>Mauli Marketing is dedicated to providing high-quality products directly to your doorstep.</p>
                    <p>We source the freshest produce and best items to ensure your satisfaction.</p>
                    <p><strong>Our Mission</strong>: To deliver quality and convenience.</p>
                    <p><strong>Contact</strong>: support@maulimarketing.com</p>
                `,
                is_visible: true
            },
            {
                key: 'privacy_policy',
                title: 'Privacy Policy',
                content: `
                    <h1>Privacy Policy</h1>
                    <p>Your privacy is important to us.</p>
                    <p>We collect basic information to process your orders and improve your experience.</p>
                    <p>We do not sell your data to third parties.</p>
                `,
                is_visible: true
            }
        ];

        for (const item of contents) {
            await AppContent.findOneAndUpdate(
                { key: item.key },
                item,
                { upsert: true, new: true }
            );
            console.log(`Seeded: ${item.title}`);
        }

        console.log('Content seeding completed successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding content:', error);
        process.exit(1);
    }
};

seedContent();
