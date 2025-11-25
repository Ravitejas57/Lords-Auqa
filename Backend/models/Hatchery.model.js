const mongoose = require('mongoose');

const HatcherySchema = new mongoose.Schema({
  // User Reference (using string to match UserProfile.userId)
  userId: { type: String, required: true },

  // Basic Information
  name: { type: String, required: true }, // Hatchery name

  // Dates
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  currentDate: { type: Date, default: Date.now },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },

  // Images (4 images max)
  images: [{
    url: { type: String },
    public_id: { type: String }, // Cloudinary public_id for deletion
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['uploaded', 'pending', 'approved', 'rejected'],
      default: 'uploaded'
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null } // Accuracy in meters
    },
    // Admin feedback for each image
    adminFeedback: {
      message: { type: String },
      action: {
        type: String,
        enum: ['approve', 'decline']
      },
      reviewedBy: { type: String }, // adminId
      reviewedByName: { type: String },
      reviewedAt: { type: Date }
    }
  }],

  // Seeds Information
  totalSeeds: { type: Number, default: 0 },


  // Admin Feedback
  adminFeedback: { type: String, default: '' },

  // Growth Data for Reports
  growthData: [{
    day: { type: Number, required: true },
    weight: { type: Number, required: true }, // in grams
    length: { type: Number, required: true }, // in mm
    recordedAt: { type: Date, default: Date.now }
  }],

  // Batch Information
  batchName: { type: String, default: '' },

  // Statistics
  imagesUploaded: { type: Number, default: 0 },

}, { timestamps: true });

// Pre-save hook to update imagesUploaded count
HatcherySchema.pre('save', function(next) {
  this.imagesUploaded = this.images.length;
  next();
});

module.exports = mongoose.model('Hatchery', HatcherySchema);
