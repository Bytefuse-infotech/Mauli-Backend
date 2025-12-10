require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Test = require('../models/testModel');

const initDb = async () => {
    try {
        await connectDB();

        const testDoc = new Test({
            name: 'Database Initialization Test'
        });

        await testDoc.save();
        console.log('✅ Test document inserted. Database "mauliMarketing" should now be visible.');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

initDb();
