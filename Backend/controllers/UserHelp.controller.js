const Conversation = require('../models/UserHelp.model');
const UserProfile = require('../models/UserProfile.model');
const Admin = require('../models/Admin.model');

// ===== USER ENDPOINTS =====

// User sends initial help message to admin
exports.sendMessage = async (req, res) => {
  try {
    const { subject, message, adminId } = req.body;
    const { userId } = req.body; // In production, get from req.user after auth middleware

    if (!userId || !subject || !message || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'User ID, subject, message, and admin ID are required'
      });
    }

    // Fetch user and admin details
    const user = await UserProfile.findById(userId);
    const admin = await Admin.findById(adminId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Create new conversation with initial message
    const conversation = new Conversation({
      userId,
      adminId,
      subject,
      status: 'open',
      messages: [{
        sender: 'user',
        senderName: user.name,
        senderId: userId,
        message,
        timestamp: new Date(),
        isRead: false
      }]
    });

    await conversation.save();

    console.log('📨 New help conversation created:', conversation._id);

    // Emit socket event to admin for real-time notification
    if (req.app.get('io')) {
      req.app.get('io').to(adminId.toString()).emit('new-help-message', {
        conversationId: conversation._id,
        userId,
        userName: user.name,
        userPhone: user.phoneNumber,
        subject,
        message,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully to admin',
      conversation
    });
  } catch (error) {
    console.error('Error sending help message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// User replies to existing conversation
exports.userReply = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const { userId } = req.body; // In production, get from req.user

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message are required'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify user owns this conversation
    if (conversation.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to conversation'
      });
    }

    const user = await UserProfile.findById(userId);

    // Add new message to conversation
    conversation.messages.push({
      sender: 'user',
      senderName: user.name,
      senderId: userId,
      message,
      timestamp: new Date(),
      isRead: false
    });

    conversation.status = 'open'; // Reopen if it was closed
    await conversation.save();

    console.log('💬 User replied to conversation:', conversationId);

    // Emit socket event to admin
    if (req.app.get('io')) {
      req.app.get('io').to(conversation.adminId.toString()).emit('user-reply', {
        conversationId: conversation._id,
        userName: user.name,
        message,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      conversation
    });
  } catch (error) {
    console.error('Error sending user reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

// Get all conversations for a specific user
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const conversations = await Conversation.find({ userId })
      .populate('adminId', 'name phoneNumber email')
      .sort({ updatedAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// Get a specific conversation by ID
exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('userId', 'name phoneNumber email')
      .populate('adminId', 'name phoneNumber email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
};

// ===== ADMIN ENDPOINTS =====

// Get all conversations for a specific admin
exports.getAdminConversations = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    const conversations = await Conversation.find({ adminId })
      .populate('userId', 'name phoneNumber email')
      .sort({ updatedAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// Get all conversations (for super admin)
exports.getAllConversations = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter by status

    const filter = {};
    if (status && (status === 'open' || status === 'closed')) {
      filter.status = status;
    }

    const conversations = await Conversation.find(filter)
      .populate('userId', 'name phoneNumber email')
      .populate('adminId', 'name phoneNumber email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error fetching all conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
};

// Admin replies to a conversation
exports.adminReply = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const { adminId } = req.body; // In production, get from req.admin after auth middleware

    if (!conversationId || !message || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID, message, and admin ID are required'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify admin owns this conversation
    if (conversation.adminId.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to conversation'
      });
    }

    const admin = await Admin.findById(adminId);

    // Add admin reply to conversation
    conversation.messages.push({
      sender: 'admin',
      senderName: admin.name,
      senderId: adminId,
      message,
      timestamp: new Date(),
      isRead: false
    });

    await conversation.save();

    console.log('💬 Admin replied to conversation:', conversationId);

    // Emit socket event to user for real-time notification
    if (req.app.get('io')) {
      req.app.get('io').to(conversation.userId.toString()).emit('admin-reply', {
        conversationId: conversation._id,
        adminName: admin.name,
        message,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully to user',
      conversation
    });
  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

// Close a conversation
exports.closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.status = 'closed';
    await conversation.save();

    console.log('✅ Conversation closed:', conversationId);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(conversation.userId.toString()).emit('conversation-closed', {
        conversationId: conversation._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation closed successfully',
      conversation
    });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close conversation',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId, userType } = req.body; // userType: 'user' or 'admin'

    if (!conversationId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and user type are required'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark messages from the opposite party as read
    const senderToMarkRead = userType === 'user' ? 'admin' : 'user';

    conversation.messages.forEach(msg => {
      if (msg.sender === senderToMarkRead && !msg.isRead) {
        msg.isRead = true;
      }
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      conversation
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// Get conversation statistics for admin dashboard
exports.getConversationStats = async (req, res) => {
  try {
    const { adminId } = req.params;

    const totalConversations = await Conversation.countDocuments({ adminId });
    const openConversations = await Conversation.countDocuments({ adminId, status: 'open' });
    const closedConversations = await Conversation.countDocuments({ adminId, status: 'closed' });

    // Count unread messages
    const conversations = await Conversation.find({ adminId });
    let unreadCount = 0;

    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.sender === 'user' && !msg.isRead) {
          unreadCount++;
        }
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalConversations,
        open: openConversations,
        closed: closedConversations,
        unreadMessages: unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

// Mark all messages as read for user (all admin messages in user's conversations)
exports.markAllAsReadForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({ userId });
    let markedCount = 0;

    for (const conv of conversations) {
      let modified = false;
      conv.messages.forEach(msg => {
        if (msg.sender === 'admin' && !msg.isRead) {
          msg.isRead = true;
          markedCount++;
          modified = true;
        }
      });
      if (modified) {
        await conv.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Marked ${markedCount} messages as read`,
      markedCount
    });
  } catch (error) {
    console.error('Error marking all messages as read for user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// Mark all messages as read for admin (all user messages in admin's conversations)
exports.markAllAsReadForAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const conversations = await Conversation.find({ adminId });
    let markedCount = 0;

    for (const conv of conversations) {
      let modified = false;
      conv.messages.forEach(msg => {
        if (msg.sender === 'user' && !msg.isRead) {
          msg.isRead = true;
          markedCount++;
          modified = true;
        }
      });
      if (modified) {
        await conv.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Marked ${markedCount} messages as read`,
      markedCount
    });
  } catch (error) {
    console.error('Error marking all messages as read for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// Get unread message count for user (messages from admin that user hasn't read)
exports.getUserUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({ userId });
    let unreadCount = 0;

    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.sender === 'admin' && !msg.isRead) {
          unreadCount++;
        }
      });
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching user unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

// Get unread message count for admin (messages from user that admin hasn't read)
exports.getAdminUnreadCount = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Find the admin by their adminId string to get their MongoDB ObjectId
    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Query conversations using the admin's MongoDB ObjectId
    const conversations = await Conversation.find({ adminId: admin._id });
    let unreadCount = 0;

    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.sender === 'user' && !msg.isRead) {
          unreadCount++;
        }
      });
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching admin unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

/**
 * Auto-cleanup old conversations (admin side only) - closes conversations older than 3 days
 */
exports.cleanupOldConversations = async (req, res) => {
  try {
    const twentyMinsAgo = new Date();
    twentyMinsAgo.setMinutes(twentyMinsAgo.getMinutes() - 20);

    // Delete old conversations (both open and closed) older than 20 minutes
    const result = await Conversation.deleteMany({
      updatedAt: { $lt: twentyMinsAgo }
    });

    console.log(`✅ Auto-cleanup: Deleted ${result.deletedCount} old conversations (older than 20 minutes)`);
    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} old conversations`
    });
  } catch (err) {
    console.error('Error in cleanupOldConversations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
