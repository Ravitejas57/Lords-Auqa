const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const rejectedUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  location: { type: String, default: '' },
  profileImage: imageSchema,
  rejectedAt: { type: Date, default: Date.now },
  reason: { type: String, default: '' },
  status: { type: String, default: 'rejected' },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
});

module.exports = mongoose.model('RejectedUser', rejectedUserSchema);
