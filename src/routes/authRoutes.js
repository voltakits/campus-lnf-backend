const express = require('express');
const router = express.Router();
const { logout, loginGoogle } = require('../controllers/authController');

router.post('/login-google', authController.loginGoogle);
router.post('/logout', logout);
module.exports = router;