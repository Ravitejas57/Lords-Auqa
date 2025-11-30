// routes/admin.route.js
const express = require("express");
const router = express.Router();


const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

const {
  approvePendingUser,
  rejectPendingUser,
  getAllPendingUsers,
  getAllApprovedUsers,
  getAllRejectedUsers,
  createAdmin,
  getAdminProfile,
  uploadProfileImage,
  getAllAdmins,
  getAdminById,
  getAdminStatistics,
  updateAdmin,
  deleteAdmin,
  updateUserStatus,
  updateUserSeeds,
  resetUserPassword,
  adminAddUser,
  adminSignup
} = require("../controllers/admin.controller");
// ===================== Admin Routes =====================

router.post('/admin-signup', adminSignup)


// ✅ Approve a pending user
router.post("/approve/:pendingUserId", approvePendingUser);

// (Later you can add:
router.post("/reject/:pendingUserId", rejectPendingUser);
router.get("/pending", getAllPendingUsers);
router.get("/approved", getAllApprovedUsers);
router.get("/rejected", getAllRejectedUsers);
router.put("/update-status/:userId", updateUserStatus);
router.put("/update-seeds/:userId", updateUserSeeds);
router.put("/reset-password/:userId", resetUserPassword);
router.post("/createAdmin", createAdmin);
router.post("/add-user", adminAddUser);
router.get("/getAdmins", getAllAdmins);
router.get("/getAdmin/:adminId", getAdminById);
router.get("/statistics", getAdminStatistics);
router.put("/update/:adminId", upload.single('profileImage'), updateAdmin);
router.delete("/delete/:adminId", deleteAdmin);



const adminController = require('../controllers/admin.controller');



// Get admin profile
router.get('/:adminId', getAdminProfile);

// route.get('/getAllAdmins',getAllAdmins);

// Upload / update profile image
router.put('/upload-profile-image/:adminId', upload.single('profileImage'), uploadProfileImage);

// Manual cleanup trigger (admin only)
router.post('/cleanup', async (req, res) => {
  try {
    const cleanupService = require('../services/cleanupService');
    const result = await cleanupService.runImmediately();

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      result
    });
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

module.exports = router;
