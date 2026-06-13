const { createClient } = require('@supabase/supabase-js')
const admin = require('firebase-admin');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Dashboard Admin
const getAdminDashboardData = async (req, res) => {
  try {
    const { data: privateItems, error: itemsError } = await supabase
      .from('found_items')
      .select('*')
      .eq('status', 'private')
      .order('created_at', { ascending: false })

    if (itemsError) throw itemsError

    const { data: reports, error: reportsError } = await supabase
      .from('lost_reports')
      .select('id')
      .in('status', [
        'Menunggu Verifikasi',
        'Siap Diambil'
      ]);

    if (reportsError) throw reportsError

    res.json({
      status: 'success',
      data: {
        privateItems: privateItems || [],
        totalReports: reports?.length || 0
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Gagal mengambil data dashboard'
    })
  }
}

// Ambil semua laporan
const getAllReports = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lost_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      status: 'success',
      data
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Gagal mengambil laporan'
    })
  }
}

// Update status laporan
const updateReportStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // 1. Update status laporan di lost_reports
    const { error: reportError } = await supabase
      .from('lost_reports')
      .update({ status })
      .eq('id', id);

    if (reportError) throw reportError;

    // 2. Kalau statusnya diset selesai, eksekusi pembaruan ke found_items
    if (status.toLowerCase() === 'selesai') {
      
      // Ambil user_id pelapor dan ID barang temuannya
      const { data: report, error: fetchError } = await supabase
        .from('lost_reports')
        .select('matched_item_id, user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 3. Masukkan user_id pelapor ke kolom claimed_by
      if (report?.matched_item_id) {
        const { error: itemError } = await supabase
          .from('found_items')
          .update({
            status: 'selesai',
            claimed_by: report.user_id
          })
          .eq('id', report.matched_item_id);

        if (itemError) throw itemError;
      }
    }

    res.json({
      status: 'success',
      message: 'Status berhasil diupdate'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Gagal update status'
    });
  }
};

// Cocokkan laporan dengan barang
const matchReportWithItem = async (req, res) => {
  const { reportId, itemId } = req.body

  try {
    // Update laporan
    const { error: reportError } = await supabase
      .from('lost_reports')
      .update({
        status: 'Siap Diambil',
        matched_item_id: itemId
      })
      .eq('id', reportId)

    if (reportError) throw reportError

    // Update barang jadi Public
    const { error: itemError } = await supabase
      .from('found_items')
      .update({
        status: 'public'
      })
      .eq('id', itemId)

    if (itemError) throw itemError

    // Ambil data pelapor
    const { data: reportData } = await supabase
      .from('lost_reports')
      .select('user_id, item_name')
      .eq('id', reportId)
      .single()

    if (reportData) {
      
      // ===============================================================
      // INSERT NOTIFIKASI KE DATABASE SAAT BARANG DICOCOKKAN
      // ===============================================================
      // 1. Ambil email pelapor dari tabel users
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', reportData.user_id)
        .single();

      // 2. Insert notifikasi ke tabel notifications
      if (userData?.email) {
        await supabase.from('notifications').insert([
          {
            email: userData.email,
            title: 'Kabar Baik!',
            message: `Laporan kehilangan lu untuk "${reportData.item_name}" telah berhasil dicocokkan! Barang saat ini aman di akademik.`
          }
        ]);
      }
      // ===============================================================

      const { data: tokenData } = await supabase
        .from('user_fcm_tokens')
        .select('token')
        .eq('user_id', reportData.user_id)
        .single()

      if (tokenData?.token) {
        await fetch(
          'http://localhost:3000/api/fcm/send',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: tokenData.token,
              title: 'Barang Ditemukan!',
              body: `${reportData.item_name} telah ditemukan. Silakan datang ke akademik dengan membawa KTM.`
            })
          }
        )
        console.log('Notif berhasil dikirim')
      }
    }

    res.json({
      status: 'success',
      message: 'Barang berhasil dicocokkan'
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Gagal mencocokkan barang'
    })
  }
}

// Broadcast Pencarian ke Mahasiswa
const broadcastLostItem = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Ambil detail barang yang hilang
    const { data: report, error: reportError } = await supabase
      .from('lost_reports')
      .select('item_name, category, last_seen_location')
      .eq('id', id)
      .single();

    if (reportError) throw reportError;

    // 2. Sekalian update statusnya jadi "Dicari" kalau belum
    await supabase
      .from('lost_reports')
      .update({ status: 'Dicari' })
      .eq('id', id);

    // 3. Tarik SEMUA token FCM mahasiswa
    const { data: tokensData, error: tokenError } = await supabase
      .from('user_fcm_tokens')
      .select('token');

    if (tokenError) console.error('Gagal narik token:', tokenError);

    // 4. Kirim Push Notif masal!
    if (tokensData && tokensData.length > 0) {
      const tokens = tokensData.map(t => t.token);

      const message = {
        notification: {
          title: '🚨 BANTUAN PENCARIAN BARANG',
          body: `Telah hilang: ${report.item_name} (Kategori: ${report.category}) di sekitar ${report.last_seen_location}. Jika ada yang menemukan, harap segera serahkan ke Staf Akademik!`
        },
        tokens
      };

      admin.messaging().sendEachForMulticast(message)
        .then(response => console.log(`Broadcast berhasil dikirim ke ${response.successCount} HP mahasiswa`))
        .catch(err => console.error('Error broadcast FCM:', err));
    }

    res.json({
      status: 'success',
      message: 'Notifikasi pencarian berhasil disebar ke seluruh mahasiswa!'
    });

  } catch (error) {
    console.error('Error broadcast:', error);
    res.status(500).json({ error: 'Gagal melakukan broadcast pencarian' });
  }
};

// Tolak Laporan & Kirim Alasan
const rejectReport = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Alasan penolakan wajib diisi!' });
  }

  try {
    // 1. Update status jadi Ditolak dan masukkan alasannya
    const { data: report, error: updateError } = await supabase
      .from('lost_reports')
      .update({ 
        status: 'Ditolak', 
        rejection_reason: reason 
      })
      .eq('id', id)
      .select('user_id, item_name') // Tarik user_id pelapor buat notif
      .single();

    if (updateError) throw updateError;

    // ===============================================================
    // INSERT NOTIFIKASI KE DATABASE SAAT LAPORAN DITOLAK
    // ===============================================================
    // 1. Ambil email pelapor dari tabel users
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', report.user_id)
      .single();

    // 2. Insert notifikasi penolakan ke tabel notifications
    if (userData?.email) {
      await supabase.from('notifications').insert([
        {
          email: userData.email,
          title: 'Laporan Ditolak',
          message: `Laporan kehilangan lu untuk "${report.item_name}" ditolak. Alasan: ${reason}`
        }
      ]);
    }
    // ===============================================================

    // 3. Kirim Notifikasi FCM 
    const { data: tokensData } = await supabase
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', report.user_id);

    if (tokensData && tokensData.length > 0) {
      const tokens = tokensData.map(t => t.token);
      const message = {
        notification: {
          title: '🚨 Laporan Ditolak',
          body: `Laporan kehilangan untuk "${report.item_name}" ditolak. Alasan: ${reason}`
        },
        tokens
      };
      admin.messaging().sendEachForMulticast(message)
        .then(() => console.log('Notif penolakan terkirim ke pelapor'))
        .catch(err => console.error('Gagal kirim notif:', err));
    }

    res.json({
      status: 'success',
      message: 'Laporan berhasil ditolak.'
    });

  } catch (error) {
    console.error('Error rejectReport:', error);
    res.status(500).json({ error: 'Gagal menolak laporan' });
  }
};

module.exports = {
  getAdminDashboardData,
  getAllReports,
  updateReportStatus,
  matchReportWithItem,
  broadcastLostItem,
  rejectReport
}