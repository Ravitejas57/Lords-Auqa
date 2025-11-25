const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const hatcheryController = require('../controllers/Hatchery.controller');

// ===== Hatchery Routes =====

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Hatchery routes are working!' });
});

// Create new hatchery
router.post('/create', hatcheryController.createHatchery);

// Get all hatcheries for a user
router.get('/user/:userId', hatcheryController.getUserHatcheries);

// Get single hatchery by ID
router.get('/:id', hatcheryController.getHatcheryById);

// Update hatchery
router.put('/update/:id', hatcheryController.updateHatchery);

// Delete hatchery
router.delete('/delete/:id', hatcheryController.deleteHatchery);

// Upload image to hatchery (with Cloudinary)
router.post('/upload-image/:id', upload.array('images', 4), hatcheryController.uploadHatcheryImage);

// Delete image from hatchery
router.delete('/delete-image/:id/:imageIndex', hatcheryController.deleteHatcheryImage);

// Add growth data
router.post('/growth-data/:id', hatcheryController.addGrowthData);


// Approve hatchery and reset images
router.post('/approve', hatcheryController.approveHatchery);

// Delete hatchery and reset slots (without creating purchase history)
router.post('/delete-and-reset', hatcheryController.deleteAndResetHatchery);

// Get transaction history
router.get('/transactions/admin', hatcheryController.getAdminTransactionHistory);
router.get('/transactions/user/:userId', hatcheryController.getUserTransactionHistory);

module.exports = router;
