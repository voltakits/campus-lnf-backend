const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const createLostReport = async (req, res) => {
  const { email, title, category, location, description } = req.body;
  const file = req.file; 

  if (!email || !title || !category || !location) {
    return res.status(400).json({ error: 'Data laporan belum lengkap!' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Data user tidak valid.' });
    }

    let image_url = null;

    if (file) {
      const fileName = `lost_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item_images') 
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('item_images')
        .getPublicUrl(fileName);

      image_url = publicUrlData.publicUrl;
    }

    // TRANSLATE 'title' DARI VUE JADI 'item_name' BUAT SUPABASE
    const { error: insertError } = await supabase
      .from('lost_reports')
      .insert([{
        user_id: userData.id,
        item_name: title,
        category: category,
        last_seen_location: location,        
        detailed_description: description,   
        date_lost: today,                    
        image_url: image_url,
        status: 'Menunggu Verifikasi'
      }]);

    if (insertError) throw insertError;

    res.json({ status: 'success', message: 'Laporan berhasil dikirim!' });

  } catch (error) {
    console.error('Error submit laporan:', error);
    res.status(500).json({ error: 'Gagal membuat laporan.' });
  }
};

const getMyReports = async (req, res) => {
  const user_id = req.user_id; // ID aman, diambil dari authMiddleware

  try {
    const { data: reports, error } = await supabase
      .from('lost_reports')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // TRANSLATE BALIK BIAR VUE NGGAK ERROR
    const formattedReports = reports.map(r => ({
      id: r.id,
      title: r.item_name,  // Kembalikan jadi 'title' buat frontend
      category: r.category,
      location: r.last_seen_location, 
      description: r.detailed_description,
      status: r.status,
      created_at: r.created_at,
      image_url: r.image_url
    }));

    res.json({ status: 'success', data: formattedReports });
  } catch (error) {
    console.error('Error fetch riwayat:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat pribadi.' });
  }
};

// FUNGSI BARU: Ambil laporan yang berstatus 'Dicari'
const getBroadcastedLostItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lost_reports')
      .select('id, item_name, category, last_seen_location, detailed_description, created_at, image_url')
      .eq('status', 'Dicari')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Error fetch broadcast items:', error);
    res.status(500).json({ error: 'Gagal mengambil data pencarian barang.' });
  }
};

// FUNGSI BARU: Perbaiki Laporan yang Ditolak
// FUNGSI DIPERBARUI: Perbaiki Laporan (Semua Field)
const resubmitReport = async (req, res) => {
  const { id } = req.params;
  // Tangkap semua field dari frontend
  const { item_name, category, last_seen_location, new_description } = req.body;
  const userId = req.user_id; 

  try {
    const { error } = await supabase
      .from('lost_reports')
      .update({ 
        item_name: item_name,
        category: category,
        last_seen_location: last_seen_location,
        detailed_description: new_description, // <--- Cuma pakai detailed_description aja
        status: 'Menunggu Verifikasi',
        rejection_reason: null 
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      status: 'success',
      message: 'Laporan berhasil diperbaiki dan diajukan ulang!'
    });

  } catch (error) {
    console.error('Error resubmit report:', error);
    res.status(500).json({ error: 'Gagal memperbaiki laporan' });
  }
};



// Pastikan fungsi barunya ikut diexport di paling bawah!
module.exports = { createLostReport, getMyReports, getBroadcastedLostItems, resubmitReport };

