const express = require('express');
const router = express.Router();
const { getMyNotifications } = require('../controllers/notificationController');

// IMPORT MIDDLEWARE AUTH-NYA BRO
const authMiddleware = require('../middleware/authMiddleware'); // Pastikan path foldernya bener

// PASANG MIDDLEWARE-NYA DI SINI
// Pake '/' aja karena '/api/notifications' udah diurus di server.js
router.get('/', authMiddleware, getMyNotifications);

module.exports = router;