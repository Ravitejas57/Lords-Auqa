const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const pendingUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String },
  location: { type: String, default: '' },
  profileImage: imageSchema,
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
  // Track if user was previously rejected
  previousRejection: {
    rejectedAt: { type: Date },
    reason: { type: String },
  },
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);
