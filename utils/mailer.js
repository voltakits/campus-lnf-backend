// File: utils/mailer.js
const nodemailer = require('nodemailer');
const dns = require('dns');

// 🚨 JURUS PAKSA JALUR IPV4 (Biar Railway ga nyasar ke IPv6 Google yang buntu)
dns.setDefaultResultOrder('ipv4first');

// Setup transporter menggunakan SMTP Gmail langsung (Anti ESOCKET)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Wajib true buat port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Mulusin jalan biar ga ditolak gara-gara sertifikat
  },
  family: 4 // <--- INI KETINGGALAN BRO! Wajib dimasukin biar ga nyasar ke IPv6
});
// Fungsi untuk mengirim email OTP
const sendOTPEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"Admin Campus Lost & Found" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Kode OTP Login Aplikasi - Jangan Berikan ke Siapapun',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Verifikasi Login Mahasiswa</h2>
        <p>Gunakan kode OTP 6 digit di bawah ini untuk masuk ke dalam sistem Campus Lost & Found.</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${otpCode}</h1>
        <p style="color: #64748b; font-size: 14px;">Kode ini hanya berlaku selama 5 menit.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email OTP sukses terkirim ke: ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Gagal mengirim email OTP:', error);
    return false;
  }
};

transporter.verify((error, success) => {
  if (error) {
    console.log("Koneksi email bermasalah:", error);
  } else {
    console.log("Server Nodemailer siap mengirim OTP via IPv4!");
  }
});

module.exports = { sendOTPEmail };