const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * ========================================================
 * TAMBAH BARANG TEMUAN BARU (ADMIN)
 * ========================================================
 */
const createFoundItem = async (req, res) => {
  const {
    item_name,
    category,
    location_found,
    description_private
  } = req.body;

  const file = req.file;
  const today = new Date().toISOString().split('T')[0];

  try {
    let image_url = null;

    // Upload gambar ke Storage[cite: 6]
    if (file) {
      const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('item_images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('item_images')
        .getPublicUrl(fileName);

      image_url = data.publicUrl;
    }

    // Simpan ke database[cite: 6]
    const { data: insertedItem, error: dbError } = await supabase
      .from('found_items')
      .insert([
        {
          item_name,
          category,
          location_found,
          date_found: today,
          description_private,
          image_url,
          status: 'private' // PENTING[cite: 6]
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // ===============================================================
    // TAMBAHAN BARU: INSERT NOTIFIKASI MASAL KE SEMUA MAHASISWA
    // ===============================================================
    // 1. Ambil SEMUA email dari tabel users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('email');

    if (!usersError && allUsers && allUsers.length > 0) {
      // 2. Siapkan keranjang (array) berisi notif untuk masing-masing email
      const bulkNotifications = allUsers.map(user => ({
        email: user.email,
        title: '📢 Ada Barang Temuan Baru!',
        message: 'Ada barang temuan baru di kampus. Jika merasa kehilangan, silakan buat laporan kehilangan.'
      }));

      // 3. Tembak langsung semuanya ke database (Bulk Insert)
      await supabase.from('notifications').insert(bulkNotifications);
    }
    // ===============================================================

    // Ambil semua token FCM[cite: 6]
    const { data: tokensData, error: tokenError } = await supabase
      .from('user_fcm_tokens')
      .select('token');

    if (tokenError) {
      console.error('Gagal mengambil token:', tokenError);
    }

    // Kirim notifikasi tanpa bocorin barang[cite: 6]
    if (tokensData && tokensData.length > 0) {
      const tokens = tokensData.map(t => t.token);

      const message = {
        notification: {
          title: '📢 Ada Barang Temuan Baru!',
          body: 'Ada barang temuan baru di kampus. Jika merasa kehilangan, silakan buat laporan kehilangan.'
        },
        tokens
      };

      admin.messaging()
        .sendEachForMulticast(message)
        .then(response => {
          console.log(
            `Notif terkirim ke ${response.successCount} perangkat`
          );
        })
        .catch(err => {
          console.error('Gagal kirim notif:', err);
        });
    }

    res.json({
      status: 'success',
      message: 'Barang berhasil disimpan ke gudang private',
      data: insertedItem
    });

  } catch (error) {
    console.error('Error createFoundItem:', error);

    res.status(500).json({
      status: 'error',
      error: 'Gagal menyimpan barang temuan'
    });
  }
};

/**
 * ========================================================
 * AMBIL BARANG PUBLIK (MAHASISWA)
 * ========================================================
 */
const getPublicFoundItems = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('found_items')
      .select(`
        id,
        item_name,
        category,
        location_found,
        date_found,
        image_url,
        created_at
      `)
      .eq('status', 'public')
      .order('created_at', {
        ascending: false
      });

    if (error) throw error;

    res.json({
      status: 'success',
      data
    });

  } catch (error) {
    console.error('Error getPublicFoundItems:', error);

    res.status(500).json({
      status: 'error',
      error: 'Gagal mengambil data barang temuan'
    });
  }
};

const getStudentAnnouncements = async (req, res) => {
  try {

    const { count, error } = await supabase
      .from('found_items')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('status', 'private');

    if (error) throw error;

    const announcements = [];

    for (let i = 0; i < count; i++) {
      announcements.push({
        id: i,
        message:
          'Telah ditemukan barang di lingkungan kampus. Jika merasa kehilangan barang, silakan membuat laporan kehilangan untuk proses verifikasi.',
        created_at: new Date()
      });
    }

    res.json({
      status: 'success',
      data: announcements
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Gagal mengambil pengumuman.'
    });
  }
};

const getMyMatchedItems = async (req, res) => {
  try {
    const userId = req.user_id;

    const { data, error } = await supabase
      .from('lost_reports')
      .select(`
        id,
        status,
        matched_item_id,
        created_at,
        detailed_description, 
        found_items (
          id,
          item_name,
          category,
          location_found,
          image_url,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'Siap Diambil');

    if (error) throw error;

    res.json({
      status: 'success',
      data
    });

  } catch (error) {
    console.error('Error getMyMatchedItems:', error);

    res.status(500).json({
      status: 'error',
      error: 'Gagal mengambil barang yang siap diambil.'
    });
  }
};

module.exports = {
  createFoundItem,
  getPublicFoundItems,
  getStudentAnnouncements,
  getMyMatchedItems
};