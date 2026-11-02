/* ==========================================================
   KONFIGURASI AKSARA FLORA
   SHEET_URL = URL Web App dari Google Apps Script. GA_ID = Measurement ID Google Analytics 4.
   Cara bikinnya ada di README.md (bagian "Sambungkan ke Google Sheets").

   Selama SHEET_URL masih kosong, website jalan di MODE DEMO:
   pesanan cuma disimpan di browser (localStorage), belum masuk Sheets.
   ========================================================== */
const SHOP_CONFIG = {
    SHEET_URL: 'https://script.google.com/macros/s/AKfycbzrL2Exz0W-2129thi7RojGj-wadLLW9RBAeNlITx-xxoUQK7xPsFi8X6FgdFIWeQXJCg/exec',  // contoh: 'https://script.google.com/macros/s/AKfycb.../exec'

    // Google Analytics 4: isi dengan Measurement ID, contoh: 'G-ABCDE12345'
    // Kosong = Analytics mati. Saat dibuka lewat localhost / file langsung, Analytics juga tidak aktif.
    GA_ID: 'G-127LPY7620',
    GA_TRACK_LOCAL: false   // ubah ke true hanya kalau mau ngetes lewat localhost (GA DebugView)
};
