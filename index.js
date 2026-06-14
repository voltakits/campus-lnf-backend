require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

// 1. Fix WebSocket untuk Supabase di Node 20
const ws = require('ws');
globalThis.WebSocket = ws; 
const app = express();

// Inisialisasi Firebase Admin
if (!admin.apps.length) {
  // Kita suruh server ngebaca dari Environment Variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  // FIX JALUR NINJA BUAT \n
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const allowedOrigins = [
  'http://localhost:5173', // Izin buat frontend di laptop lu
  process.env.FRONTEND_URL // Izin buat frontend di Vercel/Netlify nanti
];

// 2. SETUP CORS UNTUK HTTP-ONLY COOKIES
app.use(cors({
  origin: function (origin, callback) {
    // Kalau origin-nya terdaftar, atau dari alat tester (postman/insomnia)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Wajib ada biar Cookie bisa lewat
}));

app.use(express.json());
app.use(cookieParser()); 

// 3. DAFTAR ROUTES
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/found-items', require('./src/routes/foundItemRoutes'));
app.use('/api/fcm', require('./src/routes/fcmRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/lost-reports', require('./src/routes/lostReportRoutes'));

// RUTE NOTIFIKASI YANG UDAH BENER
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 4. FIX PORT DINAMIS BUAT RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));