const Hatchery = require('../models/Hatchery.model');
const UserProfile = require('../models/UserProfile.model');
const TransactionHistory = require('../models/TransactionHistory.model');
const Notification = require('../models/Notification.model');
const Conversation = require('../models/UserHelp.model');
const { cloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');

// ✅ Create new hatchery
exports.createHatchery = async (req, res) => {
  try {
    const { userId, name, startDate, endDate } = req.body;

    // Validate required fields
    if (!userId || !name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create hatchery
    const hatchery = new Hatchery({
      userId,
      name,
      startDate,
      endDate,
      images: []
    });

    await hatchery.save();

    // Update user's totalHatcheries count
    await UserProfile.findOneAndUpdate(
      { userId },
      { $inc: { totalHatcheries: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Hatchery created successfully',
      hatchery
    });
  } catch (err) {
    console.error("❌ Error creating hatchery:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Get all hatcheries for a user
exports.getUserHatcheries = async (req, res) => {
  try {
    const { userId } = req.params;
    const { forAdminView } = req.query; // Check if this is for admin view

    const hatcheries = await Hatchery.find({ userId }).sort({ createdAt: -1 });

    // If forAdminView=true, filter out images still in delete window (60 seconds)
    if (forAdminView === 'true') {
      const DELETE_WINDOW_MS = 60 * 1000; // 60 seconds
      const currentTime = Date.now();

      hatcheries.forEach((hatchery) => {
        if (hatchery.images && hatchery.images.length > 0) {
          hatchery.images = hatchery.images.filter((image) => {
            const uploadedAt = new Date(image.uploadedAt).getTime();
            const timeSinceUpload = currentTime - uploadedAt;
            // Only include images where delete window has expired
            return timeSinceUpload >= DELETE_WINDOW_MS;
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      count: hatcheries.length,
      hatcheries
    });
  } catch (err) {
    console.error("❌ Error fetching hatcheries:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Get single hatchery by ID
exports.getHatcheryById = async (req, res) => {
  try {
    const { id } = req.params;

    const hatchery = await Hatchery.findById(id);

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found'
      });
    }

    res.status(200).json({
      success: true,
      hatchery
    });
  } catch (err) {
    console.error("❌ Error fetching hatchery:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Update hatchery
exports.updateHatchery = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const hatchery = await Hatchery.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hatchery updated successfully',
      hatchery
    });
  } catch (err) {
    console.error("❌ Error updating hatchery:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Delete hatchery
exports.deleteHatchery = async (req, res) => {
  try {
    const { id } = req.params;

    const hatchery = await Hatchery.findByIdAndDelete(id);

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found'
      });
    }

    // Decrease user's totalHatcheries count
    await UserProfile.findOneAndUpdate(
      { userId: hatchery.userId },
      { $inc: { totalHatcheries: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Hatchery deleted successfully'
    });
  } catch (err) {
    console.error("❌ Error deleting hatchery:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Upload image to hatchery (with Cloudinary integration and geolocation)
exports.uploadHatcheryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    console.log("📸 Hatchery image upload - files:", req.files);
    console.log("📸 Hatchery ID:", id);
    console.log("📍 Location data:", { latitude, longitude });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded"
      });
    }

    const hatchery = await Hatchery.findById(id);

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found'
      });
    }

    // Check if user's seed information has been updated by admin
    const UserProfile = require('../models/UserProfile.model');
    const userProfile = await UserProfile.findOne({ userId: hatchery.userId });

    if (!userProfile || !userProfile.seedsCount || userProfile.seedsCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'Image uploads are locked. Please wait for admin to update your seed count.'
      });
    }

    // Check if already has 4 images
    if (hatchery.images.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 4 images allowed per hatchery'
      });
    }

    // Process uploaded files (Cloudinary integration with geolocation)
    const uploadedImages = req.files.map((file) => {
      const imageData = {
        url: file.path,        // Cloudinary URL
        public_id: file.filename, // Cloudinary public_id
        uploadedAt: new Date(),
        status: 'uploaded'
      };

      // Add location data if provided
      if (latitude && longitude) {
        imageData.location = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        };
        console.log(`📍 Image uploaded with location: ${latitude}, ${longitude}`);
      } else {
        console.log('⚠️ Image uploaded without location data');
      }

      return imageData;
    });

    // Add images to hatchery
    hatchery.images.push(...uploadedImages);
    await hatchery.save();

    // Check if 4 images are uploaded and send notification to admin
    if (hatchery.images.length === 4 && userProfile && userProfile.assignedAdmin) {
      try {
        const Notification = require('../models/Notification.model');
        const Admin = require('../models/Admin.model');
        
        // Get admin details
        const admin = await Admin.findById(userProfile.assignedAdmin);
        
        if (admin) {
          // Create notification for admin
          await Notification.create({
            userId: userProfile.assignedAdmin, // Admin's MongoDB _id
            type: 'info',
            message: `${userProfile.name} (${userProfile.phoneNumber}) has uploaded 4 images for hatchery "${hatchery.name}". Please review and approve the hatchery.`,
            read: false,
            priority: 'high',
            relatedHatcheryId: hatchery._id,
            time: new Date().toISOString(),
          });

          console.log('✅ Notification sent to admin:', {
            adminId: userProfile.assignedAdmin,
            adminName: admin.name,
            userId: userProfile.userId,
            userName: userProfile.name,
            hatcheryId: hatchery._id
          });
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send notification to admin:', notificationError);
        // Don't fail the upload if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      images: uploadedImages,
      hatchery
    });
  } catch (err) {
    console.error("❌ Error uploading hatchery image:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Delete image from hatchery
exports.deleteHatcheryImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const parsedIndex = parseInt(imageIndex, 10);

    const hatchery = await Hatchery.findById(id);

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found'
      });
    }

    if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= hatchery.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    const imageEntry = hatchery.images[parsedIndex];

    if (!imageEntry) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Allow deletion if image is rejected by admin, otherwise enforce 60-second window
    const isRejected = imageEntry.status === 'rejected' ||
                       (imageEntry.adminFeedback && imageEntry.adminFeedback.action === 'decline');

    if (imageEntry.uploadedAt && !isRejected) {
      const uploadedAt = new Date(imageEntry.uploadedAt);
      if (!Number.isNaN(uploadedAt.getTime())) {
        const diffMs = Date.now() - uploadedAt.getTime();
        if (diffMs > 60 * 1000) {
          return res.status(400).json({
            success: false,
            message: 'Delete window expired. Images can only be deleted within 60 seconds of upload.'
          });
        }
      }
    }

    if (imageEntry.public_id) {
      try {
        console.log('🗑️ Deleting from Cloudinary:', imageEntry.public_id);
        const result = await cloudinary.uploader.destroy(imageEntry.public_id, {
          invalidate: true,
          resource_type: 'image',
        });
        console.log('🗑️ Cloudinary destroy result:', result);

        if (!result || result.result !== 'ok') {
          return res.status(500).json({
            success: false,
            message: 'Failed to delete image from cloud storage.',
            error: result,
          });
        }
      } catch (cloudErr) {
        console.error('❌ Cloudinary delete error:', cloudErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete image from cloud storage.',
          error: cloudErr.message,
        });
      }
    }

    hatchery.images.splice(parsedIndex, 1);
    await hatchery.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      hatchery
    });
  } catch (err) {
    console.error("❌ Error deleting image:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Add growth data to hatchery
exports.addGrowthData = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, weight, length } = req.body;

    if (!day || !weight || !length) {
      return res.status(400).json({
        success: false,
        message: 'Please provide day, weight, and length'
      });
    }

    const hatchery = await Hatchery.findById(id);

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found'
      });
    }

    hatchery.growthData.push({
      day,
      weight,
      length,
      recordedAt: new Date()
    });

    await hatchery.save();

    res.status(200).json({
      success: true,
      message: 'Growth data added successfully',
      hatchery
    });
  } catch (err) {
    console.error("❌ Error adding growth data:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// ✅ Approve hatchery and reset images (complete transaction)
exports.approveHatchery = async (req, res) => {
  try {
    const { hatcheryId, userId, adminId, adminName } = req.body;

    console.log('✅ Approving hatchery:', { hatcheryId, userId });

    // Validation
    if (!hatcheryId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'hatcheryId and userId are required',
      });
    }

    // Find hatchery
    const hatchery = await Hatchery.findOne({
      _id: hatcheryId,
      userId: userId
    });

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found',
      });
    }

    // Check if all 4 images are uploaded (no individual approval needed)
    if (hatchery.images.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'All 4 images must be uploaded before approving the hatchery',
        totalImages: hatchery.images.length,
      });
    }

    // Get user profile for transaction history
    const userProfile = await UserProfile.findOne({ userId: userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    // Save transaction to history BEFORE resetting images and seeds data
    try {
      // Calculate start date (first image upload) and end date (last image upload)
      const imageDates = hatchery.images.map(img => new Date(img.uploadedAt).getTime());
      const startDate = new Date(Math.min(...imageDates));
      const endDate = new Date(Math.max(...imageDates));

      const transactionHistory = new TransactionHistory({
        userId: userId,
        userMongoId: userProfile._id,
        userName: userProfile.name || 'Unknown User',
        userPhoneNumber: userProfile.phoneNumber || '',
        hatcheryId: hatchery._id,
        hatcheryName: hatchery.name,
        startDate: startDate,
        endDate: endDate,
        approvedImages: hatchery.images.map(img => ({
          url: img.url,
          public_id: img.public_id,
          uploadedAt: img.uploadedAt,
          location: img.location || null,
        })),
        seedsCount: userProfile.seedsCount || 0,
        bonus: userProfile.bonus || 0,
        price: userProfile.price || 0,
        seedType: userProfile.seedType || 'Hardyline',
        approvedBy: adminId || null,
        approvedByName: adminName || 'Admin',
        approvedAt: new Date(),
        status: 'completed',
      });

      await transactionHistory.save();
      console.log('✅ Transaction saved to history:', transactionHistory._id);
    } catch (historyError) {
      console.error('⚠️ Failed to save transaction history:', historyError);
      // Don't fail the whole request if history save fails
    }

    // Update hatchery status to approved
    hatchery.status = 'approved';
    hatchery.adminFeedback = `Hatchery approved by ${adminName || 'Admin'} on ${new Date().toLocaleDateString()}`;

    // Reset images array (clear all images to reset slots)
    hatchery.images = [];

    await hatchery.save();

    // Reset seeds information fields in user profile (empty for next transaction)
    userProfile.seedsCount = 0;
    userProfile.bonus = 0;
    userProfile.price = 0;
    userProfile.seedType = 'None';

    await userProfile.save();
    console.log('✅ User seeds information reset for next transaction');

    // Clear related notifications for this hatchery (both user and admin side)
    // Clear BEFORE creating the new approval notification so it doesn't get deleted
    try {
      // Delete notifications for the user
      const deletedUserNotifications = await Notification.deleteMany({
        userId: userProfile._id,
        relatedHatcheryId: hatcheryId
      });
      console.log(`✅ Cleared ${deletedUserNotifications.deletedCount} user notifications related to hatchery ${hatcheryId}`);

      // Delete notifications for admins about this hatchery
      const deletedAdminNotifications = await Notification.deleteMany({
        relatedHatcheryId: hatcheryId,
        userId: { $ne: userProfile._id } // Admin notifications (not user's)
      });
      console.log(`✅ Cleared ${deletedAdminNotifications.deletedCount} admin notifications related to hatchery ${hatcheryId}`);
    } catch (notifError) {
      console.error('⚠️ Failed to clear notifications:', notifError);
      // Don't fail the whole request
    }

    // Create a notification for the user that hatchery has been approved
    // Create AFTER clearing old notifications so it doesn't get deleted
    try {
      const notificationMessage = `Your hatchery "${hatchery.name}" has been approved! Transaction completed successfully.`;
      
      await Notification.create({
        userId: userProfile._id,
        type: 'success',
        message: notificationMessage,
        read: false,
        relatedHatcheryId: hatchery._id,
        priority: 'high',
        time: new Date().toISOString(),
      });

      console.log('✅ Notification created for hatchery approval:', {
        userId: userProfile._id,
        userName: userProfile.name,
        phoneNumber: userProfile.phoneNumber,
        hatcheryId: hatchery._id,
        hatcheryName: hatchery.name
      });
    } catch (notificationError) {
      console.error('⚠️ Failed to create hatchery approval notification:', notificationError);
      console.error('⚠️ Full error:', notificationError.errors || notificationError.message);
      // Don't fail the whole request if notification creation fails
    }

    // Delete related help conversations for this hatchery (affects both user and admin view)
    try {
      const deletedConversations = await Conversation.deleteMany({
        userId: userProfile._id,
        relatedHatcheryId: hatcheryId
      });
      console.log(`✅ Deleted ${deletedConversations.deletedCount} help conversations related to hatchery ${hatcheryId}`);
    } catch (convError) {
      console.error('⚠️ Failed to delete conversations:', convError);
      // Don't fail the whole request
    }

    console.log('✅ Hatchery approved and images reset:', hatchery._id);

    return res.status(200).json({
      success: true,
      message: 'Hatchery approved successfully. Images have been reset.',
      hatchery,
    });
  } catch (error) {
    console.error('❌ Error approving hatchery:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve hatchery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ✅ Get transaction history for admin
exports.getAdminTransactionHistory = async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'adminId is required',
      });
    }

    const transactions = await TransactionHistory.find({
      approvedBy: adminId,
      status: 'completed'
    })
      .sort({ approvedAt: -1 })
      .limit(100)
      .populate('userMongoId', 'name phoneNumber email')
      .lean();

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('❌ Error fetching admin transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ✅ Get transaction history for user
exports.getUserTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const transactions = await TransactionHistory.find({
      userId: userId,
      status: 'completed'
    })
      .sort({ approvedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('❌ Error fetching user transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    const hatchery = await Hatchery.findOne({
      userId,
      'images.url': imageUrl
    });

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery or image not found',
      });
    }

    const imageIndex = hatchery.images.findIndex(img => img.url === imageUrl);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    if (hatchery.images[imageIndex].adminFeedback) {
      hatchery.images[imageIndex].adminFeedback.smsNotificationSent = smsSuccess;
      await hatchery.save();

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

// ✅ Delete hatchery and reset slots (WITHOUT creating purchase history)
exports.deleteAndResetHatchery = async (req, res) => {
  try {
    const { hatcheryId, userId, adminId, adminName } = req.body;

    console.log('🗑️ Deleting and resetting hatchery:', { hatcheryId, userId });

    // Validation
    if (!hatcheryId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'hatcheryId and userId are required',
      });
    }

    // Find hatchery
    const hatchery = await Hatchery.findOne({
      _id: hatcheryId,
      userId: userId
    });

    if (!hatchery) {
      return res.status(404).json({
        success: false,
        message: 'Hatchery not found',
      });
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId: userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    // Delete images from Cloudinary
    if (hatchery.images && hatchery.images.length > 0) {
      for (const image of hatchery.images) {
        if (image.public_id) {
          try {
            console.log('🗑️ Deleting image from Cloudinary:', image.public_id);
            await cloudinary.uploader.destroy(image.public_id, {
              invalidate: true,
              resource_type: 'image',
            });
          } catch (cloudErr) {
            console.error('⚠️ Failed to delete image from Cloudinary:', cloudErr);
            // Continue even if cloudinary deletion fails
          }
        }
      }
    }

    // Update hatchery - reset images array (clear all images to reset slots)
    hatchery.images = [];
    hatchery.status = 'pending';
    hatchery.adminFeedback = `Hatchery reset by ${adminName || 'Admin'} on ${new Date().toLocaleDateString()}`;

    await hatchery.save();

    // Reset seeds information fields in user profile (empty for next transaction)
    // This ensures slots remain locked until admin updates seeds count
    userProfile.seedsCount = 0;
    userProfile.bonus = 0;
    userProfile.price = 0;
    userProfile.seedType = 'None';

    await userProfile.save();
    console.log('✅ User seeds information reset - slots will be locked');

    // Clear related notifications for this hatchery
    try {
      // Delete notifications for the user
      const deletedUserNotifications = await Notification.deleteMany({
        userId: userProfile._id,
        relatedHatcheryId: hatcheryId
      });
      console.log(`✅ Cleared ${deletedUserNotifications.deletedCount} user notifications related to hatchery ${hatcheryId}`);

      // Delete notifications for admins about this hatchery
      const deletedAdminNotifications = await Notification.deleteMany({
        relatedHatcheryId: hatcheryId,
        userId: { $ne: userProfile._id }
      });
      console.log(`✅ Cleared ${deletedAdminNotifications.deletedCount} admin notifications related to hatchery ${hatcheryId}`);
    } catch (notifError) {
      console.error('⚠️ Failed to clear notifications:', notifError);
      // Don't fail the whole request
    }

    // Delete related help conversations for this hatchery
    try {
      const deletedConversations = await Conversation.deleteMany({
        userId: userProfile._id,
        relatedHatcheryId: hatcheryId
      });
      console.log(`✅ Deleted ${deletedConversations.deletedCount} help conversations related to hatchery ${hatcheryId}`);
    } catch (convError) {
      console.error('⚠️ Failed to delete conversations:', convError);
      // Don't fail the whole request
    }

    console.log('✅ Hatchery deleted and slots reset:', hatchery._id);

    return res.status(200).json({
      success: true,
      message: 'Hatchery deleted successfully. Image slots have been reset and are now locked until seeds count is updated.',
      hatchery,
    });
  } catch (error) {
    console.error('❌ Error deleting and resetting hatchery:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete and reset hatchery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
