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

// 3. SETUP CORS JURUS NUKLIR (Otomatis nerima domain Vercel & laptop)
app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true 
}));

// 4. JURUS PAKSA BUKA PINTU PREFLIGHT (Anti 404 CORS Error)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end(); // Langsung suruh satpamnya masuk (200 OK)
  }
  next();
});

app.use(express.json());
app.use(cookieParser()); 

// 5. DAFTAR ROUTES 
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/found-items', require('./src/routes/foundItemRoutes'));
app.use('/api/fcm', require('./src/routes/fcmRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes')); 
app.use('/api/lost-reports', require('./src/routes/lostReportRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 6. FIX PORT DINAMIS BUAT RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));