const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const userController = require('../controllers/UserProfile.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/password-reset/user', userController.resetPasswordByUserId);

router.get('/phone/:phoneNumber', userController.getUserProfileByPhone);
router.put('/phone/:phoneNumber', userController.updateUserProfileByPhone);

// ===== User Profile Routes =====

// Create user profile
router.post('/create', userController.createUserProfile);

// Create or update authenticated user's profile
router.post('/me', verifyToken, userController.createOrUpdateMyProfile);

// Get authenticated user's profile
router.get('/me', verifyToken, userController.getMyProfile);

// Get all users
router.get('/all', userController.getAllUsers);

// Get user by userId
router.get('/user/:userId', userController.getUserById);

// Get user by phone number
router.get('/phone/:phoneNumber', userController.getUserByPhone);

// Update user profile by userId
router.put('/update/:userId', upload.single('profileImage'), userController.updateUserProfile);

// Update user profile by phone number
router.put(
  "/update-phone/:phone",
  upload.single("profileImage"), // handles the file
  userController.updatePhone
);

// Get user statistics
router.get('/stats/:userId', userController.getUserStats);

// Get user images
router.get('/images/:userId', userController.getUserImages);

// Image upload routes (protected with JWT)
router.post('/upload-profile-image/:userId',  upload.single('userImage'), userController.uploadProfileImage);
router.put('/update-profile-image/:userId',  upload.single('userImage'), userController.updateProfileImage);
router.delete('/delete-profile-image/:userId', userController.deleteProfileImage);

//router.post('/upload-images/:userId', upload.array('images', 4), userController.uploadMultipleImages);
router.delete('/delete-image/:userId/:publicId',  userController.deleteSingleImage);

// Delete hatchery image (from Cloudinary and database)
router.delete('/delete-hatchery-image/:userId', userController.deleteHatcheryImage);

router.post('/upload-images/:userId', (req, res, next) => {
  console.log('📸 Upload images route reached!');
  next();
}, upload.array('images', 4), userController.uploadMultipleImages);

// Upload single image to user's hatchery (auto-creates default hatchery if needed)
router.post('/upload-image/:userId', (req, res, next) => {
  console.log('📸 Upload single image route reached for user:', req.params.userId);
  next();
}, upload.array('images', 1), userController.uploadUserHatcheryImage);

// ===== Settings Update Routes (Protected) =====

// Change password
router.put('/change-password', verifyToken, userController.changePassword);

// Update email
router.put('/update-email', verifyToken, userController.updateEmail);

// Update phone number
router.put('/update-phone-number', verifyToken, userController.updatePhoneNumber);

// Update profile picture (using JWT token)
router.put('/update-my-profile-picture', verifyToken, upload.single('profileImage'), userController.updateMyProfilePicture);


module.exports = router;