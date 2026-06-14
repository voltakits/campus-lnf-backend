const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPEmail } = require('../../utils/mailer');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email wajib diisi!' });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60000).toISOString();

  try {
    const { error: dbError } = await supabase.from('otp_codes').insert([{ email, otp_code: otpCode, expires_at: expiresAt }]);
    if (dbError) throw dbError;

    const emailSent = await sendOTPEmail(email, otpCode);
    if (!emailSent) return res.status(500).json({ error: 'Gagal mengirim email OTP.' });

    res.json({ status: 'success', message: 'OTP berhasil dikirim ke email.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error saat request OTP.' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) return res.status(400).json({ error: 'Data tidak lengkap!' });

  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return res.status(401).json({ error: 'OTP salah/kadaluwarsa!' });

    await supabase.from('otp_codes').delete().eq('id', data.id);

    let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    if (!user) {
      const { data: newUser } = await supabase.from('users').insert([{
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
        role: 'mahasiswa'
      }]).select().single();
      user = newUser;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // PASANG COOKIE HTTP-ONLY
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true, // true jika di production (HTTPS)
      sameSite: none, // <--- PENTING: Pakai 'lax' biar diizinin lintas port saat development
      maxAge: 24 * 60 * 60 * 1000 // 24 jam
    });

    res.json({ 
        status: 'success', 
        user: { email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error saat verifikasi.' });
  }
};
const logout = (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: none
  });
  res.json({ status: 'success', message: 'Berhasil logout' });
};

module.exports = { requestOtp, verifyOtp, logout };