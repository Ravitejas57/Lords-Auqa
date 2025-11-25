const Admin = require('../models/Admin.model');
const { cloudinary } = require('../config/cloudinary');
const PendingUser = require("../models/PendingUser.model");
const RejectedUser = require("../models/RejectedUser.model");
const UserProfile = require('../models/UserProfile.model');
const UserAuth = require('../models/UserAuth.model');
const { buildProfileResponse } = require('../utils/profileResponse');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


// ✅ Get single admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findOne({ adminId });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Upload / update profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const admin = await Admin.findOne({ adminId });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Delete old image if exists
    if (admin.profileImage?.public_id) {
      await cloudinary.uploader.destroy(admin.profileImage.public_id);
    }

    admin.profileImage = { url: req.file.path, public_id: req.file.filename };
    await admin.save();

    res.json({ message: 'Profile image uploaded successfully!', admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const axios = require("axios");


exports.approvePendingUser = async (req, res) => {
  try {
    const { pendingUserId } = req.params;

    // 1️⃣ Find the pending user
    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return res.status(404).json({ success: false, message: "Pending user not found" });
    }

    // 2️⃣ Validate that password exists in pending user
    if (!pendingUser.password) {
      return res.status(400).json({
        success: false,
        message: "Pending user does not have a password. Cannot approve.",
      });
    }

    // 3️⃣ Create new record in UserProfile (for user data)
    const userProfile = new UserProfile({
      userId: pendingUser.userId,
      name: pendingUser.name,
      phoneNumber: pendingUser.phoneNumber,
      email: pendingUser.email || "",
      password: pendingUser.password, // ✅ CRITICAL: Transfer password from PendingUser
      bio: "",
      Region: "",
      country: "",
      state: "",
      district: "",
      pincode: "",
      address: "",
      profileImage: pendingUser.profileImage || {},
      seedsCount: 0,
      bonus: 0,
      price: 0,
      seedType: 'None',
      isApproved: true,
      createdBy: "user",
      message: "User approved by admin",
      assignedAdmin: pendingUser.assignedAdmin, // Preserve assigned admin
      createdAt: new Date(),
    });
    await userProfile.save();

    // 4️⃣ Delete from PendingUser collection
    await PendingUser.findByIdAndDelete(pendingUserId);

    console.log("✅ User approved successfully:", {
      userId: userProfile.userId,
      phoneNumber: userProfile.phoneNumber,
      name: userProfile.name
    });

    res.status(200).json({
      success: true,
      message: "User approved successfully. User can now login with their credentials.",
      userProfile,
    });
  } catch (error) {
    console.error("❌ Error approving pending user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to approve pending user",
      error: error.message,
    });
  }
};


// ============================================================
// ❌ Reject a Pending User → Move to RejectedUser collection
// ============================================================
exports.rejectPendingUser = async (req, res) => {
  try {
    const { pendingUserId } = req.params;
    const { reason } = req.body; // optional reason field

    const pendingUser = await PendingUser.findById(pendingUserId);
    if (!pendingUser) {
      return res.status(404).json({ success: false, message: "Pending user not found" });
    }

    // Move data to RejectedUser collection (use upsert to avoid unique-key errors)
    const rejectedData = {
      userId: pendingUser.userId,
      name: pendingUser.name,
      email: pendingUser.email,
      phoneNumber: pendingUser.phoneNumber,
      location: pendingUser.location || "",
      profileImage: pendingUser.profileImage,
      rejectedAt: new Date(),
      reason: reason || "Rejected by admin",
      status: "rejected",
      assignedAdmin: pendingUser.assignedAdmin, // Preserve assigned admin for filtering
    };

    // Use findOneAndUpdate with upsert: if an entry already exists for this userId, update it; otherwise create it.
    const rejectedUser = await RejectedUser.findOneAndUpdate(
      { userId: pendingUser.userId },
      { $set: rejectedData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Remove from pending
    await PendingUser.findByIdAndDelete(pendingUserId);

    res.status(200).json({
      success: true,
      message: "User rejected successfully",
      rejectedUser,
    });
  } catch (error) {
    console.error("Error rejecting pending user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to reject pending user",
      error: error.message,
    });
  }
};

// ============================================================
// 🕒 Get All Pending Users (filtered by assigned admin)
// ============================================================
exports.getAllPendingUsers = async (req, res) => {
  try {
    const { adminId } = req.query;

    // Build filter object
    const filter = {};
    if (adminId) {
      filter.assignedAdmin = adminId;
    }

    const pendingUsers = await PendingUser.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      pendingUsers,
    });
  } catch (error) {
    console.error("Error fetching pending users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending users",
    });
  }
};

// ============================================================
// ✅ Get All Approved Users (filtered by assigned admin)
// ============================================================
exports.getAllApprovedUsers = async (req, res) => {
  try {
    const { adminId } = req.query;

    // Build filter object
    const filter = {};
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

    const approvedUsersDocs = await UserProfile.find(filter).sort({ approvedAt: -1 });
    // Use forAdminView to filter out images still in delete window
    const approvedUsers = await Promise.all(
      approvedUsersDocs.map((user) => buildProfileResponse(user, { forAdminView: true }))
    );
    res.status(200).json({
      success: true,
      count: approvedUsers.length,
      approvedUsers,
    });
  } catch (error) {
    console.error("Error fetching approved users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved users",
    });
  }
};

// ============================================================
// ✅ Update User Status
// ============================================================
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, active, completed, cancelled'
      });
    }

    // Find and update user status
    const user = await UserProfile.findOneAndUpdate(
      { userId },
      { status },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================
// 🌱 Update User Seeds Information
// ============================================================
exports.updateUserSeeds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { seedsCount, bonus, price, seedType } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (seedsCount !== undefined) updateFields.seedsCount = parseInt(seedsCount) || 0;
    if (bonus !== undefined) updateFields.bonus = parseFloat(bonus) || 0;
    if (price !== undefined) updateFields.price = parseFloat(price) || 0;
    if (seedType !== undefined) updateFields.seedType = seedType;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No seed fields provided to update'
      });
    }

    // Find and update user seeds
    const user = await UserProfile.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User seeds updated successfully',
      user: {
        _id: user._id,
        userId: user.userId,
        seedsCount: user.seedsCount,
        bonus: user.bonus,
        price: user.price,
        seedType: user.seedType
      }
    });
  } catch (error) {
    console.error("❌ Error updating user seeds:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================
// 🔐 Reset User Password (Admin function)
// ============================================================
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    let { newPassword } = req.body;

    // Trim password to remove whitespace
    newPassword = newPassword?.trim();

    console.log(`🔐 Reset password request for userId: ${userId}`);
    console.log(`🔐 New password length: ${newPassword?.length}`);
    console.log(`🔐 New password (first 3 chars): ${newPassword?.substring(0, 3)}...`);

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find the user by userId (string field like "USER001")
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      console.log(`❌ UserProfile not found for userId: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ Found UserProfile: ${userProfile.name}, phone: ${userProfile.phoneNumber}`);

    // Find the corresponding auth record
    let userAuth = await UserAuth.findOne({ phoneNumber: userProfile.phoneNumber });

    // If UserAuth doesn't exist, create it
    if (!userAuth) {
      console.log(`⚠️ UserAuth not found for phone: ${userProfile.phoneNumber}. Creating new record...`);

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      userAuth = new UserAuth({
        name: userProfile.name,
        email: userProfile.email,
        phoneNumber: userProfile.phoneNumber,
        password: hashedPassword,
        approvalStatus: 'approved',
        assignedAdmin: userProfile.assignedAdmin?._id || userProfile.assignedAdmin
      });

      await userAuth.save();

      console.log(`✅ Created new UserAuth record and set password for ${userProfile.name}`);

      return res.status(200).json({
        success: true,
        message: 'Password set successfully'
      });
    }

    console.log(`✅ Found UserAuth for phone: ${userAuth.phoneNumber}`);
    console.log(`📝 Old password hash: ${userAuth.password?.substring(0, 20)}...`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`📝 New password hash: ${hashedPassword.substring(0, 20)}...`);

    // Update the password
    userAuth.password = hashedPassword;
    const savedAuth = await userAuth.save();

    console.log(`✅ Password saved successfully`);
    console.log(`📝 Saved password hash: ${savedAuth.password.substring(0, 20)}...`);

    // Verify the password was saved correctly by re-fetching
    const verifyAuth = await UserAuth.findOne({ phoneNumber: userProfile.phoneNumber });
    console.log(`🔍 Verification - Password in DB: ${verifyAuth.password.substring(0, 20)}...`);

    // Test if the new password matches
    const testMatch = await bcrypt.compare(newPassword, verifyAuth.password);
    console.log(`🔍 Test password match: ${testMatch}`);

    console.log(`✅ Password reset completed for user ${userId} (${userProfile.name})`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error("❌ Error resetting user password:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================
// 🚫 Get All Rejected Users (filtered by assigned admin)
// ============================================================
exports.getAllRejectedUsers = async (req, res) => {
  try {
    const { adminId } = req.query;

    // Build filter object
    const filter = {};
    if (adminId) {
      filter.assignedAdmin = adminId;
    }

    const rejectedUsers = await RejectedUser.find(filter).sort({ rejectedAt: -1 });
    res.status(200).json({
      success: true,
      count: rejectedUsers.length,
      rejectedUsers,
    });
  } catch (error) {
    console.error("Error fetching rejected users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rejected users",
    });
  }
};






// ============================================================
// ✅ Create a new Admin (Initial setup)
// ============================================================
exports.createAdmin = async (req, res) => {
  try {
    const { name, username, password, phoneNumber, email, location, bio } = req.body;

    // Validation
    if (!name || !username || !password || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, username, password, and phone number are required",
      });
    }

    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Username already exists. Try a different one.",
      });
    }

    // Generate unique adminId (e.g., ADM + timestamp)
    const adminId = `ADM${Date.now()}`;

    // Hash password before saving
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      adminId,
      name,
      username,
      password,
      // password: hashedPassword,
      phoneNumber,
      email,
      location,
      bio,
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Admin account created successfully!",
      admin: {
        adminId: newAdmin.adminId,
        name: newAdmin.name,
        username: newAdmin.username,
        phoneNumber: newAdmin.phoneNumber,
        email: newAdmin.email,
        location: newAdmin.location,
        bio: newAdmin.bio,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message,
    });
  }
};


// ✅ Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error: error.message,
    });
  }
};



// ✅ Get single admin by adminId
exports.getAdminById = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findOne({ adminId }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Error fetching admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin details",
      error: error.message,
    });
  }
};


// ✅ Get Admin Statistics for Profile
exports.getAdminStatistics = async (req, res) => {
  try {
    const { adminId } = req.query;

    let approvedCount, rejectedCount, pendingCount;

    if (adminId) {
      // Find the admin's ObjectId from adminId string
      const admin = await Admin.findOne({ adminId });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found"
        });
      }

      const adminObjectId = admin._id;

      // Get counts filtered by assigned admin
      approvedCount = await UserProfile.countDocuments({ assignedAdmin: adminObjectId });
      rejectedCount = await RejectedUser.countDocuments({ assignedAdmin: adminObjectId });
      pendingCount = await PendingUser.countDocuments({ assignedAdmin: adminObjectId });
    } else {
      // Get counts from all collections (for super admin or general view)
      approvedCount = await UserProfile.countDocuments();
      rejectedCount = await RejectedUser.countDocuments();
      pendingCount = await PendingUser.countDocuments();
    }

    // Calculate total users managed (approved + rejected)
    const totalUsers = approvedCount + rejectedCount;

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,           // Approved + Rejected
        approvedRequests: approvedCount,  // Only approved users
        pendingApprovals: pendingCount    // Only pending users
      }
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      error: error.message,
    });
  }
};


// ✅ Update Admin by adminId
exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const updateData = req.body;

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Handle profile image upload if file is provided
    if (req.file) {
      // Delete old profile image from cloudinary if exists
      if (admin.profileImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(admin.profileImage.public_id);
        } catch (err) {
          console.log('Error deleting old image:', err);
        }
      }
      
      // Set new profile image
      updateData.profileImage = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    // Optional: If updating password, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update the admin record
    const updatedAdmin = await Admin.findOneAndUpdate(
      { adminId },
      { $set: updateData },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update admin",
      error: error.message,
    });
  }
};

// ✅ Delete Admin by adminId
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    await Admin.deleteOne({ adminId });

    res.status(200).json({
      success: true,
      message: `Admin (${adminId}) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      error: error.message,
    });
  }
};


exports.adminAddUser = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      email,
      country,
      state,
      district,
      fullAddress,
      pincode,
      language,
      notes,
      password,
      seedsCount,
      bonus,
      price,
      seedType,
      assignedAdmin
    } = req.body;

    // Validation
    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password is required and must be at least 6 characters",
      });
    }

    // Extract last 10 digits of phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const last10Digits = cleanPhoneNumber.slice(-10);

    // Validate phone number
    if (last10Digits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. Must be 10 digits.",
      });
    }

    console.log("📞 Processing user creation for phone:", last10Digits);

    // Check if user already exists in UserAuth
    const existingUser = await UserAuth.findOne({ phoneNumber: last10Digits });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number",
      });
    }

    // Check if user already exists in UserProfile
    const existingProfile = await UserProfile.findOne({ phoneNumber: last10Digits });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "User profile already exists with this phone number",
      });
    }

    // Generate unique userId
    const userId = `USER${Date.now()}`;

    // Create new record in UserAuth (for login authentication)
    const userAuth = new UserAuth({
      name: name.trim(),
      email: email ? email.trim() : undefined,
      phoneNumber: last10Digits,
      password,
      approvalStatus: "approved",
      assignedAdmin: req.user?._id,
    });
    await userAuth.save();

    // Parse seeds information
    const parsedSeedsCount = parseInt(seedsCount) || 0;
    const parsedBonus = parseFloat(bonus) || 0;
    const parsedPrice = parseFloat(price) || 0;
    const validSeedType = seedType || 'None';

    // Create new record in UserProfile (for user data)
    const userProfile = new UserProfile({
      userId: userId,
      name: name.trim(),
      phoneNumber: last10Digits,
      email: email ? email.trim() : "",
      defaultLanguage: language || "English",
      country: country || "",
      state: state || "",
      district: district || "",
      address: fullAddress || "",
      pincode: pincode || "",
      message: notes || "User added by admin",
      isApproved: true,
      createdBy: "admin",
      password: password,
      seedsCount: parsedSeedsCount,
      bonus: parsedBonus,
      price: parsedPrice,
      seedType: validSeedType,
      assignedAdmin: assignedAdmin || null, // Assign the admin who created this user
      createdAt: new Date(),
    });
    await userProfile.save();

    console.log("✅ User created successfully:", {
      userId: userProfile.userId,
      phoneNumber: userProfile.phoneNumber,
      seedsCount: userProfile.seedsCount,
      seedType: userProfile.seedType
    });

    res.status(201).json({
      success: true,
      message: "User created successfully and added to the system.",
      user: {
        userId: userProfile.userId,
        name: userProfile.name,
        phoneNumber: userProfile.phoneNumber,
        email: userProfile.email,
        seedsCount: userProfile.seedsCount,
        bonus: userProfile.bonus,
        price: userProfile.price,
        seedType: userProfile.seedType,
      },
    });
  } catch (error) {
    console.error("❌ Error creating user by admin:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// ✅ Send Image Approval SMS to User
exports.sendImageApprovalSMS = async (req, res) => {
  try {
    const { phoneNumber, userName, feedback, action } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    if (!action || !['approve', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action (approve/decline) is required"
      });
    }

    // Extract last 10 digits
    const cleanNumber = String(phoneNumber).replace(/\D/g, '');
    const last10Digits = cleanNumber.slice(-10);

    if (last10Digits.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format"
      });
    }

    

  
  } catch (error) {
    console.error("❌ Error in sendImageApprovalSMS:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


// ===================== ADMIN SIGNUP =====================
exports.adminSignup = async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;

    // Check if username or phone number already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { phoneNumber }]
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'Username or phone number already exists' });
    }

    // ✅ Generate a unique adminId
    const adminId = "ADMIN" + Date.now();
    const name = username;
    
    // ✅ Create admin data object WITHOUT email field
    // Using MongoDB native insertOne to ensure email field is completely omitted
    const adminData = {
      adminId,
      name,
      username,
      phoneNumber,
      password, // ⚠️ Hash in production
      location: '',
      totalUsers: 0,
      approvedRequests: 0,
      pendingApprovals: 0,
      approvedUsers: [],
      pendingUsers: [],
      rejectedUsers: [],
      role: 'admin',
      bio: '',
      createdAt: new Date(),
    };
    
    // Use MongoDB's native insertOne to ensure email field is completely omitted
    const result = await Admin.collection.insertOne(adminData);
    const newAdmin = await Admin.findById(result.insertedId);

    // ✅ Return success (no JWT)
    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: newAdmin._id,
        adminId: newAdmin.adminId,
        name: newAdmin.name,
        username: newAdmin.username,
        phoneNumber: newAdmin.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error during admin signup:", error.message);
    res.status(500).json({ message: 'Server error during admin signup' });
  }
};
