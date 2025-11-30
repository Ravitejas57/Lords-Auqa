const cron = require('node-cron');
const Notification = require('../models/Notification.model');
const HelpMessage = require('../models/HelpMessage.model');
const Conversation = require('../models/UserHelp.model');

/**
 * Cleanup Service for auto-deleting old records
 *
 * Cleanup rules:
 * 1. Delete notifications older than 10 days (excluding stories)
 * 2. Delete help messages older than 10 days
 * 3. Delete conversations older than 10 days
 * 4. Delete expired stories (24 hours after creation)
 */

class CleanupService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Delete notifications older than 10 days (non-story notifications)
   */
  async cleanupOldNotifications() {
    try {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const result = await Notification.deleteMany({
        createdAt: { $lt: tenDaysAgo },
        isStory: false // Only delete non-story notifications here
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Cleanup: Deleted ${result.deletedCount} old notifications (>10 days)`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Delete expired stories (24 hours after creation)
   */
  async cleanupExpiredStories() {
    try {
      const now = new Date();

      // Delete stories that have passed their expiresAt date
      const result = await Notification.deleteMany({
        isStory: true,
        expiresAt: { $lt: now }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Cleanup: Deleted ${result.deletedCount} expired stories (>24 hours)`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired stories:', error);
      throw error;
    }
  }

  /**
   * Delete help messages older than 10 days
   */
  async cleanupOldHelpMessages() {
    try {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const result = await HelpMessage.deleteMany({
        timestamp: { $lt: tenDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Cleanup: Deleted ${result.deletedCount} old help messages (>10 days)`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old help messages:', error);
      throw error;
    }
  }

  /**
   * Delete conversations older than 10 days
   */
  async cleanupOldConversations() {
    try {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const result = await Conversation.deleteMany({
        updatedAt: { $lt: tenDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Cleanup: Deleted ${result.deletedCount} old conversations (>10 days)`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old conversations:', error);
      throw error;
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup() {
    if (this.isRunning) {
      console.log('⏳ Cleanup already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🧹 Starting scheduled cleanup...');

      const startTime = Date.now();

      // Run all cleanup tasks in parallel
      const [
        notificationCount,
        storyCount,
        helpMessageCount,
        conversationCount
      ] = await Promise.all([
        this.cleanupOldNotifications(),
        this.cleanupExpiredStories(),
        this.cleanupOldHelpMessages(),
        this.cleanupOldConversations()
      ]);

      const totalDeleted = notificationCount + storyCount + helpMessageCount + conversationCount;
      const duration = Date.now() - startTime;

      console.log(`✅ Cleanup completed in ${duration}ms. Total records deleted: ${totalDeleted}`);

      return {
        notificationCount,
        storyCount,
        helpMessageCount,
        conversationCount,
        totalDeleted,
        duration
      };
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Schedule cleanup to run every day at 2:00 AM
   */
  startScheduledCleanup() {
    // Run cleanup every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('⏰ Scheduled cleanup triggered at 2:00 AM');
      await this.runCleanup();
    });

    // Also run cleanup every 6 hours for stories (they expire after 24 hours)
    cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ Scheduled story cleanup triggered (every 6 hours)');
      try {
        const storyCount = await this.cleanupExpiredStories();
        console.log(`✅ Story cleanup completed. Deleted ${storyCount} expired stories.`);
      } catch (error) {
        console.error('❌ Error during scheduled story cleanup:', error);
      }
    });

    console.log('✅ Cleanup service started:');
    console.log('   - Daily cleanup at 2:00 AM (notifications, help messages, conversations older than 10 days)');
    console.log('   - Story cleanup every 6 hours (stories older than 24 hours)');
  }

  /**
   * Run cleanup immediately (for testing or manual trigger)
   */
  async runImmediately() {
    console.log('🔄 Running cleanup immediately...');
    return await this.runCleanup();
  }
}

// Export singleton instance
const cleanupService = new CleanupService();
module.exports = cleanupService;
