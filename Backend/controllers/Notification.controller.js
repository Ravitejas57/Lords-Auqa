const Notification = require('../models/Notification.model');
const UserProfile = require('../models/UserProfile.model');
const Admin = require('../models/Admin.model');
const mongoose = require('mongoose');

/**
 * Admin broadcast — supports: all, region, district, users, or public
 * - target === 'all' : send to all users assigned to admin (if adminId provided) or all approved users
 * - target === 'users': userIds[] (specific user list)
 * - target === 'region' / 'district': those filters
 * - target === 'public': creates a single global (isGlobal=true) notification visible to all users
 */
exports.createBroadcastNotification = async (req, res) => {
  try {
    let { target, region, district, userIds, type, priority, message, adminId } = req.body;
    
    // Normalize message - handle undefined, null, or empty string
    if (message === undefined || message === null) {
      message = '';
    }

    // Handle userIds - might be JSON string from FormData or already an array
    if (typeof userIds === 'string') {
      try {
        userIds = JSON.parse(userIds);
      } catch {
        // If not JSON, treat as single value or empty
        userIds = userIds ? [userIds] : [];
      }
    }
    if (!Array.isArray(userIds)) {
      userIds = userIds ? [userIds] : [];
    }

    if (!target) {
      return res.status(400).json({ success: false, message: 'target is required' });
    }

    // Process uploaded files if any
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      uploadedFiles.push(...req.files.map(file => ({
        url: file.path, // Cloudinary URL
        public_id: file.filename, // Cloudinary public_id
        filename: file.originalname || file.filename,
        fileType: file.mimetype?.split('/')[0] || 'file', // 'image', 'application', etc.
        uploadedAt: new Date()
      })));
    }

    // Message is optional if files are uploaded
    if (!message && (!uploadedFiles || uploadedFiles.length === 0)) {
      return res.status(400).json({ success: false, message: 'message is required if no files are uploaded' });
    }

    // Set default message if not provided but files are uploaded (to satisfy schema requirement)
    if ((!message || message.trim() === '') && uploadedFiles.length > 0) {
      message = 'Media shared'; // Default message when only files are sent
    }

    // PUBLIC global notification (one doc)
    if (target === 'public') {
      const globalNotif = new Notification({
        isGlobal: true,
        type: type || 'info',
        priority: priority || 'medium',
        message,
        files: uploadedFiles,
        time: new Date().toISOString()
      });
      await globalNotif.save();

      // emit via socket if available
      if (req.io) req.io.emit('newNotification', globalNotif);

      return res.status(201).json({ success: true, message: 'Public notification created', notification: globalNotif });
    }

    // Resolve users depending on target
    let users = [];
    if (target === 'all') {
      const filter = { isApproved: true };
      if (adminId) {
        // adminId might be the custom string (e.g., "ADM1761907518119") or MongoDB _id
        // We need to find the Admin's MongoDB _id for filtering assignedAdmin
        let adminObjectId = adminId;

        // Check if it's not a valid ObjectId (i.e., it's a custom adminId string)
        if (!mongoose.Types.ObjectId.isValid(adminId) || adminId.length !== 24) {
          // Look up the Admin by their custom adminId field
          const admin = await Admin.findOne({ adminId: adminId }).select('_id');
          if (admin) {
            adminObjectId = admin._id;
          } else {
            return res.status(404).json({ success: false, message: 'Admin not found' });
          }
        }

        filter.assignedAdmin = adminObjectId;
      }
      users = await UserProfile.find(filter).select('_id');
    } else if (target === 'region') {
      if (!region) return res.status(400).json({ success: false, message: 'region required' });
      users = await UserProfile.find({ Region: region, isApproved: true }).select('_id');
    } else if (target === 'district') {
      if (!district) return res.status(400).json({ success: false, message: 'district required' });
      users = await UserProfile.find({ district: district, isApproved: true }).select('_id');
    } else if (target === 'users') {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, message: 'userIds array required' });
      }
      users = await UserProfile.find({ _id: { $in: userIds }, isApproved: true }).select('_id');
    } else {
      return res.status(400).json({ success: false, message: 'invalid target' });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'No target users found' });
    }

    // Create per-user notifications (so each user can mark read individually)
    const nowIso = new Date().toISOString();

    // If notification has media files, mark it as a story and set expiration to 24 hours
    const hasMedia = uploadedFiles.length > 0;
    const expiresAt = hasMedia ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours from now

    // Generate unique broadcast ID for this broadcast (all notifications share this ID)
    const broadcastId = new mongoose.Types.ObjectId().toString();

    const notifications = users.map(u => ({
      userId: u._id,
      isGlobal: false,
      type: type || 'info',
      priority: priority || 'medium',
      message: message || 'Media shared', // Ensure message is never empty (required by schema)
      files: uploadedFiles, // Same files for all notifications
      time: nowIso,
      read: false,
      isStory: hasMedia, // Mark as story if it has media
      expiresAt: expiresAt, // Set expiration for stories
      broadcastId: broadcastId, // Same broadcastId for all notifications in this broadcast
      broadcastTarget: target // Store the target type ('all', 'users', 'region', 'district')
    }));

    let saved = [];
    try {
      saved = await Notification.insertMany(notifications, { ordered: false });
      console.log(`✅ Successfully created ${saved.length} notifications for ${users.length} users`);
    } catch (insertError) {
      console.error('❌ Error inserting notifications:', insertError);
      // If some notifications failed, check if any succeeded
      if (insertError.writeErrors && insertError.writeErrors.length < notifications.length) {
        saved = insertError.insertedDocs || [];
        console.log(`⚠️ Partial success: ${saved.length} notifications created out of ${notifications.length}`);
      } else {
        throw insertError;
      }
    }

    // Emit to each specific user's socket room if available
    if (req.io) {
      saved.forEach(n => {
        const room = n.userId.toString();
        req.io.to(room).emit('newNotification', n);
      });
    }

    res.status(201).json({
      success: true,
      message: `Notifications created for ${saved.length} users`,
      count: saved.length,
      notifications: saved
    });
  } catch (err) {
    console.error('Error in createBroadcastNotification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create single notification (admin or system)
 */
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, message, priority, relatedHatcheryId, relatedReportId } = req.body;
    if (!userId || !message) return res.status(400).json({ success: false, message: 'userId and message required' });

    const notif = new Notification({
      userId,
      type: type || 'info',
      message,
      priority: priority || 'medium',
      relatedHatcheryId,
      relatedReportId,
      time: new Date().toISOString(),
      read: false
    });

    await notif.save();

    if (req.io) req.io.to(userId.toString()).emit('newNotification', notif);

    res.status(201).json({ success: true, message: 'Notification created', notification: notif });
  } catch (err) {
    console.error('Error in createNotification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get user notifications — includes:
 *  - notifications with userId == userId (user-specific)
 *  - notifications where isGlobal == true
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    // best-effort convert to ObjectId
    const queryUserId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const notifications = await Notification.find({
      $or: [
        { userId: queryUserId },
        { isGlobal: true }
      ]
    }).sort({ createdAt: -1 }).limit(200);

    // Info logs to help debug
    const userSpecific = notifications.filter(n => n.userId && n.userId.toString() === userId);
    const global = notifications.filter(n => n.isGlobal === true);
    console.log(`Fetched ${notifications.length} notifications for ${userId} — user-specific: ${userSpecific.length}, global: ${global.length}`);

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    console.error('Error in getUserNotifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get unread notifications (user-specific unread)
 */
exports.getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const queryUserId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const notifications = await Notification.find({ userId: queryUserId, read: false }).sort({ createdAt: -1 });
    const unreadCount = await Notification.getUnreadCount(queryUserId);

    res.status(200).json({ success: true, count: unreadCount, notifications });
  } catch (err) {
    console.error('Error in getUnreadNotifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark single notification read by id
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'id required' });

    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    await notification.markAsRead();
    res.status(200).json({ success: true, message: 'Marked as read', notification });
  } catch (err) {
    console.error('Error in markAsRead:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark all for a user as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const queryUserId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    await Notification.updateMany({ userId: queryUserId, read: false }, { $set: { read: true } });
    res.status(200).json({ success: true, message: 'All marked as read' });
  } catch (err) {
    console.error('Error in markAllAsRead:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Error in deleteNotification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete all notifications for a user
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const queryUserId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    await Notification.deleteMany({ userId: queryUserId });
    res.status(200).json({ success: true, message: 'Deleted all notifications for user' });
  } catch (err) {
    console.error('Error in deleteAllNotifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Notification count (total + unread)
 */
exports.getNotificationCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const queryUserId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const totalCount = await Notification.countDocuments({ $or: [{ userId: queryUserId }, { isGlobal: true }] });
    const unreadCount = await Notification.getUnreadCount(queryUserId);
    res.status(200).json({ success: true, totalCount, unreadCount });
  } catch (err) {
    console.error('Error in getNotificationCount:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Admin history (group by broadcast) - shows one entry per broadcast with recipient details
 */
exports.getNotificationHistory = async (req, res) => {
  try {
    const UserProfile = require('../models/UserProfile.model');

    const history = await Notification.aggregate([
      {
        $match: {
          broadcastId: { $ne: null } // Only include broadcast notifications
        }
      },
      {
        $group: {
          _id: '$broadcastId', // Group by broadcastId
          message: { $first: '$message' },
          type: { $first: '$type' },
          priority: { $first: '$priority' },
          broadcastTarget: { $first: '$broadcastTarget' }, // Get the target type
          count: { $sum: 1 },
          recipientIds: { $push: '$userId' },
          firstNotificationId: { $first: '$_id' },
          sentAt: { $first: '$createdAt' },
          files: { $first: '$files' }
        }
      },
      { $sort: { sentAt: -1 } },
      { $limit: 50 }
    ]);

    // Populate recipient names
    const historyWithRecipients = await Promise.all(
      history.map(async (item) => {
        const recipientIds = item.recipientIds.filter(id => id != null);

        let recipients = [];

        // If broadcast target is 'all', show 'All Sellers'
        if (item.broadcastTarget === 'all') {
          recipients = ['All Sellers'];
        }
        // If broadcast target is 'users' (specific users), show their names
        else if (item.broadcastTarget === 'users' && recipientIds.length > 0) {
          const users = await UserProfile.find({ _id: { $in: recipientIds } })
            .select('name')
            .lean();
          recipients = users.map(u => u.name);
        }
        // For region/district or fallback, show recipient names or 'All Sellers'
        else if (recipientIds.length > 0) {
          const users = await UserProfile.find({ _id: { $in: recipientIds } })
            .select('name')
            .lean();
          recipients = users.map(u => u.name);
        } else {
          recipients = ['All Sellers'];
        }

        return {
          _id: item.firstNotificationId,
          message: item.message,
          type: item.type,
          priority: item.priority,
          recipientCount: item.count,
          recipients: recipients,
          sentAt: item.sentAt,
          files: item.files || []
        };
      })
    );

    res.status(200).json({
      success: true,
      count: historyWithRecipients.length,
      history: historyWithRecipients
    });
  } catch (err) {
    console.error('Error in getNotificationHistory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get latest public notification
 */
exports.getLatestPublicNotification = async (req, res) => {
  try {
    const latest = await Notification.findOne({ isGlobal: true }).sort({ createdAt: -1 }).lean();
    if (!latest) return res.status(200).json({ success: true, notification: null, message: 'No notifications' });
    res.status(200).json({ success: true, notification: latest });
  } catch (err) {
    console.error('Error in getLatestPublicNotification:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get active stories (media notifications that haven't expired) for a user
 */
exports.getActiveStories = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required' });
    }

    const now = new Date();

    // Find stories that:
    // 1. Are marked as stories (have media)
    // 2. Belong to this user
    // 3. Haven't expired yet
    const stories = await Notification.find({
      userId: userId,
      isStory: true,
      expiresAt: { $gt: now }, // Not expired
      files: { $exists: true, $ne: [] } // Has media files
    })
    .sort({ createdAt: -1 }) // Newest first
    .select('message files createdAt expiresAt type priority read');

    res.status(200).json({
      success: true,
      stories: stories,
      count: stories.length
    });
  } catch (err) {
    console.error('Error in getActiveStories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get admin's active stories (ALL broadcasts with media that haven't expired)
 * Returns all stories grouped by broadcast (for admin viewing)
 */
exports.getAdminStories = async (req, res) => {
  try {
    const now = new Date();

    // Get all unique broadcast stories (one per broadcast group)
    const stories = await Notification.aggregate([
      {
        $match: {
          isStory: true,
          expiresAt: { $gt: now },
          files: { $exists: true, $ne: [] }
        }
      },
      {
        $group: {
          _id: '$broadcastId', // Group by broadcastId to ensure one story per broadcast
          storyId: { $first: '$_id' },
          message: { $first: '$message' },
          files: { $first: '$files' },
          type: { $first: '$type' },
          priority: { $first: '$priority' },
          expiresAt: { $first: '$expiresAt' },
          createdAt: { $first: '$createdAt' }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $project: {
          _id: '$storyId',
          message: 1,
          files: 1,
          type: 1,
          priority: 1,
          expiresAt: 1,
          createdAt: 1,
          read: { $literal: false }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stories: stories,
      count: stories.length
    });
  } catch (err) {
    console.error('Error in getAdminStories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete admin story (deletes all notifications from that broadcast)
 */
exports.deleteAdminStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    // First, get the story to find its broadcastId
    const story = await Notification.findById(storyId);

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Delete all notifications from this broadcast using broadcastId
    const result = await Notification.deleteMany({
      broadcastId: story.broadcastId,
      isStory: true
    });

    console.log(`✅ Deleted ${result.deletedCount} story notifications from broadcast ${story.broadcastId}`);

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Story deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteAdminStory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Auto-cleanup old notifications (admin side only) - deletes notifications older than 3 days
 */
exports.cleanupOldNotifications = async (req, res) => {
  try {
    const twentyMinsAgo = new Date();
    twentyMinsAgo.setMinutes(twentyMinsAgo.getMinutes() - 20);

    // Delete all notifications older than 20 minutes (both admin and user side)
    const result = await Notification.deleteMany({
      createdAt: { $lt: twentyMinsAgo }
    });

    console.log(`✅ Auto-cleanup: Deleted ${result.deletedCount} old notifications (older than 20 minutes) - both admin and user side`);
    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} old notifications`
    });
  } catch (err) {
    console.error('Error in cleanupOldNotifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
