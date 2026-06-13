const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware auth

// Setup memori untuk simpan gambar sementara sebelum dilempar ke Supabase
const upload = multer({ storage: multer.memoryStorage() });

const { createLostReport, getMyReports, getBroadcastedLostItems, resubmitReport } = require('../controllers/lostReportController');

// Tambahin upload.single('image') sebagai satpam di tengah
router.post('/submit', upload.single('image'), createLostReport);

// Route narik laporan pribadi sekarang dilindungi authMiddleware
router.get('/my-reports', authMiddleware, getMyReports); 
router.get('/broadcasts', getBroadcastedLostItems);
router.put('/my-reports/:id/resubmit', authMiddleware, resubmitReport);

module.exports = router;