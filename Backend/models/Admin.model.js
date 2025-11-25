const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  location: { type: String, default: '' },
  profileImage: {
    url: String,
    public_id: String,
  },

  totalUsers: { type: Number, default: 0 },
  approvedRequests: { type: Number, default: 0 },
  pendingApprovals: { type: Number, default: 0 },

  approvedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' }],
  pendingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PendingUser' }],
  rejectedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RejectedUser' }],

  role: { type: String, default: 'admin' },
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Admin', adminSchema);
