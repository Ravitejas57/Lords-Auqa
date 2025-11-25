const UserProfile = require('../models/UserProfile.model');
const Admin = require('../models/Admin.model');
const User = require('../models/UserAuth.model');

const PendingUser = require("../models/PendingUser.model");
const RejectedUser = require("../models/RejectedUser.model");

const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require("dotenv").config();

/**
 * Generate JWT Token
 * @param {Object} user - User object with userId, phoneNumber, name, email
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    phoneNumber: user.phoneNumber,
    name: user.name,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// =================== GET ALL ADMINS FOR DROPDOWN ===================
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, '_id name username email').sort({ name: 1 });

    res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Error fetching admins:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin list",
    });
  }
};

// =================== NEW PASSWORD-ONLY SIGNUP ===================
exports.userSignup = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, confirmPassword, assignedAdmin } = req.body;

    if (!name || !phoneNumber || !password || !confirmPassword || !assignedAdmin) {
      return res.status(400).json({
        success: false,
        message: "Name, phone number, password, and admin selection are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists in UserProfile (approved users)
    const existingApprovedUser = await UserProfile.findOne({ phoneNumber });
    if (existingApprovedUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number",
      });
    }

    // Check if already pending approval
    const existingPending = await PendingUser.findOne({ phoneNumber });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        pendingApproval: true,
        alreadySignedUp: true,
        message: "You have already signed up with this mobile number. Please wait for admin approval to access the system.",
      });
    }

    // Check if user was previously rejected - allow them to sign up again
    const previouslyRejected = await RejectedUser.findOne({ phoneNumber });
    let previousRejectionInfo = null;
    if (previouslyRejected) {
      previousRejectionInfo = {
        rejectedAt: previouslyRejected.rejectedAt,
        reason: previouslyRejected.reason,
      };
      // Remove from RejectedUser collection since they're signing up again
      await RejectedUser.findByIdAndDelete(previouslyRejected._id);
    }

    // Generate unique userId
    const userId = `USER${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Verify admin exists
    const admin = await Admin.findById(assignedAdmin);
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Selected admin does not exist",
      });
    }

    // Save to PendingUser collection with rejection history if applicable
    const newPendingUser = new PendingUser({
      userId,
      name,
      email: email || undefined,
      phoneNumber,
      password,
      assignedAdmin,
      status: "pending",
      previousRejection: previousRejectionInfo, // Store rejection history
    });
    await newPendingUser.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully! Your account is pending admin approval.",
      pendingUser: newPendingUser,
    });
  } catch (error) {
    console.error("Error during signup:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};

// =================== NEW PASSWORD-ONLY LOGIN ===================
exports.userLogin = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    // Check if user exists in UserProfile collection (approved users)
    const user = await UserProfile.findOne({ phoneNumber });

    // If not in UserProfile, check if they're pending approval
    if (!user) {
      const pendingUser = await PendingUser.findOne({ phoneNumber });
      if (pendingUser) {
        return res.status(403).json({
          success: false,
          pendingApproval: true,
          message: "Thank you for registering! Your account is pending admin approval. Please wait for approval to access the system.",
        });
      }

      // User doesn't exist at all - not registered
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: "This mobile number is not registered. Please sign up first.",
      });
    }

    // Check approval status (UserProfile uses isApproved boolean)
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: "Your account is not yet approved. Please wait for admin approval.",
      });
    }

    // Check if password exists
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This user has not set a password. Please contact support.",
      });
    }

    // Compare password - supports both plain text and bcrypt hashed passwords
    let isPasswordValid = false;

    // First try plain text comparison
    if (password === user.password) {
      isPasswordValid = true;
    } else {
      // Try bcrypt comparison (for hashed passwords from admin reset)
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (err) {
        // If bcrypt fails, password is not hashed, and plain text didn't match
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password. Please try again"
      });
    }

    // ✅ Generate JWT token
    const token = generateToken(user);
    console.log(`Generated JWT token (password login) for user ${user._id}: ${token}`);

    // ✅ Return user data including _id and JWT token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        _id: user._id.toString(),           // MongoDB ObjectId for notifications
        userId: user.userId,                 // Custom userId (e.g., "USR-001")
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};


// =================== 3️⃣ Check if User Has Password ===================
exports.checkUserPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: "This mobile number is not registered. Please sign up first."
      });
    }

    // Check approval status
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: "Your mobile number is verified. Kindly wait for the organization's approval to access the system."
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected by the organization. Please contact support for more information."
      });
    }

    // Check if password exists
    const hasPassword = !!user.password;

    res.status(200).json({
      success: true,
      hasPassword,
      message: hasPassword ? "User has password" : "User needs to create password"
    });
  } catch (error) {
    console.error("Error checking user password:", error.message);
    res.status(500).json({ success: false, message: "Failed to check user password" });
  }
};


// =================== 4️⃣ Login with Password ===================
exports.userLoginPassword = async (req, res) => {
  try {
    let { phoneNumber, password } = req.body;

    // Trim password to remove whitespace
    password = password?.trim();

    if (!phoneNumber || !password) {
      return res.status(400).json({ success: false, message: "Phone number and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: "This mobile number is not registered. Please sign up first."
      });
    }

    // Check approval status
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: "Your mobile number is verified. Kindly wait for the organization's approval to access the system."
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: "Your account has been rejected by the organization. Please contact support for more information."
      });
    }

    // Check if password exists (user may be OTP-only)
    if (!user.password) {
      return res.status(400).json({ success: false, message: "This user has not set a password. Please create a password first." });
    }

    console.log(`🔐 Login attempt for phone: ${phoneNumber}`);
    console.log(`📝 Stored password hash: ${user.password.substring(0, 20)}...`);
    console.log(`📝 Entered password length: ${password.length}`);
    console.log(`📝 Entered password (first 3 chars): ${password?.substring(0, 3)}...`);

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔍 Password match result: ${isMatch}`);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    // ✅ Generate JWT token
    const token = generateToken(user);
    console.log(`Generated JWT token (password login) for user ${user._id}: ${token}`);

    // ✅ Return user data including _id and JWT token
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error("Error during password login:", error.message);
    res.status(500).json({ success: false, message: "Failed to login with password" });
  }
};


// =================== 5️⃣ Create Password for User ===================
exports.createUserPassword = async (req, res) => {
  try {
    const { phoneNumber, password, confirmPassword } = req.body;

    if (!phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Phone number, password and confirm password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this phone number" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password created successfully" });
  } catch (error) {
    console.error("Error creating password:", error.message);
    res.status(500).json({ success: false, message: "Failed to create password" });
  }
};





// ===================== ADMIN LOGIN =====================
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Validate password - supports both plain text and bcrypt hashed passwords
    let isPasswordValid = false;

    // First try plain text comparison
    if (password === admin.password) {
      isPasswordValid = true;
    } else {
      // Try bcrypt comparison (for hashed passwords)
      try {
        isPasswordValid = await bcrypt.compare(password, admin.password);
      } catch (err) {
        // If bcrypt fails, password is not hashed, and plain text didn't match
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token for admin
    const token = jwt.sign(
      {
        userId: admin.adminId,
        username: admin.username,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Get admin profile details
    const adminProfile = await Admin.findOne({ phoneNumber: admin.phoneNumber });
    console.log("Admin profile retrieved:", adminProfile);
    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        profile: adminProfile
      }
    });
  } catch (error) {
    console.error("Error during admin login:", error.message);
    res.status(500).json({ message: 'Server error during admin login' });
  }
}
