require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 
const cookieParser = require('cookie-parser');

// 1. Fix WebSocket untuk Supabase di Node 20
const ws = require('ws');
globalThis.WebSocket = ws; 
const app = express();

// 2. Inisialisasi Firebase Admin pakai 3 Variabel (Jurus Bongkar Mesin)
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

// 3. SETUP CORS HTTP-ONLY COOKIES (Jurus Sapu Jagat anti-blokir)
app.use(cors({
  origin: [
    'http://localhost:5173', // Izin buat frontend di laptop lu
    'https://frontend-campus-lnf.vercel.app', // Tembak langsung URL Vercel lu di sini!
    process.env.FRONTEND_URL
  ].filter(Boolean), // Filter biar aman kalau ada variabel env yang kosong
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser()); 

// 4. DAFTAR ROUTES (Absensi wajib biar nggak 404 Not Found)
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/found-items', require('./src/routes/foundItemRoutes'));
app.use('/api/fcm', require('./src/routes/fcmRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes')); // <-- Ini kunci utamanya bro!
app.use('/api/lost-reports', require('./src/routes/lostReportRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 5. FIX PORT DINAMIS BUAT RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));