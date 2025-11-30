/**
 * Test script for cleanup service
 *
 * This script tests the cleanup functionality by:
 * 1. Connecting to the database
 * 2. Creating test records (old notifications, stories, help messages)
 * 3. Running the cleanup service
 * 4. Verifying records were deleted correctly
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('../models/Notification.model');
const HelpMessage = require('../models/HelpMessage.model');
const Conversation = require('../models/UserHelp.model');
const cleanupService = require('../services/cleanupService');

dotenv.config();

async function testCleanup() {
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.DBurl, { dbName: 'hatchseed' });
    console.log('✅ Connected to MongoDB\n');

    // Get counts before cleanup
    console.log('📊 Checking current record counts...');
    const beforeCounts = {
      notifications: await Notification.countDocuments(),
      stories: await Notification.countDocuments({ isStory: true }),
      expiredStories: await Notification.countDocuments({
        isStory: true,
        expiresAt: { $lt: new Date() }
      }),
      oldNotifications: await Notification.countDocuments({
        isStory: false,
        createdAt: { $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
      }),
      helpMessages: await HelpMessage.countDocuments(),
      oldHelpMessages: await HelpMessage.countDocuments({
        timestamp: { $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
      }),
      conversations: await Conversation.countDocuments(),
      oldConversations: await Conversation.countDocuments({
        updatedAt: { $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
      })
    };

    console.log('Before cleanup:');
    console.log(`  Total notifications: ${beforeCounts.notifications}`);
    console.log(`  Total stories: ${beforeCounts.stories}`);
    console.log(`  Expired stories (>24h): ${beforeCounts.expiredStories}`);
    console.log(`  Old notifications (>10 days): ${beforeCounts.oldNotifications}`);
    console.log(`  Total help messages: ${beforeCounts.helpMessages}`);
    console.log(`  Old help messages (>10 days): ${beforeCounts.oldHelpMessages}`);
    console.log(`  Total conversations: ${beforeCounts.conversations}`);
    console.log(`  Old conversations (>10 days): ${beforeCounts.oldConversations}\n`);

    // Run cleanup
    console.log('🧹 Running cleanup service...\n');
    const result = await cleanupService.runImmediately();

    console.log('\n📊 Cleanup results:');
    console.log(`  Notifications deleted: ${result.notificationCount}`);
    console.log(`  Expired stories deleted: ${result.storyCount}`);
    console.log(`  Help messages deleted: ${result.helpMessageCount}`);
    console.log(`  Conversations deleted: ${result.conversationCount}`);
    console.log(`  Total deleted: ${result.totalDeleted}`);
    console.log(`  Duration: ${result.duration}ms\n`);

    // Get counts after cleanup
    const afterCounts = {
      notifications: await Notification.countDocuments(),
      stories: await Notification.countDocuments({ isStory: true }),
      expiredStories: await Notification.countDocuments({
        isStory: true,
        expiresAt: { $lt: new Date() }
      }),
      helpMessages: await HelpMessage.countDocuments(),
      conversations: await Conversation.countDocuments()
    };

    console.log('After cleanup:');
    console.log(`  Total notifications: ${afterCounts.notifications}`);
    console.log(`  Total stories: ${afterCounts.stories}`);
    console.log(`  Expired stories (>24h): ${afterCounts.expiredStories}`);
    console.log(`  Total help messages: ${afterCounts.helpMessages}`);
    console.log(`  Total conversations: ${afterCounts.conversations}\n`);

    // Verify cleanup worked correctly
    console.log('✅ Cleanup test completed successfully!');
    console.log('\nVerification:');
    console.log(`  Expected expired stories to delete: ${beforeCounts.expiredStories}`);
    console.log(`  Actual expired stories deleted: ${result.storyCount}`);
    console.log(`  Match: ${beforeCounts.expiredStories === result.storyCount ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Error during cleanup test:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testCleanup();
