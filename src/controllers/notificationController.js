const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const getMyNotifications = async (req, res) => {
    // Ambil ID user dari cookie/middleware (sama persis kayak getMyReports)
    const userId = req.user_id; 

    try {
        // 1. Cari email user ini di tabel users
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (userError || !user) throw new Error('User tidak ditemukan');

        // 2. Tarik notifikasi berdasarkan emailnya
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ status: 'success', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal menarik notifikasi' });
    }
};

module.exports = { getMyNotifications };