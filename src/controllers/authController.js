const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const isProduction = process.env.NODE_ENV === 'production';

// ---------------------------------------------
// LOGIN GOOGLE (Domain-Based)
// ---------------------------------------------
const loginGoogle = async (req, res) => {
  const { email } = req.body;

  // 1. Validasi Domain (Backend Security)
  if (!email || !email.endsWith('@global.ac.id')) {
    return res.status(403).json({ error: 'Akses ditolak! Gunakan email mahasiswa @global.ac.id' });
  }

  try {
    // 2. Cek apakah user sudah ada di database
    let { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // 3. Jika user belum ada, registrasi otomatis
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: crypto.randomUUID(),
          email,
          name: email.split('@')[0],
          role: 'mahasiswa'
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      user = newUser;
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 5. Set Cookie Auth
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      status: 'success',
      user: { email: user.email, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error('Error Login Google:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
};

// ---------------------------------------------
// LOGOUT
// ---------------------------------------------
const logout = (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ status: 'success', message: 'Berhasil logout' });
};

module.exports = { loginGoogle, logout };