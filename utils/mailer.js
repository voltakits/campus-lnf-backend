// utils/mailer.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (toEmail, otpCode) => {
  try {
    const { error } = await resend.emails.send({
      from: 'Campus Lost & Found <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Kode OTP Login - Jangan Berikan ke Siapapun',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Verifikasi Login Mahasiswa</h2>
          <p>Gunakan kode OTP 6 digit di bawah ini untuk masuk ke Campus Lost & Found.</p>
          <h1 style="color: #2563eb; letter-spacing: 5px;">${otpCode}</h1>
          <p style="color: #64748b; font-size: 14px;">Kode ini hanya berlaku selama 5 menit.</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log(`Email OTP sukses terkirim ke: ${toEmail}`);
    return true;
  } catch (err) {
    console.error('Gagal mengirim email OTP:', err);
    return false;
  }
};

module.exports = { sendOTPEmail };