const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true, // allows multiple users without email
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    assignedAdmin: {
      type: String,
      required: false,  // optional if you don’t want to always send it
      default: "admin"  // you can also default it
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserAuth', UserSchema);
