const { cloudinary } = require('../config/cloudinary');
const UserProfile = require('../models/UserProfile.model');
const UserAuth = require('../models/UserAuth.model');
const Hatchery = require('../models/Hatchery.model');
const { buildProfileResponse } = require('../utils/profileResponse');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

exports.resetPasswordByUserId = async (req, res) => {
  try {
    const { userId, newPassword, adminId } = req.body;

    // Validate input
    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Find user by ObjectId
    const user = await UserProfile.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password using findByIdAndUpdate to ensure it's saved correctly
    const updatedUser = await UserProfile.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true, runValidators: false } // runValidators: false to skip minlength check on hash
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password. User not found after update.'
      });
    }

    // Verify the password was saved correctly
    if (!updatedUser.password || updatedUser.password !== hashedPassword) {
      console.error('Password save verification failed');
      console.error('Expected hash:', hashedPassword.substring(0, 20) + '...');
      console.error('Saved hash:', updatedUser.password ? updatedUser.password.substring(0, 20) + '...' : 'null');
      return res.status(500).json({
        success: false,
        message: 'Failed to save password. Please try again.'
      });
    }

    // Also update password in UserAuth model if it exists (for login authentication)
    try {
      const userAuth = await UserAuth.findOne({ phoneNumber: updatedUser.phoneNumber });
      if (userAuth) {
        await UserAuth.findByIdAndUpdate(
          userAuth._id,
          { password: hashedPassword },
          { runValidators: false }
        );
        console.log(`Password also updated in UserAuth for phone: ${updatedUser.phoneNumber}`);
      } else {
        console.log(`UserAuth not found for phone: ${updatedUser.phoneNumber}, skipping UserAuth update`);
      }
    } catch (authError) {
      console.error('Error updating password in UserAuth:', authError);
      // Don't fail the request if UserAuth update fails, as UserProfile is the primary model
    }

    // Log successful password reset with verification
    console.log(`Password reset successful:
      - Admin: ${adminId || 'Unknown'}
      - User: ${updatedUser.name} (${updatedUser.phoneNumber})
      - User ID: ${updatedUser._id}
      - Password hash saved: ${updatedUser.password ? 'Yes' : 'No'}
      - Password hash length: ${updatedUser.password ? updatedUser.password.length : 0}
      - Password hash starts with: ${updatedUser.password ? updatedUser.password.substring(0, 10) : 'N/A'}
      - Timestamp: ${new Date().toISOString()}
    `);

    // Log the admin action
    console.log(`Password reset action:
      - Admin: ${adminId || 'Unknown'}
      - User: ${user.name} (${user.phoneNumber})
      - User ID: ${user._id}
      - Timestamp: ${new Date().toISOString()}
    `);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email
      }
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
// Fetch user profile by phone number
exports.getUserProfileByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await UserProfile.findOne({ phoneNumber })
      .populate('assignedAdmin', 'name email phoneNumber adminId _id');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Use buildProfileResponse to include hatchery images
    const responseProfile = await buildProfileResponse(user);

    // Ensure _id is included in the response
    res.status(200).json({
      success: true,
      user: {
        ...responseProfile,
        _id: user._id.toString()  // Ensure MongoDB _id is included
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile", error });
  }
};

// Update profile by phone number
exports.updateUserProfileByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const updates = req.body;

    const updatedUser = await UserProfile.findOneAndUpdate(
      { phoneNumber },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};

exports.createUserProfile = async (req, res) => {
  try {
    const { images, ...payload } = req.body || {};

    const user = new UserProfile(payload);
    await user.save();
    const responseProfile = await buildProfileResponse(user);
    res.status(201).json({ message: 'User created successfully!', user: responseProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrUpdateMyProfile = async (req, res) => {
  try {
    const authUserId = req.userId;

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const authUser = await UserAuth.findById(authUserId);

    if (!authUser) {
      return res.status(404).json({
        success: false,
        message: 'Authenticated user not found',
      });
    }

    const {
      name,
      allowedRadiusMeters,
      farmLocation,
      farmLatitude,
      farmLongitude,
      latitude,
      longitude,
      images,
      ...rest
    } = req.body || {};

    const finalName = name || authUser.name;
    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const finalPhoneNumber = authUser.phoneNumber;
    if (!finalPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    let lat;
    let lon;

    if (farmLocation && Array.isArray(farmLocation.coordinates) && farmLocation.coordinates.length === 2) {
      lon = Number(farmLocation.coordinates[0]);
      lat = Number(farmLocation.coordinates[1]);
    } else if (farmLocation && farmLocation.latitude !== undefined && farmLocation.longitude !== undefined) {
      lat = Number(farmLocation.latitude);
      lon = Number(farmLocation.longitude);
    } else if (farmLatitude !== undefined && farmLongitude !== undefined) {
      lat = Number(farmLatitude);
      lon = Number(farmLongitude);
    } else if (latitude !== undefined && longitude !== undefined) {
      lat = Number(latitude);
      lon = Number(longitude);
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Valid farm latitude and longitude are required',
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90 degrees',
      });
    }

    if (lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180 degrees',
      });
    }

    let allowedRadius = allowedRadiusMeters;
    if (allowedRadius !== undefined && allowedRadius !== null) {
      allowedRadius = Number(allowedRadius);
      if (!Number.isFinite(allowedRadius) || allowedRadius < 0) {
        return res.status(400).json({
          success: false,
          message: 'allowedRadiusMeters must be a positive number',
        });
      }
    }

    const existingProfile = await UserProfile.findById(authUserId);

    const profileData = {
      ...rest,
      name: finalName,
      phoneNumber: finalPhoneNumber,
      farmLocation: {
        type: 'Point',
        coordinates: [lon, lat],
      },
    };

    if (allowedRadius !== undefined && allowedRadius !== null) {
      profileData.allowedRadiusMeters = allowedRadius;
    }

    if (typeof authUser.approvalStatus === 'string') {
      profileData.isApproved = authUser.approvalStatus === 'approved';
    }

    const profileDoc = await UserProfile.findByIdAndUpdate(
      authUserId,
      { $set: profileData },
      {
        new: true,
        upsert: false, // Don't create new profiles, only update existing ones
        runValidators: true,
      }
    );

    const statusCode = existingProfile ? 200 : 201;

    const profile = await buildProfileResponse(profileDoc);

    return res.status(statusCode).json({
      success: true,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
      profile,
    });
  } catch (error) {
    console.error('❌ Error creating/updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create/update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const authUserId = req.userId;

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Populate assignedAdmin to get admin details (name, email, phoneNumber, etc.)
    // Use _id instead of userId field since JWT stores MongoDB _id, not the custom userId string
    const profileDoc = await UserProfile.findById(authUserId)
      .populate('assignedAdmin', 'name email phoneNumber adminId _id');

    if (!profileDoc) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }
    const profile = await buildProfileResponse(profileDoc);

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ✅ Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserProfile.find();
    const enrichedUsers = await Promise.all(users.map((user) => buildProfileResponse(user)));
    res.json(enrichedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single user by userId
exports.getUserById = async (req, res) => {
  try {
    const user = await UserProfile.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const responseProfile = await buildProfileResponse(user);
    res.json(responseProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { path, filename } = req.file;

    let user = await UserProfile.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old image if exists
    if (user.profileImage?.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    user.profileImage = { url: path, public_id: filename };
    await user.save();

    res.json({ message: 'Profile image uploaded successfully!', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Upload multiple images (max 4)
exports.uploadMultipleImages = async (req, res) => {
  try {
    // ✅ Get userId from JWT token (set by verifyToken middleware)
    const userId = req.userId;
    const userIdFromParam = req.params.userId;

    // ✅ Security check: Ensure the token's userId matches the URL parameter
    if (userId !== userIdFromParam) {
      return res.status(403).json({
        error: "Unauthorized: You can only upload images to your own account",
        success: false
      });
    }

    // 🧩 Log incoming files for debugging
    console.log("📸 Uploaded files:", req.files);
    console.log("🔐 Authenticated userId:", userId);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded", success: false });
    }

    // 🧩 CloudinaryStorage puts file info as `path` (URL) and `filename` (public_id)
    const uploaded = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    // 🧩 Check if user exists before update
    const user = await UserProfile.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: "User not found", success: false });
    }

    // 🧩 Enforce a max of 4 images total (existing + new)
    const currentImages = user.images || [];
    if (currentImages.length + uploaded.length > 4) {
      return res.status(400).json({ error: "You can only upload up to 4 images" });
    }

    // 🧩 Update user profile
    user.images.push(...uploaded);
    await user.save();

    res.status(200).json({
      message: "Images uploaded successfully!",
      images: uploaded,
      user,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update profile image (replace)
exports.updateProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { path, filename } = req.file;

    const user = await UserProfile.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old image
    if (user.profileImage?.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }

    // Set new image
    user.profileImage = { url: path, public_id: filename };
    await user.save();

    res.json({ message: 'Profile image updated successfully!', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete profile image
exports.deleteProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserProfile.findOne({ userId });

    if (!user || !user.profileImage?.public_id) {
      return res.status(404).json({ message: 'No profile image found' });
    }

    await cloudinary.uploader.destroy(user.profileImage.public_id);

    user.profileImage = { url: '', public_id: '' };
    await user.save();

    res.json({ message: 'Profile image deleted successfully!', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete one image from "images" array
exports.deleteSingleImage = async (req, res) => {
  try {
    const { userId, publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);

    const user = await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { images: { public_id: publicId } } },
      { new: true }
    );

    res.json({ message: 'Image deleted successfully!', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete hatchery image from Cloudinary and database
exports.deleteHatcheryImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Image public_id is required'
      });
    }

    console.log(`🗑️ Deleting image for user ${userId}, public_id: ${public_id}`);

    // First, let's check what hatcheries exist for this user
    const userHatcheries = await Hatchery.find({ userId: userId });
    console.log(`📦 Found ${userHatcheries.length} hatcheries for user ${userId}`);

    if (userHatcheries.length > 0) {
      userHatcheries.forEach((h, i) => {
        console.log(`  Hatchery ${i + 1}: ${h.name}, Images: ${h.images?.length || 0}`);
        h.images?.forEach((img, j) => {
          console.log(`    Image ${j + 1}: public_id=${img.public_id}, url=${img.url?.substring(0, 50)}...`);
        });
      });
    }

    // Find the hatchery containing this image
    let hatchery = await Hatchery.findOne({
      userId: userId,
      'images.public_id': public_id
    });

    let imageToDelete = null;

    if (!hatchery) {
      // Try to find by URL if public_id doesn't match (for images without stored public_id)
      const hatcheryByUrl = await Hatchery.findOne({
        userId: userId,
        'images.url': { $regex: public_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
      });

      if (hatcheryByUrl) {
        console.log('⚠️ Found hatchery by URL pattern, using URL-based deletion');
        hatchery = hatcheryByUrl;
        // Find the specific image by URL match
        imageToDelete = hatchery.images.find(img => img.url && img.url.includes(public_id));
      } else {
        return res.status(404).json({
          success: false,
          message: 'Image not found in any hatchery. The image may have been uploaded before public_id was saved. Please re-upload the image.'
        });
      }
    }

    // Delete from Cloudinary
    try {
      const cloudinaryResult = await cloudinary.uploader.destroy(public_id);
      console.log('☁️ Cloudinary deletion result:', cloudinaryResult);
    } catch (cloudinaryError) {
      console.error('⚠️ Cloudinary deletion error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Remove the image from the hatchery's images array
    let updatedHatchery;

    if (imageToDelete) {
      // URL-based deletion - use the image's _id or URL to delete
      updatedHatchery = await Hatchery.findOneAndUpdate(
        { _id: hatchery._id },
        { $pull: { images: { url: imageToDelete.url } } },
        { new: true }
      );
    } else {
      // public_id-based deletion
      updatedHatchery = await Hatchery.findOneAndUpdate(
        { userId: userId, 'images.public_id': public_id },
        { $pull: { images: { public_id: public_id } } },
        { new: true }
      );
    }

    console.log('✅ Image deleted from hatchery:', updatedHatchery?.name);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully from cloud storage and database',
      remainingImages: updatedHatchery?.images?.length || 0
    });

  } catch (err) {
    console.error('❌ Error deleting hatchery image:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: err.message
    });
  }
};


// ✅ Get user images
exports.getUserImages = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserProfile.findOne({ userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    const hatcheries = await Hatchery.find({ userId }).select('name images');
    const imageUrls = [];

    hatcheries.forEach((hatchery) => {
      (hatchery.images || []).forEach((image) => {
        imageUrls.push({
          url: image.url,
          uploadedAt: image.uploadedAt,
          status: image.status,
          hatcheryId: hatchery._id,
          hatcheryName: hatchery.name,
        });
      });
    });

    res.json({
      userId: user.userId,
      name: user.firstName + ' ' + user.lastName,
      profileImage: user.displayImage || null,
      images: imageUrls,
    });
  } catch (err) {
    console.error("❌ Error fetching images:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get user profile by phone number
exports.getUserByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await UserProfile.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const responseProfile = await buildProfileResponse(user);

    res.status(200).json({
      success: true,
      user: responseProfile
    });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body };
    delete updateData.images;

    console.log('📝 Updating profile for user:', userId);
    console.log('📝 Update data:', updateData);

    // Find the user first
    let user = await UserProfile.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle profile image upload
    if (req.file) {
      console.log('📸 New profile image uploaded:', req.file.filename);

      // Delete old profile image from Cloudinary if exists
      if (user.profileImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
          console.log('🗑️ Old profile image deleted');
        } catch (deleteErr) {
          console.error('⚠️ Error deleting old profile image:', deleteErr);
        }
      }

      // Set new profile image
      updateData.profileImage = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    // Handle profile image removal
    if (req.body.removeProfileImage === 'true') {
      console.log('🗑️ Removing profile image');

      // Delete from Cloudinary if exists
      if (user.profileImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
          console.log('🗑️ Profile image deleted from Cloudinary');
        } catch (deleteErr) {
          console.error('⚠️ Error deleting profile image:', deleteErr);
        }
      }

      // Clear profile image
      updateData.profileImage = {
        url: '',
        public_id: ''
      };
    }

    // Remove the removeProfileImage flag from update data
    delete updateData.removeProfileImage;

    // Update user
    user = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    const responseProfile = await buildProfileResponse(user);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: responseProfile
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.updatePhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, email, country, state, district, pincode } = req.body;
    let imageUrl;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, { folder: "user_profiles" });
      imageUrl = uploadResult.secure_url;
    }

    const updatedUser = await UserProfile.findOneAndUpdate(
      { phoneNumber: phone }, 
      {
        name,
        phone,
        email,
        country,
        state,
        district,
        pincode,
        ...(imageUrl && { profileImage: imageUrl }),
      },
      { new: true }
    );

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserProfile.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        seedsAvailable: user.seedsAvailable || 0,
        seedsPurchased: user.seedsPurchased || 0,
        activeBatches: user.activeBatches || 0,
        totalHatcheries: user.totalHatcheries || 0
      }
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Change user password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.userId; // From JWT token set by verifyToken middleware

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user in UserAuth model
    const user = await UserProfile.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a password set
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'No password set. Please create a password first.'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error("❌ Error changing password:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Update user email
exports.updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.userId; // From JWT token set by verifyToken middleware

    // Validate email
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await UserAuth.findOne({
      email: newEmail.toLowerCase(),
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another account'
      });
    }

    // Update email in UserAuth model
    const userAuth = await UserAuth.findByIdAndUpdate(
      userId,
      { email: newEmail.toLowerCase() },
      { new: true, runValidators: true }
    );

    if (!userAuth) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update email in UserProfile model as well (if it exists)
    await UserProfile.findOneAndUpdate(
      { phoneNumber: userAuth.phoneNumber },
      { email: newEmail.toLowerCase() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      email: newEmail.toLowerCase()
    });
  } catch (err) {
    console.error("❌ Error updating email:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Update user phone number
exports.updatePhoneNumber = async (req, res) => {
  try {
    const { newPhoneNumber } = req.body;
    const userId = req.userId; // From JWT token set by verifyToken middleware

    // Validate phone number
    if (!newPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Basic phone number validation (adjust regex as needed for your format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(newPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if phone number already exists
    const existingUser = await UserAuth.findOne({
      phoneNumber: newPhoneNumber,
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already in use by another account'
      });
    }

    // Get old phone number before update
    const userAuth = await UserAuth.findById(userId);
    if (!userAuth) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const oldPhoneNumber = userAuth.phoneNumber;

    // Update phone number in UserAuth model
    userAuth.phoneNumber = newPhoneNumber;
    await userAuth.save();

    // Update phone number in UserProfile model as well
    await UserProfile.findOneAndUpdate(
      { phoneNumber: oldPhoneNumber },
      { phoneNumber: newPhoneNumber },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully',
      phoneNumber: newPhoneNumber
    });
  } catch (err) {
    console.error("❌ Error updating phone number:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Update profile picture (using JWT token)
exports.updateMyProfilePicture = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token set by verifyToken middleware

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const { path, filename } = req.file; // Cloudinary provides path (URL) and filename (public_id)

    // Get user's phone number from UserAuth
    const userAuth = await UserAuth.findById(userId);
    if (!userAuth) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find user profile by phone number
    const userProfile = await UserProfile.findOne({ phoneNumber: userAuth.phoneNumber });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Delete old image from Cloudinary if it exists
    if (userProfile.profileImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(userProfile.profileImage.public_id);
        console.log('🗑️ Old profile image deleted:', userProfile.profileImage.public_id);
      } catch (deleteError) {
        console.error('❌ Error deleting old image:', deleteError);
        // Continue even if deletion fails
      }
    }

    // Update profile picture
    userProfile.profileImage = {
      url: path,
      public_id: filename
    };
    await userProfile.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      userImage: {
        url: path,
        public_id: filename
      }
    });
  } catch (err) {
    console.error("❌ Error updating profile picture:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



// ✅ Update SMS notification status for image feedback
exports.updateSmsNotificationStatus = async (req, res) => {
  try {
    const { imageUrl, userId, smsSuccess } = req.body;

    if (!imageUrl || !userId || typeof smsSuccess === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: imageUrl, userId, and smsSuccess',
      });
    }

    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const imageIndex = userProfile.images.findIndex(img => img.url === imageUrl);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    if (userProfile.images[imageIndex].adminFeedback) {
      userProfile.images[imageIndex].adminFeedback.smsNotificationSent = smsSuccess;
      await userProfile.save();

      console.log('✅ SMS notification status updated');

      return res.status(200).json({
        success: true,
        message: 'SMS notification status updated',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No feedback exists for this image',
      });
    }
  } catch (error) {
    console.error('❌ Error updating SMS status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update SMS status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// =================== Update Phone Number with OTP Verification ===================
exports.updatePhoneNumber = async (req, res) => {
  try {
    const { currentPhoneNumber, newPhoneNumber, otp } = req.body;

    if (!currentPhoneNumber || !newPhoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Current phone number, new phone number, and OTP are required'
      });
    }

    // Verify OTP for new phone number
  
    const cleanNewPhone = newPhoneNumber.replace(/\D/g, '');
    const last10Digits = cleanNewPhone.slice(-10);

    const otpRecord = await Otp.findOne({ phoneNumber: last10Digits });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ phoneNumber: last10Digits });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (otpRecord.otpCode !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if new phone number is already in use
    const existingUser = await UserProfile.findOne({ phoneNumber: last10Digits });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered'
      });
    }

    // Update phone number in UserProfile
    const cleanCurrentPhone = currentPhoneNumber.replace(/\D/g, '');
    const currentLast10 = cleanCurrentPhone.slice(-10);

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { phoneNumber: currentLast10 },
      { phoneNumber: last10Digits },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Update phone number in UserAuth if exists
    await UserAuth.findOneAndUpdate(
      { phoneNumber: currentLast10 },
      { phoneNumber: last10Digits }
    );

    // Delete OTP after successful verification
    await Otp.deleteOne({ phoneNumber: last10Digits });

    // Update localStorage phone number
    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully!',
      newPhoneNumber: last10Digits
    });
  } catch (error) {
    console.error('❌ Error updating phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update phone number',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =================== Update Email with OTP Verification ===================
exports.updateEmail = async (req, res) => {
  try {
    const { phoneNumber, newEmail, otp } = req.body;

    if (!phoneNumber || !newEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, new email, and OTP are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

  
    const otpRecord = await Otp.findOne({ phoneNumber: newEmail }); // Email stored in phoneNumber field

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ phoneNumber: newEmail });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (otpRecord.otpCode !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if email is already in use
    const existingUser = await UserProfile.findOne({ email: newEmail });
    if (existingUser && existingUser.phoneNumber !== phoneNumber.replace(/\D/g, '').slice(-10)) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered to another account'
      });
    }

    // Update email in UserProfile
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const last10Digits = cleanPhone.slice(-10);

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { phoneNumber: last10Digits },
      { email: newEmail },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Delete OTP after successful verification
    await Otp.deleteOne({ phoneNumber: newEmail });

    res.status(200).json({
      success: true,
      message: 'Email updated successfully!',
      newEmail: newEmail
    });
  } catch (error) {
    console.error('❌ Error updating email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Upload single image to user's hatchery (creates default hatchery if needed)
exports.uploadUserHatcheryImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude, accuracy, slotIndex } = req.body;

    console.log('📸 Upload image request for userId:', userId);
    console.log('📍 Location data:', { latitude, longitude, accuracy });
    console.log('🖼️ Slot index:', slotIndex);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Find user profile by userId string (e.g., "USER1763045993666409")
    const userProfile = await UserProfile.findOne({ userId: userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create a default hatchery for this user
    let hatchery = await Hatchery.findOne({ userId: userId });

    // Check if existing hatchery is valid (has required fields)
    if (hatchery && (!hatchery.name || !hatchery.startDate || !hatchery.endDate)) {
      console.log('⚠️ Found invalid hatchery, deleting and creating new one');
      await Hatchery.findByIdAndDelete(hatchery._id);
      hatchery = null;
    }

    if (!hatchery) {
      // Create a default hatchery
      console.log('📦 Creating default hatchery for user:', userId);
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      hatchery = new Hatchery({
        userId: userId,
        name: 'Default Hatchery',
        startDate: now,
        endDate: endDate,
        images: [],
        status: 'pending'
      });

      console.log('📦 Hatchery object created:', {
        userId: hatchery.userId,
        name: hatchery.name,
        startDate: hatchery.startDate,
        endDate: hatchery.endDate
      });

      await hatchery.save();
      console.log('✅ Default hatchery saved successfully');

      // Update user's totalHatcheries count
      await UserProfile.findOneAndUpdate(
        { userId: userId },
        { $inc: { totalHatcheries: 1 } }
      );
    }

    // Process uploaded images (should be just one)
    const uploadedImages = [];

    for (const file of req.files) {
      const imageData = {
        url: file.path,
        public_id: file.filename,
        uploadedAt: new Date(),
        status: 'uploaded', // New image is pending admin review
        location: {
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          accuracy: accuracy ? parseFloat(accuracy) : null
        },
        adminFeedback: null // No feedback yet for new upload
      };

      // Add to the specific slot if provided, otherwise push to array
      if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < 4) {
        // Ensure array has enough slots
        while (hatchery.images.length <= slotIndex) {
          hatchery.images.push(null);
        }
        hatchery.images[slotIndex] = imageData;
      } else {
        hatchery.images.push(imageData);
      }

      uploadedImages.push(imageData);
    }

    await hatchery.save();

    console.log('✅ Image uploaded successfully to hatchery:', hatchery._id);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      images: uploadedImages.map(img => ({
        ...img,
        status: img.status || 'uploaded'
      })),
      hatcheryId: hatchery._id,
      hatcheryName: hatchery.name
    });

  } catch (error) {
    console.error('❌ Error uploading user hatchery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

