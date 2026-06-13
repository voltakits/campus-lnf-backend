const express = require('express');
const router = express.Router();
const { saveFcmToken, sendFcmNotification } = require('../controllers/fcmController');
const authMiddleware = require('../middleware/authMiddleware'); // Pastikan path-nya bener

// Route untuk menyimpan token (DILINDUNGI authMiddleware)
router.post('/save-token', authMiddleware, saveFcmToken);

// Route untuk mengirim notifikasi push
router.post('/send', sendFcmNotification);

module.exports = router;