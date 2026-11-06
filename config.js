/* ==========================================================
   KONFIGURASI AKSARA FLORA
   SHEET_URL = URL Web App dari Google Apps Script. GA_ID = Measurement ID Google Analytics 4.
   Cara bikinnya ada di README.md (bagian "Sambungkan ke Google Sheets").

   Selama SHEET_URL masih kosong, website jalan di MODE DEMO:
   pesanan cuma disimpan di browser (localStorage), belum masuk Sheets.
   ========================================================== */
const SHOP_CONFIG = {
    SHEET_URL: 'https://script.google.com/macros/s/AKfycbzrL2Exz0W-2129thi7RojGj-wadLLW9RBAeNlITx-xxoUQK7xPsFi8X6FgdFIWeQXJCg/exec',

    // Google Analytics 4: isi dengan Measurement ID, contoh: 'G-ABCDE12345'
    // Kosong = Analytics mati. Saat dibuka lewat localhost / file langsung, Analytics juga tidak aktif.
    GA_ID: 'G-8V4X5NG8C8',
    GA_TRACK_LOCAL: false,   // ubah ke true hanya kalau mau ngetes lewat localhost (GA DebugView)

    // Gambar QRIS toko. Simpan file QRIS kamu di images/qris.jpg (atau ganti path di sini).
    QRIS_IMAGE: 'images/QrisAksara.jpeg'
};

// Nomor WhatsApp toko, format internasional tanpa + dan tanpa spasi (62 = Indonesia)
const WHATSAPP_NUMBER = '6285695433665';
