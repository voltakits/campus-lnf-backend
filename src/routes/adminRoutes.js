const express = require('express');
const router = express.Router();
// Import 3 fungsi dari controller
const { getAdminDashboardData, getAllReports, updateReportStatus, matchReportWithItem, broadcastLostItem, rejectReport } = require('../controllers/adminController');

router.get('/dashboard-data', getAdminDashboardData);
router.get('/reports', getAllReports); // Route buat nampilin daftar laporan
router.put('/reports/:id/status', updateReportStatus); // Route buat tombol verifikasi
router.post('/match-report', matchReportWithItem);
router.post('/reports/:id/broadcast', broadcastLostItem);
router.put('/reports/:id/reject', rejectReport);
module.exports = router;