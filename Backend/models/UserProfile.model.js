const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  // Admin feedback for each image
  adminFeedback: {
    message: String,
    action: {
      type: String,
      enum: ['approve', 'decline'],
    },
    reviewedBy: String, // adminId
    reviewedByName: String,
    reviewedAt: Date,
  },
});

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
  },

  // ✅ Password field for authentication
  password: {
    type: String,
    required: true,
    minlength: 6,
    trim: true,
  },

  // ✅ Registration date field
  registrationDate: {
    type: Date,
    default: Date.now,
  },

  // ✅ Profile images
  profileImage: {
    url: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
    public_id: {
      type: String,
      default: null
    }
  },
  images: [imageSchema],  // multiple uploaded images

  // ✅ Status field
  status: {
    type: String,
    enum: ['pending', 'uptoDate', 'Ready'],
    default: 'Ready',
  },
  currentDay: { type: Number, default: 0 },

  // ✅ Bio & language info
  bio: { type: String, default: '' },
  Region: { type: String, default: '' },
  defaultLanguage: { type: String, default: 'English' },

  // ✅ Location details
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  district: { type: String, default: '' },
  pincode: { type: String, default: '' },
  address: { type: String, default: '' },

  // ✅ Farm location (GeoJSON Point for geospatial queries)
  farmLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function (coords) {
          return (
            !coords ||
            coords.length === 0 ||
            (coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90)
          );
        },
        message: 'Farm coordinates must be [longitude, latitude] with valid ranges',
      },
    },
  },
  allowedRadiusMeters: {
    type: Number,
    default: 1000, // Default 1km radius for seed image uploads
    min: 0,
  },

  // ✅ Approval and status
  isApproved: {
    type: Boolean,
    default: false, // true only when admin approves or admin-added user verifies OTP
  },
  createdBy: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  message: {
    type: String,
    default: '', // Optional message (admin note, reason, comment, etc.)
  },
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },

  // ✅ Seed information fields (Admin editable only)
  seedsCount: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  seedType: {
    type: String,
    default: 'None'
  },

  createdAt: { type: Date, default: Date.now },
});

// Index for better query performance
userProfileSchema.index({ phoneNumber: 1 });
userProfileSchema.index({ registrationDate: -1 });
userProfileSchema.index({ isApproved: 1 });
userProfileSchema.index({ status: 1 });
userProfileSchema.index({ farmLocation: '2dsphere' });

module.exports = mongoose.model('UserProfile', userProfileSchema);