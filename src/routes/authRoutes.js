const express = require('express');
const router = express.Router();

// Fungsi di-extract langsung di sini
const { logout, loginGoogle } = require('../controllers/authController');

// Panggil langsung nama fungsinya!
router.post('/login-google', loginGoogle);
router.post('/logout', logout);

module.exports = router;