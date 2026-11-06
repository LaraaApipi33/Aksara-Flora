/**
 * AKSARA FLORA - Penerima pesanan -> Google Sheets
 *
 * Cara pakai: lihat README.md bagian "Sambungkan ke Google Sheets".
 * Script ini dipasang lewat Extensions > Apps Script di dalam Google Sheet.
 *
 * Hasilnya 2 sheet otomatis:
 *   - "Pesanan"     : 1 baris per pesanan
 *   - "Detail Item" : 1 baris per item yang dipesan
 */

const SHEET_PESANAN = 'Pesanan';
const SHEET_DETAIL  = 'Detail Item';

const HEADER_PESANAN = ['Waktu', 'ID Pesanan', 'Nama Pemesan', 'WhatsApp', 'Nama Penerima', 'Tanggal Kirim', 'Alamat',
                        'Kartu Ucapan', 'Catatan', 'Pembayaran', 'Ringkasan Item', 'Subtotal', 'Kode Promo', 'Diskon', 'Total'];
const HEADER_DETAIL  = ['Waktu', 'ID Pesanan', 'Nama Pemesan', 'Menu', 'Harga', 'Qty', 'Subtotal'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const o = JSON.parse(e.postData.contents);

    if (o.action === 'stats') return stats_(o);   // dashboard (butuh DASHBOARD_KEY)

    if (!o.orderId || typeof o.orderId !== 'string') throw new Error('orderId tidak valid');
    if (!Array.isArray(o.items) || o.items.length < 1 || o.items.length > 50) throw new Error('items tidak valid');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shPesanan = getSheet_(ss, SHEET_PESANAN, HEADER_PESANAN);
    const shDetail  = getSheet_(ss, SHEET_DETAIL, HEADER_DETAIL);

    // Cegah dobel: kalau ID pesanan sudah ada, anggap sukses tanpa menulis ulang
    const last = shPesanan.getLastRow();
    if (last > 1) {
      const ids = shPesanan.getRange(2, 2, last - 1, 1).getValues().flat();
      if (ids.indexOf(o.orderId) !== -1) return json_({ ok: true, orderId: o.orderId, duplicate: true });
    }

    const waktu = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const items = o.items.map(function (i) {
      return { nama: safe_(i.nama), harga: num_(i.harga), qty: num_(i.qty), subtotal: num_(i.subtotal) };
    });
    const ringkasan = items.map(function (i) { return i.qty + 'x ' + i.nama; }).join('; ');

    shPesanan.appendRow([
      waktu,
      safe_(o.orderId),
      safe_(o.nama),
      "'" + String(o.whatsapp || '').replace(/[^0-9+]/g, ''),   // tanda ' supaya angka 0 di depan tidak hilang
      safe_(o.penerima),
      safe_(o.tanggalKirim),
      safe_(o.alamat),
      safe_(o.kartu),
      safe_(o.catatan),
      safe_(o.pembayaran),
      ringkasan,
      num_(o.subtotal),
      safe_(o.kodePromo),
      num_(o.diskon),
      num_(o.total)
    ]);

    items.forEach(function (i) {
      shDetail.appendRow([waktu, safe_(o.orderId), safe_(o.nama), i.nama, i.harga, i.qty, i.subtotal]);
    });

    return json_({ ok: true, orderId: o.orderId });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

// Buka URL Web App di browser -> harus muncul {"ok":true,...} kalau deploy berhasil
function doGet() {
  return json_({ ok: true, message: 'Aksara Flora API aktif' });
}

/* ---------- dashboard ---------- */

// Mengembalikan daftar pesanan TANPA data pribadi (nama, WhatsApp, alamat, kartu ucapan tidak ikut).
// Kunci diatur di Project Settings > Script Properties > DASHBOARD_KEY.
function stats_(o) {
  const key = PropertiesService.getScriptProperties().getProperty('DASHBOARD_KEY');
  if (!key) throw new Error('DASHBOARD_KEY belum diatur di Script Properties');
  if (String(o.key || '') !== key) throw new Error('Kunci dashboard salah');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const shP = ss.getSheetByName(SHEET_PESANAN);
  const shD = ss.getSheetByName(SHEET_DETAIL);

  const items = {};
  if (shD && shD.getLastRow() > 1) {
    shD.getRange(2, 1, shD.getLastRow() - 1, 7).getValues().forEach(function (r) {
      (items[r[1]] = items[r[1]] || []).push({ nama: String(r[3]), harga: num_(r[4]), qty: num_(r[5]), subtotal: num_(r[6]) });
    });
  }
  let orders = [];
  if (shP && shP.getLastRow() > 1) {
    orders = shP.getRange(2, 1, shP.getLastRow() - 1, 15).getValues()
      .filter(function (r) { return r[1]; })
      .map(function (r) {
        return {
          orderId: String(r[1]), waktu: fmt_(r[0], 'yyyy-MM-dd HH:mm:ss', tz), tanggalKirim: fmt_(r[5], 'yyyy-MM-dd', tz),
          pembayaran: String(r[9]), kodePromo: String(r[12]), subtotal: num_(r[11]), diskon: num_(r[13]), total: num_(r[14]),
          items: items[r[1]] || []
        };
      })
      .slice(-1000);
  }
  return json_({ ok: true, orders: orders });
}

function fmt_(v, pattern, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, pattern) : String(v == null ? '' : v);
}

/* ---------- helper ---------- */

function getSheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#ffe0e8');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Batasi panjang + cegah formula injection (teks yang diawali = + - @ dibuat jadi teks biasa)
function safe_(v) {
  v = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
