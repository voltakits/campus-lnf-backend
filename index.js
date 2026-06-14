require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <-- KITA PENSIUNKAN LIBRARY INI!
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

// 2. SATPAM PRIBADI (PENGGANTI LIBRARY CORS)
// Ini anti-404 dan anti-crash Node 22 karena nggak pakai regex rute!
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // JIKA YANG DATANG ADALAH SATPAM PREFLIGHT (OPTIONS), LANGSUNG KASIH 200 OK!
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); 
  }

  next();
});

app.use(express.json());
app.use(cookieParser()); 

// 3. RUTE TESTER
app.get('/ping', (req, res) => {
    res.json({ message: 'PONG! CORS MANUAL SUDAH AKTIF BRO!' });
});

// 4. DAFTAR ROUTES UTAMA
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/found-items', require('./src/routes/foundItemRoutes'));
app.use('/api/fcm', require('./src/routes/fcmRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes')); 
app.use('/api/lost-reports', require('./src/routes/lostReportRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// 5. BINDING PORT BUAT RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));