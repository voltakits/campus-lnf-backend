const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtp, logout } = require('../controllers/authController');

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', logout);
module.exports = router;