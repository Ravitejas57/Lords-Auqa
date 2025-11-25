const express = require('express');
const router = express.Router();
const helpMessageController = require('../controllers/HelpMessage.controller');

// ===== User Routes =====

// Send a new help message
router.post('/sendMessage', helpMessageController.sendMessage);

// Get all messages for a specific user
router.get('/getMessages/:userId', helpMessageController.getUserMessages);

// ===== Admin Routes =====

// Get all help messages (with optional status filter)
router.get('/getAllMessages', helpMessageController.getAllMessages);

// Reply to a help message
router.post('/reply', helpMessageController.replyToMessage);

// Mark message as resolved
router.post('/markAsResolved', helpMessageController.markAsResolved);

// Get message statistics
router.get('/stats', helpMessageController.getMessageStats);

module.exports = router;
