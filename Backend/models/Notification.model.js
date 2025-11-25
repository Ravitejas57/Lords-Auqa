const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Optional user reference (null for global notifications)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: false },

  // If true, visible to everyone (public notification). Most admin broadcasts create per-user docs instead.
  isGlobal: { type: Boolean, default: false },

  type: {
    type: String,
    enum: ['success', 'warning', 'info', 'error'],
    default: 'info'
  },

  message: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        // Allow empty string if files are present
        return v !== null && v !== undefined;
      },
      message: 'Message is required'
    }
  },

  // Optional files attached to notification (stored in Cloudinary)
  files: [{
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    filename: { type: String },
    fileType: { type: String }, // e.g., 'image', 'pdf', 'document'
    uploadedAt: { type: Date, default: Date.now }
  }],

  // human-friendly time string (can be filled server-side) — primary timestamp is createdAt
  time: { type: String, default: '' },

  read: { type: Boolean, default: false },

  relatedHatcheryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hatchery', default: null },
  relatedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Story feature fields
  isStory: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null }, // Auto-set to 24 hours from creation for stories

  // Broadcast ID to group all notifications from the same broadcast together
  broadcastId: { type: String, default: null }, // Used to identify notifications from same broadcast

  // Broadcast target type: 'all', 'users', 'region', 'district'
  broadcastTarget: { type: String, enum: ['all', 'users', 'region', 'district', 'public'], default: null }

}, { timestamps: true });

// Mark single notification as read
NotificationSchema.methods.markAsRead = function () {
  this.read = true;
  return this.save();
};

// Get unread count helper
NotificationSchema.statics.getUnreadCount = function (userId) {
  if (!userId) return Promise.resolve(0);
  return this.countDocuments({ userId, read: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);
