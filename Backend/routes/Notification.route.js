const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/Notification.controller');
const { verifyToken, adminOnly } = require('../middleware/auth.middleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Configure multer for file uploads (allow multiple files, max 5 files)
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
});

// Admin endpoints
router.post('/admin/broadcast', verifyToken, adminOnly, upload.array('files', 5), notificationController.createBroadcastNotification);
router.get('/admin/history', verifyToken, adminOnly, notificationController.getNotificationHistory);
router.get('/admin/stories', verifyToken, adminOnly, notificationController.getAdminStories);
router.delete('/admin/story/:storyId', verifyToken, adminOnly, notificationController.deleteAdminStory);
router.post('/admin/cleanup', verifyToken, adminOnly, notificationController.cleanupOldNotifications);

// Public user endpoints
router.get('/latest-public', notificationController.getLatestPublicNotification);
router.post('/create', notificationController.createNotification); // internal system notifications
router.post('/create-protected', verifyToken, notificationController.createNotification); // protected create
router.get('/user/:userId', notificationController.getUserNotifications);
router.get('/user/:userId/unread', notificationController.getUnreadNotifications);
router.get('/user/:userId/stories', notificationController.getActiveStories); // Get active stories
router.put('/mark-read/:id', verifyToken, notificationController.markAsRead);
router.put('/mark-all-read/:userId', verifyToken, notificationController.markAllAsRead);
router.delete('/delete/:id', verifyToken, notificationController.deleteNotification);
router.delete('/delete-all/:userId', verifyToken, notificationController.deleteAllNotifications);
router.get('/count/:userId', verifyToken, notificationController.getNotificationCount);

module.exports = router;
