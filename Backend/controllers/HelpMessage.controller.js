const HelpMessage = require('../models/HelpMessage.model');
const UserProfile = require('../models/UserProfile.model');

// Send a new help message (User)
exports.sendMessage = async (req, res) => {
  try {
    const { userId, userName, userEmail, userPhone, message } = req.body;

    if (!userId || !userName || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and message are required'
      });
    }

    const helpMessage = new HelpMessage({
      userId,
      userName,
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      message,
      status: 'Pending'
    });

    await helpMessage.save();

    console.log('📨 New help message created:', helpMessage._id);

    // Emit socket event if io is available
    if (req.app.get('io')) {
      req.app.get('io').emit('new-help-message', helpMessage);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      helpMessage
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

// Get all messages for a specific user
exports.getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const messages = await HelpMessage.find({ userId })
      .sort({ timestamp: 1 }); // Oldest first for chat display

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

// Get all help messages (Admin)
exports.getAllMessages = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter by status

    const filter = {};
    if (status && (status === 'Pending' || status === 'Resolved')) {
      filter.status = status;
    }

    const messages = await HelpMessage.find(filter)
      .sort({ timestamp: -1 }); // Newest first for admin view

    res.status(200).json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

// Reply to a help message (Admin)
exports.replyToMessage = async (req, res) => {
  try {
    const { messageId, reply, repliedBy } = req.body;

    if (!messageId || !reply) {
      return res.status(400).json({
        success: false,
        message: 'Message ID and reply are required'
      });
    }

    const helpMessage = await HelpMessage.findById(messageId);

    if (!helpMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    helpMessage.reply = reply;
    helpMessage.repliedAt = new Date();
    helpMessage.repliedBy = repliedBy || 'Admin';
    helpMessage.status = 'Resolved'; // Auto-mark as resolved when replied

    await helpMessage.save();

    console.log('💬 Admin replied to message:', messageId);

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('help-message-reply', helpMessage);
    }

    // TODO: Send email notification to user
    // For now, we'll just log it
    console.log(`📧 Email notification should be sent to: ${helpMessage.userEmail || helpMessage.userPhone}`);

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      helpMessage
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

// Mark message as resolved (Admin)
exports.markAsResolved = async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
    }

    const helpMessage = await HelpMessage.findById(messageId);

    if (!helpMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    helpMessage.status = 'Resolved';
    await helpMessage.save();

    console.log('✅ Message marked as resolved:', messageId);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('help-message-resolved', helpMessage);
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as resolved',
      helpMessage
    });
  } catch (error) {
    console.error('Error marking message as resolved:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as resolved',
      error: error.message
    });
  }
};

// Get message statistics (Admin)
exports.getMessageStats = async (req, res) => {
  try {
    const totalMessages = await HelpMessage.countDocuments();
    const pendingMessages = await HelpMessage.countDocuments({ status: 'Pending' });
    const resolvedMessages = await HelpMessage.countDocuments({ status: 'Resolved' });

    res.status(200).json({
      success: true,
      stats: {
        total: totalMessages,
        pending: pendingMessages,
        resolved: resolvedMessages
      }
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};
