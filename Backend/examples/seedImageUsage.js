/**
 * SeedImage Model Usage Examples
 *
 * This file demonstrates how to use the SeedImage model with geolocation features
 * in your routes and controllers.
 */

const SeedImage = require('../models/SeedImage.model');

// ============================================================
// EXAMPLE 1: Creating a new seed image with location
// ============================================================

async function createSeedImageWithLocation(req, res) {
  try {
    const {
      userId,
      imageUrl,
      imagePublicId,
      longitude,
      latitude,
      accuracy,
      sha256
    } = req.body;

    // Validate coordinates
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Create seed image
    const seedImage = await SeedImage.create({
      userId,
      imageUrl,
      imagePublicId,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      takenAt: new Date(),
      sha256,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Seed image uploaded successfully',
      data: seedImage
    });
  } catch (error) {
    console.error('Error creating seed image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload seed image',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 2: Find images near user's location
// ============================================================

async function findNearbyImages(req, res) {
  try {
    const { longitude, latitude, radius = 10000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    // Use the static method from the model
    const nearbyImages = await SeedImage.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(radius)
    ).populate('userId', 'name phoneNumber');

    res.status(200).json({
      success: true,
      count: nearbyImages.length,
      data: nearbyImages
    });
  } catch (error) {
    console.error('Error finding nearby images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby images',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 3: Find images within a specific area (polygon)
// ============================================================

async function findImagesInArea(req, res) {
  try {
    const { polygon } = req.body;

    // Polygon should be array of coordinate arrays
    // Example: [[[lng1,lat1], [lng2,lat2], [lng3,lat3], [lng1,lat1]]]

    if (!polygon || !Array.isArray(polygon)) {
      return res.status(400).json({
        success: false,
        message: 'Valid polygon coordinates are required'
      });
    }

    const imagesInArea = await SeedImage.findWithinArea(polygon)
      .populate('userId', 'name phoneNumber');

    res.status(200).json({
      success: true,
      count: imagesInArea.length,
      data: imagesInArea
    });
  } catch (error) {
    console.error('Error finding images in area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find images in area',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 4: Advanced geospatial query with filters
// ============================================================

async function findApprovedImagesNearLocation(req, res) {
  try {
    const { longitude, latitude, maxDistance = 5000, status = 'approved' } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    const images = await SeedImage.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: status
    })
      .populate('userId', 'name email phoneNumber')
      .select('-sha256') // Exclude sensitive hash from response
      .limit(50)
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error finding images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find images',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 5: Get user's uploaded images
// ============================================================

async function getUserSeedImages(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const images = await SeedImage.find(query)
      .sort({ uploadedAt: -1 })
      .select('-sha256');

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching user images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user images',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 6: Update image status (Admin action)
// ============================================================

async function updateImageStatus(req, res) {
  try {
    const { imageId } = req.params;
    const { status, flags } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'declined', 'flagged'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const image = await SeedImage.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Update status
    if (status) {
      image.status = status;
    }

    // Update flags if provided
    if (flags && Array.isArray(flags)) {
      image.flags = flags;
    }

    await image.save();

    res.status(200).json({
      success: true,
      message: 'Image status updated successfully',
      data: image
    });
  } catch (error) {
    console.error('Error updating image status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update image status',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 7: Add flag to image (using instance method)
// ============================================================

async function addFlagToImage(req, res) {
  try {
    const { imageId } = req.params;
    const { flag } = req.body;

    if (!flag) {
      return res.status(400).json({
        success: false,
        message: 'Flag is required'
      });
    }

    const image = await SeedImage.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Use the instance method
    await image.addFlag(flag);

    res.status(200).json({
      success: true,
      message: 'Flag added successfully',
      data: image
    });
  } catch (error) {
    console.error('Error adding flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add flag',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 8: Get images statistics by location
// ============================================================

async function getLocationStatistics(req, res) {
  try {
    const { longitude, latitude, radius = 10000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    const stats = await SeedImage.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDistance: { $avg: '$distance' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate statistics',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 9: Check for duplicate images using SHA256
// ============================================================

async function checkDuplicateImage(req, res) {
  try {
    const { sha256 } = req.body;

    if (!sha256) {
      return res.status(400).json({
        success: false,
        message: 'SHA256 hash is required'
      });
    }

    const existingImage = await SeedImage.findOne({ sha256 });

    if (existingImage) {
      return res.status(409).json({
        success: false,
        message: 'This image has already been uploaded',
        data: {
          imageId: existingImage._id,
          uploadedAt: existingImage.uploadedAt,
          status: existingImage.status
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image is unique',
      duplicate: false
    });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check for duplicates',
      error: error.message
    });
  }
}

// ============================================================
// EXAMPLE 10: Batch upload with location validation
// ============================================================

async function batchUploadImages(req, res) {
  try {
    const { images } = req.body; // Array of image objects

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const imageData of images) {
      try {
        const seedImage = await SeedImage.create({
          userId: imageData.userId,
          imageUrl: imageData.imageUrl,
          imagePublicId: imageData.imagePublicId,
          location: {
            type: 'Point',
            coordinates: [
              parseFloat(imageData.longitude),
              parseFloat(imageData.latitude)
            ]
          },
          accuracy: imageData.accuracy,
          sha256: imageData.sha256,
          takenAt: imageData.takenAt || new Date()
        });

        results.success.push({
          imageId: seedImage._id,
          imageUrl: seedImage.imageUrl
        });
      } catch (error) {
        results.failed.push({
          imageUrl: imageData.imageUrl,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Uploaded ${results.success.length} of ${images.length} images`,
      data: results
    });
  } catch (error) {
    console.error('Error in batch upload:', error);
    res.status(500).json({
      success: false,
      message: 'Batch upload failed',
      error: error.message
    });
  }
}

// ============================================================
// Export functions for use in routes
// ============================================================

module.exports = {
  createSeedImageWithLocation,
  findNearbyImages,
  findImagesInArea,
  findApprovedImagesNearLocation,
  getUserSeedImages,
  updateImageStatus,
  addFlagToImage,
  getLocationStatistics,
  checkDuplicateImage,
  batchUploadImages
};

/*
 * INTEGRATION EXAMPLE - How to use in routes file:
 *
 * // routes/SeedImage.route.js
 * const express = require('express');
 * const router = express.Router();
 * const seedImageController = require('../controllers/SeedImage.controller');
 * const authMiddleware = require('../middleware/auth.middleware');
 *
 * // Create new seed image
 * router.post('/upload', authMiddleware, seedImageController.createSeedImageWithLocation);
 *
 * // Find nearby images
 * router.get('/nearby', authMiddleware, seedImageController.findNearbyImages);
 *
 * // Get user's images
 * router.get('/user/:userId', authMiddleware, seedImageController.getUserSeedImages);
 *
 * // Admin: Update status
 * router.patch('/:imageId/status', authMiddleware, seedImageController.updateImageStatus);
 *
 * module.exports = router;
 */
