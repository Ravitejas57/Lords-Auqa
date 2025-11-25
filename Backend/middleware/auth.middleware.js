const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches userId to req.userId for use in routes
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login again.',
        requiresLogin: true
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Please login again.',
        requiresLogin: true
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach userId to request object
    req.userId = decoded.userId;
    req.user = decoded; // Contains userId, phoneNumber, name, etc.

    console.log('✅ Token verified for user:', req.userId);

    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please login again.',
        requiresLogin: true,
        expired: true
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        requiresLogin: true
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.',
      requiresLogin: true
    });
  }
};

/**
 * Admin-only Middleware
 * Checks if the authenticated user is an admin
 */
const adminOnly = async (req, res, next) => {
  try {
    const Admin = require('../models/Admin.model');

    // Check if user is admin by looking up in Admin collection
    const admin = await Admin.findOne({ adminId: req.userId });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.admin = admin;
    console.log('✅ Admin access granted:', admin.username);
    next();
  } catch (error) {
    console.error('❌ Admin verification error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Admin verification failed.'
    });
  }
};

module.exports = { verifyToken, adminOnly };
