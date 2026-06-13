const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const saveFcmToken = async (req, res) => {
  const { token } = req.body;
  const user_id = req.user_id; // Diambil dari authMiddleware

  if (!user_id || !token) {
    return res.status(400).json({ error: 'Token wajib diisi!' });
  }

  try {
    const { error } = await supabase
      .from('user_fcm_tokens')
      .upsert(
        { user_id: user_id, token: token }, 
        { onConflict: 'user_id' }
      );
      
    if (error) throw error;
    
    res.json({ status: 'success', message: 'Token FCM berhasil disimpan!' });
  } catch (error) {
    console.error('Error save FCM token:', error);
    res.status(500).json({ error: 'Gagal menyimpan token FCM' });
  }
};

const sendFcmNotification = async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ status: 'success', message: 'Notifikasi berhasil terkirim!', response });
  } catch (error) {
    console.error('Error mengirim notifikasi Firebase:', error);
    res.status(500).json({ error: 'Gagal mengirim notifikasi.' });
  }
};

module.exports = { saveFcmToken, sendFcmNotification };