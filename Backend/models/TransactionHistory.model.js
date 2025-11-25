const mongoose = require('mongoose');

const TransactionHistorySchema = new mongoose.Schema({
  // User Reference
  userId: { type: String, required: true },
  userMongoId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
  userName: { type: String, required: true },
  userPhoneNumber: { type: String },

  // Hatchery Information (snapshot at time of approval)
  hatcheryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hatchery', required: true },
  hatcheryName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Approved Images (snapshot of approved images)
  approvedImages: [{
    url: { type: String },
    public_id: { type: String },
    uploadedAt: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number }
    }
  }],

  // Admin Information
  approvedBy: { type: String }, // adminId
  approvedByName: { type: String },
  approvedAt: { type: Date, default: Date.now },

  // Transaction Status
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed'
  },

  // Seeds Information (snapshot at time of approval)
  seedsCount: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  seedType: { type: String, default: 'Hardyline' },

  // Additional Information
  notes: { type: String },
  
}, { timestamps: true });

// Index for faster queries
TransactionHistorySchema.index({ userId: 1, createdAt: -1 });
TransactionHistorySchema.index({ approvedBy: 1, createdAt: -1 });

module.exports = mongoose.model('TransactionHistory', TransactionHistorySchema);

