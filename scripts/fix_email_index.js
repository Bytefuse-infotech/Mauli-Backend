require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const fixEmailIndex = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI_PROD, {
            dbName: 'mauliMarketing'
        });
        console.log('Connected to MongoDB.');

        console.log('Dropping email_1 index...');
        try {
            await User.collection.dropIndex('email_1');
            console.log('Successfully dropped email_1 index.');
        } catch (error) {
            console.log('Error dropping index (it might not exist):', error.message);
        }

        console.log('Syncing indexes...');
        await User.syncIndexes();
        console.log('Indexes synced successfully. The email index should now be sparse.');

        process.exit(0);
    } catch (error) {
        console.error('Error fixing email index:', error);
        process.exit(1);
    }
};

fixEmailIndex();
