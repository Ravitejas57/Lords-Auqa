const mongoose = require('mongoose');

const helpMessageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    default: ''
  },
  userPhone: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  reply: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  repliedAt: {
    type: Date,
    default: null
  },
  repliedBy: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
helpMessageSchema.index({ userId: 1, timestamp: -1 });
helpMessageSchema.index({ status: 1, timestamp: -1 });

const HelpMessage = mongoose.model('HelpMessage', helpMessageSchema);

module.exports = HelpMessage;
