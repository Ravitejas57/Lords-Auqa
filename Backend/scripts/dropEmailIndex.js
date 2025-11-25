// Script to drop the unique index on email field in admins collection
// Run this once: node scripts/dropEmailIndex.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.DBurl || 'mongodb://localhost:27017/hatchseed';

async function dropEmailIndex() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'hatchseed' });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('admins');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the email_1 index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Successfully dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  email_1 index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // List indexes again to confirm
    const indexesAfter = await collection.indexes();
    console.log('Indexes after drop:', indexesAfter);

    await mongoose.connection.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropEmailIndex();

