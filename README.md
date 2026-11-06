# Aksara Flora - Website Penjualan Bunga

Website statis (HTML + CSS + JavaScript murni) untuk toko bunga online. Ada katalog 11 produk (bunga, filler, paket) dengan foto, keranjang, checkout, dan pesanan yang otomatis masuk ke **Google Sheets** (bisa diunduh sebagai Excel `.xlsx`), plus pelacakan **Google Analytics 4**. Bisa langsung di-deploy ke **GitHub Pages**.

## Struktur File

| File | Fungsi |
|---|---|
| `index.html` | Beranda |
| `tentang.html` | Tentang kami |
| `produk.html` | Katalog 8 produk + tombol tambah ke keranjang |
| `keranjang.html` | Keranjang (ubah jumlah, hapus, kode promo) |
| `checkout.html` | Form data pemesan, kirim pesanan |
| `faq.html` | Pertanyaan umum |
| `images/` | Foto tim di halaman Tentang (`tim-1`, `tim-2`, `tim-3`) |
| `dashboard.html` + `dashboard.js` | Dashboard penjualan (dikunci dengan kunci rahasia) |
| `style.css` | Seluruh tampilan (font Playfair Display + Plus Jakarta Sans) |
| `app.js` | Katalog, keranjang, checkout |
| `config.js` | **Tempat menempel URL Google Apps Script (`SHEET_URL`) dan ID Google Analytics (`GA_ID`)** |
| `apps-script/Code.gs` | Kode yang ditempel ke Google Sheets |

## Alur Pemesanan

Katalog → **Tambah ke Keranjang** → Keranjang (atur jumlah, kode promo `BEHINDTHISMOMENT` = diskon 11%, hanya berlaku 11 November 2026) → **Checkout** (pemesan, penerima, tanggal kirim, alamat, kartu ucapan) → data masuk ke Google Sheets → halaman sukses menampilkan **QRIS** + tombol **kirim pesanan ke WhatsApp**.

Mengubah produk atau harga: edit array `PRODUCTS` di bagian atas `app.js`. Semua halaman ikut berubah.

## Sambungkan ke Google Sheets

GitHub Pages hanya bisa menyajikan file statis, jadi data pesanan dikirim ke Google Apps Script yang menuliskannya ke Sheets. Gratis, tanpa server.

1. Buka [sheets.new](https://sheets.new) lalu beri nama, misalnya `Pesanan Aksara Flora`.
2. Menu **Extensions → Apps Script**.
3. Hapus kode bawaan, lalu tempel seluruh isi `apps-script/Code.gs`. Klik **Save**.
4. Klik **Deploy → New deployment**, ikon roda gigi → pilih **Web app**, lalu isi:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Klik **Deploy** dan izinkan akses (Google akan minta otorisasi, pilih akun → *Advanced* → *Go to … (unsafe)* → *Allow*; ini normal untuk script buatan sendiri).
6. Salin **Web app URL** (berakhiran `/exec`).
7. Buka `config.js`, tempel ke `SHEET_URL`:
   ```js
   const SHOP_CONFIG = {
       SHEET_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec'
   };
   ```
8. Tes: buka URL tadi di browser, harus muncul `{"ok":true,"message":"Aksara Flora API aktif"}`. Lalu lakukan satu checkout di website. Sheet **Pesanan** dan **Detail Item** akan terbuat otomatis dan terisi.

> Kalau kamu mengubah `Code.gs` setelah deploy, buat versi baru: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL-nya tetap sama.

**Jadi Excel:** di Google Sheets pilih **File → Download → Microsoft Excel (.xlsx)**.

## Mengganti Foto Tim (halaman Tentang)

Bagian "Tim Kami" menampilkan 3 foto (kiri, tengah, kanan), masing-masing dengan nama, keterangan, dan paragraf. Foto sementara berupa siluet (`images/tim-1.svg` sampai `tim-3.svg`).

- **Ganti foto:** simpan foto asli ke folder `images/` dengan nama **`tim-1.jpg`**, **`tim-2.jpg`**, **`tim-3.jpg`** (kiri, tengah, kanan). Foto otomatis dipakai tanpa mengubah kode. Foto persegi (rasio 1:1, sekitar 400x400 px) paling pas karena ditampilkan bulat.
- **Ganti nama, keterangan, paragraf:** edit bagian `<article class="team-card">` di `tentang.html`.

## Dashboard Penjualan

Buka `dashboard.html` (ada link "Dashboard" di footer). Isinya: jumlah pesanan, total omzet, rata-rata per pesanan, pengiriman mendatang, grafik omzet 14 hari, produk terlaris, metode pembayaran, dan 10 pesanan terbaru.

**Memasang kunci dashboard** (wajib, tanpa kunci data tidak akan tampil):
1. Buka Apps Script (Extensions → Apps Script di Sheet kamu) dan tempel `Code.gs` versi terbaru.
2. Klik ikon roda gigi **Project Settings** → **Script Properties** → **Add script property**.
3. Isi **Property**: `DASHBOARD_KEY`, **Value**: kunci rahasia pilihanmu (panjang dan acak, jangan dibagikan). Simpan.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL tetap sama).
5. Buka dashboard dan masukkan kunci tadi.

Catatan keamanan:
- Dashboard hanya menerima **data tanpa nama, WhatsApp, alamat, dan isi kartu ucapan**. Data lengkap tetap hanya ada di Google Sheets kamu.
- Kunci tersimpan di Script Properties, bukan di kode yang terlihat publik. Kunci disimpan di browser hanya selama tab terbuka (sessionStorage).
- Kunjungan ke dashboard tidak dihitung di Google Analytics.
- Selama `SHEET_URL` di `config.js` kosong, dashboard berjalan di **mode demo** dan menampilkan pesanan tes yang dibuat di browser yang sama.

## Sambungkan ke Google Analytics (GA4)

1. Buka [analytics.google.com](https://analytics.google.com) → ikon roda gigi **Admin** → **Create → Property**.
2. Isi nama `Aksara Flora`, time zone **Indonesia**, currency **Indonesian Rupiah (IDR)** → Next sampai selesai.
3. Saat diminta platform, pilih **Web**. Isi URL situs (contoh `https://nama-project.vercel.app`) dan nama stream `Aksara Flora` → **Create stream**.
4. Salin **Measurement ID** di pojok kanan atas (bentuknya `G-XXXXXXXXXX`).
5. Tempel ke `config.js`:
   ```js
   GA_ID: 'G-XXXXXXXXXX',
   ```
6. `git add . && git commit -m "pasang GA4" && git push`, tunggu GitHub Pages ter-update.
7. Tes: buka situs yang sudah online (bukan localhost), lalu di Analytics buka **Reports → Realtime**. Kunjunganmu harus muncul dalam beberapa detik.

Event yang dikirim otomatis:

| Aksi di website | Event GA4 |
|---|---|
| Buka tiap halaman | `page_view` (otomatis dari GA) |
| Buka halaman Katalog | `view_item_list` |
| Klik "+ Keranjang" | `add_to_cart` |
| Hapus item dari keranjang | `remove_from_cart` |
| Buka halaman Keranjang | `view_cart` |
| Buka halaman Checkout | `begin_checkout` |
| Pesanan berhasil terkirim | `purchase` (ID pesanan, total, kode promo, daftar menu) |

Laporan penjualan ada di **Reports → Monetization → Ecommerce purchases**. Data biasanya baru muncul di laporan biasa setelah beberapa jam; **Realtime** yang paling cepat.

- Analytics **tidak aktif** kalau `GA_ID` kosong, dan juga tidak aktif saat situs dibuka lewat `localhost` atau file langsung, supaya data tes tidak mengotori laporan. Untuk ngetes lewat localhost, set `GA_TRACK_LOCAL: true` sementara.
- Nama, nomor WhatsApp, dan alamat pelanggan **tidak pernah dikirim ke Google Analytics**. Data itu hanya masuk ke Google Sheets kamu.
- GA memakai cookie. Kalau situs dipakai untuk usaha sungguhan, pertimbangkan memberi pemberitahuan penggunaan cookie / kebijakan privasi.

## Deploy (Vercel)

1. Push folder ini ke repo GitHub: `git add . && git commit -m "website bunga" && git push origin main`.
2. Di [vercel.com](https://vercel.com): **Add New → Project** → pilih repo → **Deploy** (Framework Preset: *Other*, tanpa build command).
3. Setelah selesai kamu dapat link `https://nama-project.vercel.app`. Setiap `git push` ke `main` otomatis deploy ulang.

(Alternatif: GitHub Pages lewat **Settings → Pages → Deploy from a branch → main / root**.)

## Data yang masuk ke Google Sheets

Sheet `Pesanan` (1 baris per pesanan): Waktu, ID Pesanan, Nama Pemesan, WhatsApp, Nama Penerima, Tanggal Kirim, Alamat, Kartu Ucapan, Catatan, Pembayaran, Ringkasan Item, Subtotal, Kode Promo, Diskon, Total. Sheet `Detail Item` berisi 1 baris per produk. Template siap pakai: `Pesanan_Aksara_Flora.xlsx` (kosong) dan `Pesanan_Aksara_Flora_CONTOH.xlsx` (berisi 3 pesanan contoh). Upload ke Google Drive, buka dengan Google Sheets, lalu **File → Save as Google Sheets**, baru pasang `Code.gs` dari menu **Extensions → Apps Script**.

## Mode Demo

Selama `SHEET_URL` di `config.js` masih kosong, checkout tetap jalan tapi pesanan hanya disimpan di browser (localStorage) dan halaman sukses menampilkan catatan "Mode demo".

## Catatan Keamanan

- URL Web App bersifat publik: siapa pun yang tahu URL-nya bisa mengirim data ke Sheet. Cukup untuk tugas/usaha kecil. Script sudah membatasi panjang teks, mencegah formula injection, dan menolak ID pesanan ganda.
- Harga dihitung di sisi browser, jadi pesanan di Sheet sebaiknya tetap dicek manual sebelum diproses.
- Jangan menaruh data rahasia (password, API key) di `config.js` karena file ini terbaca publik.

## Lisensi

Lihat file `LICENSE`.

## Pembayaran QRIS & WhatsApp

- Pembayaran hanya **QRIS** (non-tunai). Simpan gambar QRIS toko di `images/qris.jpg` (atau ubah `QRIS_IMAGE` di `config.js`). Selama file belum ada, halaman sukses menampilkan kotak placeholder.
- Nomor WhatsApp toko diatur di `WHATSAPP_NUMBER` pada `config.js` (format `62...`, tanpa `+`).
- Setelah checkout, pelanggan melihat QRIS dan tombol **Kirim ke WhatsApp** yang membuka chat dengan detail pesanan sudah terisi. Ada juga tombol chat WhatsApp melayang di semua halaman.
- QRIS statis tidak bisa mengisi nominal otomatis, jadi total ditampilkan di bawah kodenya. Cek mutasi/bukti bayar dengan pesanan di Sheets sebelum diproses.
