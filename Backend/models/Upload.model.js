const mongoose = require('mongoose');

const UploadSchema = new mongoose.Schema({
  hatcheryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hatchery', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayRange: { type: String, required: true }, // e.g., "Day 1-10", "Day 10-20"
  imageUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  uploadedDate: { type: Date, default: Date.now },
  adminComment: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Upload', UploadSchema);
