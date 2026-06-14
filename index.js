require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); 
const cookieParser = require('cookie-parser');
const ws = require('ws');

globalThis.WebSocket = ws; 
const app = express();

// 1. Inisialisasi Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
}

// 2. SETUP CORS STANDAR INTERNASIONAL (Anti Nyangkut)
const corsOptions = {
  origin: true, // Otomatis ngebaca Vercel
  credentials: true 
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // <--- Ini yang bakal ngebunuh 404 Preflight

app.use(express.json());
app.use(cookieParser()); 

// 3. RUTE TESTER (Buat ngecek Railway nyangkut atau nggak)
app.get('/ping', (req, res) => {
    res.json({ message: 'PONG! KODINGAN TERBARU SUDAH AKTIF BRO!' });
});

// 4. DAFTAR ROUTES UTAMA
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/found-items', require('./src/routes/foundItemRoutes'));
app.use('/api/fcm', require('./src/routes/fcmRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes')); 
app.use('/api/lost-reports', require('./src/routes/lostReportRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 5. BINDING PORT 0.0.0.0 (Wajib buat Railway biar stabil)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));