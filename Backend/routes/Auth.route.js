const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/Auth.controller');

// =================== NEW PASSWORD-ONLY ROUTES ===================
// Get all admins for dropdown
router.get('/admins', AuthController.getAllAdmins);

// User signup with password (no OTP)
router.post('/User-signup', AuthController.userSignup);

// User login with password (no OTP)
router.post('/User-login', AuthController.userLogin);


// Login routes
router.post('/User-login-password', AuthController.userLoginPassword);


// Password management routes
router.post('/User-check-password', AuthController.checkUserPassword);
router.post('/User-create-password', AuthController.createUserPassword);


// =================== ADMIN ROUTES ===================
router.post('/Admin-login', AuthController.adminLogin);


module.exports = router;
