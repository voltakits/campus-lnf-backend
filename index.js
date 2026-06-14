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

// Inisialisasi Firebase Admin pakai 3 Variabel (Jurus Bongkar Mesin)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Jurus ninja maksa Node.js nerjemahin teks \n jadi tombol Enter
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
}

const allowedOrigins = [
  'http://localhost:5173', // Izin buat frontend di laptop lu
  process.env.FRONTEND_URL // Izin buat frontend di Vercel/Netlify nanti
];

// 2. SETUP CORS UNTUK HTTP-ONLY COOKIES
app.use(cors({
  origin: [
    'http://localhost:5173', // Izin buat frontend di laptop
    'https://frontend-campus-lnf.vercel.app', // Tembak langsung URL Vercel lu di sini!
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser()); 

// 3. DAFTAR ROUTES
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/found-items', require('./src/routes/foundItemRoutes'));
app.use('/api/fcm', require('./src/routes/fcmRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/lost-reports', require('./src/routes/lostReportRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 4. FIX PORT DINAMIS BUAT RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));