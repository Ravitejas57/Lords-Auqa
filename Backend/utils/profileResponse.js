const Hatchery = require('../models/Hatchery.model');

// Delete window duration in milliseconds (1 minute)
const DELETE_WINDOW_MS = 60 * 1000;

/**
 * Build profile response with hatchery images
 * @param {Object} profileDoc - User profile document
 * @param {Object} options - Optional settings
 * @param {boolean} options.forAdminView - If true, filters out images still in delete window
 * @returns {Object} Profile with images
 */
const buildProfileResponse = async (profileDoc, options = {}) => {
  if (!profileDoc) {
    return null;
  }

  const { forAdminView = false } = options;

  const profile = profileDoc.toObject ? profileDoc.toObject({ virtuals: true }) : { ...profileDoc };

  const hatcheries = await Hatchery.find({ userId: profile.userId }).select('name images createdAt updatedAt');

  const hatcheryImages = [];
  const currentTime = Date.now();

  hatcheries.forEach((hatchery) => {
    const hatcheryObj = hatchery.toObject ? hatchery.toObject() : hatchery;
    (hatcheryObj.images || []).forEach((image) => {
      const imageObj = image && image.toObject ? image.toObject() : image;

      // For admin view, only include images where delete window has expired
      if (forAdminView) {
        const uploadedAt = new Date(imageObj.uploadedAt).getTime();
        const timeSinceUpload = currentTime - uploadedAt;

        // Skip images still in delete window (less than 1 minute old)
        if (timeSinceUpload < DELETE_WINDOW_MS) {
          return; // Skip this image
        }
      }

      hatcheryImages.push({
        ...imageObj,
        hatcheryId: hatcheryObj._id,
        hatcheryName: hatcheryObj.name,
        hatcheryCreatedAt: hatcheryObj.createdAt,
        hatcheryUpdatedAt: hatcheryObj.updatedAt,
      });
    });
  });

  profile.images = hatcheryImages;

  return profile;
};

module.exports = {
  buildProfileResponse,
};


