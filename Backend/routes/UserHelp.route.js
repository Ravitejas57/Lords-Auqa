const express = require('express');
const router = express.Router();
const userHelpController = require('../controllers/UserHelp.controller');

// ===== USER ROUTES =====

// User sends initial help message to admin
router.post('/send', userHelpController.sendMessage);

// User replies to existing conversation
router.post('/reply', userHelpController.userReply);

// Get all conversations for a specific user
router.get('/conversations/:userId', userHelpController.getUserConversations);

// Get a specific conversation by ID
router.get('/conversation/:conversationId', userHelpController.getConversationById);

// Mark messages as read
router.post('/mark-read', userHelpController.markAsRead);

// Get unread message count for user
router.get('/unread-count/:userId', userHelpController.getUserUnreadCount);

// Mark all messages as read for user
router.post('/mark-all-read/:userId', userHelpController.markAllAsReadForUser);

// ===== ADMIN ROUTES =====

// Get all conversations (for super admin) - must be before /:adminId
router.get('/admin/all/conversations', userHelpController.getAllConversations);

// Get unread message count for admin - must be before /:adminId
router.get('/admin/unread-count/:adminId', userHelpController.getAdminUnreadCount);

// Get conversation statistics for admin - must be before /:adminId
router.get('/admin/stats/:adminId', userHelpController.getConversationStats);

// Mark all messages as read for admin
router.post('/admin/mark-all-read/:adminId', userHelpController.markAllAsReadForAdmin);

// Auto-cleanup old conversations (admin only)
router.post('/admin/cleanup', userHelpController.cleanupOldConversations);

// Admin replies to a conversation
router.post('/admin/reply', userHelpController.adminReply);

// Close a conversation
router.post('/admin/close', userHelpController.closeConversation);

// Get all conversations for a specific admin - MUST BE LAST (catches all /admin/:anything)
router.get('/admin/:adminId', userHelpController.getAdminConversations);

module.exports = router;