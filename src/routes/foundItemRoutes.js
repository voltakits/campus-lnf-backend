const express = require('express');
const router = express.Router();
const multer = require('multer');

const { 
  createFoundItem, 
  getPublicFoundItems, 
  getStudentAnnouncements, 
  getMyMatchedItems 
} = require('../controllers/foundItemController');

// PERBAIKAN 1: Hapus kurung kurawal {} biar gak undefined
const authMiddleware = require('../middleware/authMiddleware'); 

const upload = multer({ storage: multer.memoryStorage() });

// Route untuk ngambil data public
router.get('/public', getPublicFoundItems);

// Route untuk input barang akademik 
// (Saran: Kalau lu udah punya middleware khusus admin, taro di sebelah upload.single)
router.post('/', upload.single('image'), createFoundItem);

// Route untuk ngambil pengumuman private
router.get('/announcements', getStudentAnnouncements);

// PERBAIKAN 2: Rapihin formatnya
router.get('/my-items', authMiddleware, getMyMatchedItems);

module.exports = router;