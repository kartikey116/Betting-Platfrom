const express = require('express');
const router = express.Router();
const { login, adminLogin, sendOtp, getProfile } = require('../controllers/authController');

// Define API routes for authentication
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/send-otp', sendOtp);
router.get('/profile', getProfile);


module.exports = router;
