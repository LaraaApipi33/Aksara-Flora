/* ==========================================================
   Aksara Flora - logika website (katalog, keranjang, checkout)
   Keranjang disimpan di localStorage yang isinya cuma
   { id, qty }. Harga selalu diambil dari katalog PRODUCTS.
   ========================================================== */

/* ---------- Katalog produk ----------
   prices: tangkai = harga per tangkai, buket = harga saat beli buket, paket = harga paket.
   Ubah harga / tambah bunga di sini, semua halaman ikut berubah. */
const CATEGORIES = [
    { id: 'Bunga',  title: 'Bunga Segar',   desc: 'Pilih per tangkai atau buket, sesuai kebutuhanmu.' },
    { id: 'Filler', title: 'Daun & Filler', desc: 'Pelengkap hijau supaya rangkaian terlihat penuh.' },
    { id: 'Paket',  title: 'Paket',         desc: 'Paket siap beri, tinggal pesan.' }
];

const PRODUCTS = [
    { id: 'mawar',     name: 'Bunga Mawar',     category: 'Bunga', image: 'images/mawar.jpg',     desc: 'Mawar merah klasik, simbol rasa sayang.',        prices: { tangkai: 20000, buket: 15000 } },
    { id: 'krisan',    name: 'Bunga Krisan',    category: 'Bunga', image: 'images/krisan.jpg',    desc: 'Krisan pink dengan kelopak berlapis.',           prices: { tangkai: 20000, buket: 10000 } },
    { id: 'gompi',     name: 'Bunga Gompi',     category: 'Bunga', image: 'images/gompi.jpg',     desc: 'Bunga bulat berwarna putih krem yang lembut.',   prices: { tangkai: 20000, buket: 15000 } },
    { id: 'pompom',    name: 'Bunga Pompom',    category: 'Bunga', image: 'images/pompom.jpg',    desc: 'Bunga putih bulat mungil yang manis.',           prices: { tangkai: 20000, buket: 10000 } },
    { id: 'matahari',  name: 'Bunga Matahari',  category: 'Bunga', image: 'images/matahari.jpg',  desc: 'Kuning cerah, pembawa semangat.',                prices: { tangkai: 30000, buket: 25000 } },
    { id: 'gerbera',   name: 'Bunga Gerbera',   category: 'Bunga', image: 'images/gerbera.jpg',   desc: 'Warna-warni ceria seperti bunga daisy besar.',   prices: { tangkai: 20000, buket: 10000 } },
    { id: 'hydrangea', name: 'Bunga Hydrangea', category: 'Bunga', image: 'images/hydrangea.jpg', desc: 'Gerombol kelopak biru keunguan yang mewah.',     prices: { tangkai: 35000, buket: 30000 } },
    { id: 'pikok',     name: 'Bunga Pikok',     category: 'Bunga', image: 'images/pikok.jpg',     desc: 'Bunga kecil putih yang rimbun dan manis.',       prices: { tangkai: 20000, buket: 5000 } },
    { id: 'lily',      name: 'Bunga Lily',      category: 'Bunga', image: 'images/lily.jpg',      desc: 'Putih anggun dengan aroma yang elegan.',         prices: { tangkai: 100000, buket: 90000 } },
    { id: 'daun-talaspi', name: 'Daun Talaspi', category: 'Filler', image: 'images/daun-talaspi.jpg', desc: 'Daun hijau halus untuk memperindah rangkaian.', prices: { buket: 10000 } },
    { id: 'sweet-six', name: 'The Sweet Six',   category: 'Paket', image: 'images/sweet-six.jpg', desc: '6 tangkai mawar merah + bunga filler, dibungkus cantik.', prices: { paket: 100000 } }
];

/* Produk favorit di beranda (paketan). only = jenis pembelian yang ditampilkan. */
const FAVORITES = [
    { id: 'mawar',     only: 'tangkai', title: 'Mawar Per Tangkai', desc: 'Satu tangkai mawar merah, pas buat kejutan kecil.' },
    { id: 'sweet-six', only: 'paket',   title: 'The Sweet Six',     desc: '6 tangkai mawar + bunga filler, dibungkus cantik.' }
];

const TYPE_LABEL = { tangkai: 'Per Tangkai', buket: 'Buket', paket: 'Paket' };

/* Promo 11.11: diskon 11%, hanya berlaku 11 November 2026 (waktu Jakarta) */
const PROMOS = {
    BEHINDTHISMOMENT: { percent: 11, label: 'Diskon 11% (11.11)', date: '2026-11-11', dateLabel: '11 November 2026' }
};
function todayJakarta() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}
function promoActive(code) {
    const p = PROMOS[code];
    return !!p && (!p.date || p.date === todayJakarta());
}
const MAX_QTY = 20;
const CART_KEY = 'aksarafloraCart2';
const PROMO_KEY = 'aksarafloraPromo';
const ORDERS_KEY = 'aksarafloraOrders';

/* ---------- Helper ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const findProduct = id => PRODUCTS.find(p => p.id === id);

function store(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage diblokir: abaikan */ }
}
function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}

/* ---------- Google Analytics 4 ----------
   Aktif hanya kalau GA_ID di config.js diisi (format G-XXXXXXXXXX).
   Tidak mengirim data pribadi (nama, WhatsApp, alamat) ke Google. */
const GA_ID = ((typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.GA_ID) || '').trim();
const GA_LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
const GA_ON = /^G-[A-Z0-9]{6,}$/.test(GA_ID) &&
              (!GA_LOCAL || (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.GA_TRACK_LOCAL === true));

function initAnalytics() {
    if (!GA_ON || document.body.hasAttribute('data-no-track')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
}
function track(name, params) { if (GA_ON && window.gtag && !document.body.hasAttribute('data-no-track')) window.gtag('event', name, params || {}); }
const gaItems = lines => lines.map(l => ({ item_id: l.id, item_name: l.name, price: l.price, quantity: l.qty }));

/* ---------- Keranjang ----------
   Item keranjang = { id, type, qty }. type = tangkai | buket | paket.
   Harga selalu diambil dari PRODUCTS, bukan dari localStorage. */
const lineKey = (id, type) => id + '|' + type;
const lineName = (p, type) => p.category === 'Paket' || p.category === 'Filler' ? p.name : p.name + ' (' + TYPE_LABEL[type] + ')';

function getCart() {
    const raw = load(CART_KEY);
    if (!Array.isArray(raw)) return [];
    return raw.filter(i => {
        const p = i && findProduct(i.id);
        return p && p.prices[i.type] && Number.isInteger(i.qty) && i.qty > 0;
    }).map(i => ({ id: i.id, type: i.type, qty: Math.min(i.qty, MAX_QTY) }));
}
function saveCart(cart) { store(CART_KEY, cart); updateBadge(); }

function addToCart(id, type, qty) {
    const p = findProduct(id);
    qty = parseInt(qty, 10);
    if (!p || !p.prices[type] || !Number.isInteger(qty) || qty < 1) { toast('Pilihan atau jumlah tidak valid'); return; }
    const cart = getCart();
    const row = cart.find(i => i.id === id && i.type === type);
    if (row) {
        if (row.qty + qty > MAX_QTY) { toast('Maksimal ' + MAX_QTY + ' per item'); return; }
        row.qty += qty;
    } else {
        cart.push({ id, type, qty: Math.min(qty, MAX_QTY) });
    }
    saveCart(cart);
    track('add_to_cart', { currency: 'IDR', value: p.prices[type] * qty, items: gaItems([{ id: p.id, name: lineName(p, type), price: p.prices[type], qty }]) });
    toast(lineName(p, type) + ' masuk keranjang 🛒');
}
function changeQty(id, type, delta) {
    const cart = getCart();
    const row = cart.find(i => i.id === id && i.type === type);
    if (!row) return;
    row.qty = Math.min(MAX_QTY, row.qty + delta);
    saveCart(cart.filter(i => i.qty > 0));
}
function removeItem(id, type) {
    const row = getCart().find(i => i.id === id && i.type === type);
    if (row) {
        const p = findProduct(id);
        track('remove_from_cart', { currency: 'IDR', value: p.prices[type] * row.qty, items: gaItems([{ id: p.id, name: lineName(p, type), price: p.prices[type], qty: row.qty }]) });
    }
    saveCart(getCart().filter(i => !(i.id === id && i.type === type)));
}
function clearCart() { store(CART_KEY, null); store(PROMO_KEY, null); updateBadge(); }

function cartLines() {
    return getCart().map(i => {
        const p = findProduct(i.id);
        const price = p.prices[i.type];
        return { id: p.id, type: i.type, name: lineName(p, i.type), price, qty: i.qty, subtotal: price * i.qty, product: p };
    });
}
function calcTotals() {
    const lines = cartLines();
    const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
    const code = load(PROMO_KEY);
    const promo = code && promoActive(code) ? PROMOS[code] : null;
    const discount = promo ? Math.round(subtotal * promo.percent / 100) : 0;
    return { lines, subtotal, discount, total: subtotal - discount, code: promo ? code : '', promo };
}

/* ---------- UI umum ---------- */
function updateBadge() {
    const count = getCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.hidden = count === 0;
    });
}

let toastTimer;
function toast(msg) {
    let el = $('.toast');
    if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function initNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(a => {
        if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
    });
    const toggle = $('.nav-toggle');
    const nav = $('.main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open);
        });
    }
}

/* ---------- Katalog (index & produk) ---------- */
function typeOptions(p, only) {
    return ['tangkai', 'buket', 'paket']
        .filter(t => p.prices[t] && (!only || t === only))
        .map(t => `<option value="${t}">${TYPE_LABEL[t]} - ${rupiah(p.prices[t])}</option>`)
        .join('');
}

function productCard(p, opts) {
    opts = opts || {};
    const only = opts.only || '';
    const key = (opts.prefix || '') + p.id;
    const types = ['tangkai', 'buket', 'paket'].filter(t => p.prices[t] && (!only || t === only));
    const typeField = types.length === 1
        ? `<div class="type-fixed">${TYPE_LABEL[types[0]]} - <strong>${rupiah(p.prices[types[0]])}</strong></div>
           <input type="hidden" id="type-${key}" value="${types[0]}">`
        : `<label for="type-${key}">Jenis pembelian</label>
           <select id="type-${key}">${typeOptions(p, only)}</select>`;
    return `
    <article class="product-card">
        <div class="product-visual">
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy">
            ${opts.badge ? `<span class="badge">${opts.badge}</span>` : ''}
        </div>
        <div class="product-body">
            <h3>${opts.title || p.name}</h3>
            <p class="product-desc">${opts.desc || p.desc}</p>
            ${typeField}
            <div class="buy-row">
                <div class="qty-field">
                    <label for="qty-${key}">Jumlah</label>
                    <input type="number" id="qty-${key}" value="1" min="1" max="${MAX_QTY}" inputmode="numeric">
                </div>
                <button type="button" class="btn btn-primary btn-sm" data-add="${p.id}" data-key="${key}">+ Keranjang</button>
            </div>
        </div>
    </article>`;
}

function categorySection(cat) {
    const list = PRODUCTS.filter(p => p.category === cat.id);
    if (!list.length) return '';
    return `
    <section class="cat-section" id="kategori-${cat.id.toLowerCase()}">
        <div class="cat-head"><h3>${cat.title}</h3><p>${cat.desc}</p></div>
        <div class="products-grid">${list.map(p => productCard(p)).join('')}</div>
    </section>`;
}

function initCatalog() {
    const fav = $('#featured-grid');
    if (fav) {
        fav.innerHTML = FAVORITES.map(f => productCard(findProduct(f.id), { only: f.only, title: f.title, desc: f.desc, badge: '⭐ Favorit', prefix: 'fav-' })).join('');
    }
    const root = $('#product-grid');
    if (root) {
        root.innerHTML = `
            <nav class="cat-nav" aria-label="Kategori">${CATEGORIES.map(c => `<a href="#kategori-${c.id.toLowerCase()}">${c.title}</a>`).join('')}</nav>
            ${CATEGORIES.map(categorySection).join('')}`;
        track('view_item_list', { item_list_name: 'Katalog', items: PRODUCTS.map(p => ({ item_id: p.id, item_name: p.name })) });
    }
    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-add]');
        if (!btn) return;
        const key = btn.dataset.key;
        addToCart(btn.dataset.add, $('#type-' + key).value, $('#qty-' + key).value);
    });
}

/* ---------- Halaman keranjang ---------- */
function summaryHTML(t) {
    return `
        <div class="summary-row"><span>Subtotal</span><span>${rupiah(t.subtotal)}</span></div>
        ${t.discount ? `<div class="summary-row discount"><span>${t.promo.label} (${t.code})</span><span>− ${rupiah(t.discount)}</span></div>` : ''}
        <div class="summary-row total"><span>Total</span><span>${rupiah(t.total)}</span></div>`;
}

function renderCart() {
    const root = $('#cart-root');
    if (!root) return;
    const t = calcTotals();

    if (t.lines.length === 0) {
        root.innerHTML = `
            <div class="panel empty-state">
                <span class="big" aria-hidden="true">🛒</span>
                <h3>Keranjang kamu masih kosong</h3>
                <p>Yuk pilih bunga favoritmu dulu.</p>
                <a href="produk.html" class="btn btn-primary">Lihat Katalog</a>
            </div>`;
        return;
    }

    const items = t.lines.map(l => `
        <div class="cart-item">
            <img class="cart-thumb" src="${l.product.image}" alt="" aria-hidden="true">
            <div class="cart-info">
                <h4>${l.name}</h4>
                <div class="unit">${rupiah(l.price)} / ${l.type === 'paket' ? 'paket' : (l.type === 'buket' ? 'buket' : 'tangkai')}</div>
            </div>
            <div class="cart-side">
                <div class="qty">
                    <button type="button" data-qty="-1" data-id="${l.id}" data-type="${l.type}" aria-label="Kurangi ${l.name}">−</button>
                    <span>${l.qty}</span>
                    <button type="button" data-qty="1" data-id="${l.id}" data-type="${l.type}" aria-label="Tambah ${l.name}">+</button>
                </div>
                <span class="line-total">${rupiah(l.subtotal)}</span>
                <button type="button" class="btn-remove" data-remove="${l.id}" data-type="${l.type}">Hapus</button>
            </div>
        </div>`).join('');

    root.innerHTML = `
        <div class="shop-layout">
            <div class="panel">
                <h3>Pesanan kamu</h3>
                ${items}
            </div>
            <aside class="panel">
                <h3>Ringkasan</h3>
                ${summaryHTML(t)}
                <div class="promo-box">
                    <label for="promo-input">Kode promo</label>
                    <div class="promo-row">
                        <input type="text" id="promo-input" placeholder="Masukkan kode" value="${t.code}" autocomplete="off">
                        <button type="button" class="btn btn-outline btn-sm" id="promo-apply">Pakai</button>
                    </div>
                    <div class="promo-msg ${t.code ? 'ok' : ''}" id="promo-msg">${t.code ? 'Kode promo terpasang ✔' : ''}</div>
                </div>
                <div class="summary-actions">
                    <a href="checkout.html" class="btn btn-primary btn-block">Lanjut ke Checkout</a>
                    <a href="produk.html" class="btn btn-outline btn-block">Tambah Bunga Lain</a>
                </div>
            </aside>
        </div>`;
}

function initCartPage() {
    const root = $('#cart-root');
    if (!root) return;
    renderCart();
    const vt = calcTotals();
    if (vt.lines.length) track('view_cart', { currency: 'IDR', value: vt.subtotal, items: gaItems(vt.lines) });
    root.addEventListener('click', e => {
        const q = e.target.closest('[data-qty]');
        const r = e.target.closest('[data-remove]');
        if (q) { changeQty(q.dataset.id, q.dataset.type, parseInt(q.dataset.qty, 10)); renderCart(); }
        else if (r) { removeItem(r.dataset.remove, r.dataset.type); renderCart(); }
        else if (e.target.id === 'promo-apply') applyPromo();
    });
    root.addEventListener('keydown', e => {
        if (e.target.id === 'promo-input' && e.key === 'Enter') { e.preventDefault(); applyPromo(); }
    });
}

function applyPromo() {
    const code = $('#promo-input').value.trim().toUpperCase();
    if (!code) { store(PROMO_KEY, null); renderCart(); return; }
    if (!PROMOS[code]) {
        const msg = $('#promo-msg');
        msg.textContent = 'Kode promo tidak valid';
        msg.className = 'promo-msg err';
        return;
    }
    if (!promoActive(code)) {
        store(PROMO_KEY, null);
        renderCart();
        const msg = $('#promo-msg');
        if (msg) { msg.textContent = 'Kode ini hanya berlaku pada ' + PROMOS[code].dateLabel; msg.className = 'promo-msg err'; }
        return;
    }
    store(PROMO_KEY, code);
    renderCart();
}

/* ---------- Checkout ---------- */
function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function nowStamp() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return todayISO() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function newOrderId() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `FL-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

async function sendOrder(order) {
    const url = (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.SHEET_URL || '').trim();
    if (!url) {
        // MODE DEMO: simpan lokal saja
        const list = load(ORDERS_KEY) || [];
        list.push(Object.assign({ waktu: nowStamp() }, order));
        store(ORDERS_KEY, list);
        return { demo: true };
    }
    // Body string => Content-Type text/plain, jadi tidak ada preflight CORS ke Apps Script
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(order) });
    if (!res.ok) throw new Error('Server membalas status ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Gagal menyimpan pesanan');
    return { demo: false };
}

function initCheckoutPage() {
    const root = $('#checkout-root');
    if (!root) return;
    const t = calcTotals();

    if (t.lines.length === 0) {
        root.innerHTML = `
            <div class="panel empty-state">
                <span class="big" aria-hidden="true">🛒</span>
                <h3>Belum ada yang di-checkout</h3>
                <p>Keranjang kamu kosong. Pilih bunga dulu ya.</p>
                <a href="produk.html" class="btn btn-primary">Lihat Katalog</a>
            </div>`;
        return;
    }

    const mini = t.lines.map(l =>
        `<div class="mini-item"><span>${l.qty}× ${l.name}</span><span>${rupiah(l.subtotal)}</span></div>`).join('');

    root.innerHTML = `
        <div class="shop-layout">
            <form class="panel" id="checkout-form" novalidate>
                <h3>Data pemesan</h3>
                <div class="form-error" id="form-error" role="alert"></div>
                <div class="form-grid">
                    <div class="field">
                        <label for="nama">Nama pemesan <span class="req">*</span></label>
                        <input type="text" id="nama" name="nama" maxlength="80" autocomplete="name" required>
                    </div>
                    <div class="field">
                        <label for="wa">Nomor WhatsApp <span class="req">*</span></label>
                        <input type="tel" id="wa" name="wa" maxlength="16" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" required>
                        <div class="hint">Dipakai untuk konfirmasi pesanan.</div>
                    </div>
                    <div class="field">
                        <label for="penerima">Nama penerima (opsional)</label>
                        <input type="text" id="penerima" name="penerima" maxlength="80" placeholder="Kosongkan jika sama dengan pemesan">
                    </div>
                    <div class="field">
                        <label for="tanggal">Tanggal pengiriman <span class="req">*</span></label>
                        <input type="date" id="tanggal" name="tanggal" required>
                    </div>
                    <div class="field">
                        <label for="alamat">Alamat pengiriman <span class="req">*</span></label>
                        <textarea id="alamat" name="alamat" maxlength="300" autocomplete="street-address" required></textarea>
                    </div>
                    <div class="field">
                        <label for="kartu">Pesan kartu ucapan (opsional)</label>
                        <textarea id="kartu" name="kartu" maxlength="200" placeholder="Contoh: Selamat ulang tahun, semoga selalu bahagia!"></textarea>
                    </div>
                    <div class="field">
                        <label for="kartu">link (opsional)</label>
                        <textarea id="kartu" name="kartu" maxlength="200" placeholder="Contoh: https://spotify......."></textarea>
                    </div>
                    <div class="field">
                        <label>Metode pembayaran</label>
                        <div class="pay-fixed"><strong>QRIS</strong> (non-tunai). Kode QRIS tampil setelah pesanan dikirim, bisa dibayar lewat e-wallet atau m-banking apa pun.</div>
                    </div>
                    <div class="field">
                        <label for="catatan">Catatan (opsional)</label>
                        <textarea id="catatan" name="catatan" maxlength="200" placeholder="Contoh: titip ke satpam jika tidak ada orang"></textarea>
                    </div>
                </div>
                <div class="summary-actions">
                    <button type="submit" class="btn btn-primary btn-block" id="submit-btn">Pesan &amp; Lanjut Bayar</button>
                    <a href="keranjang.html" class="btn btn-outline btn-block">Kembali ke Keranjang</a>
                </div>
            </form>
            <aside class="panel">
                <h3>Ringkasan pesanan</h3>
                <div class="mini-items">${mini}</div>
                ${summaryHTML(t)}
            </aside>
        </div>`;

    track('begin_checkout', { currency: 'IDR', value: t.total, coupon: t.code || undefined, items: gaItems(t.lines) });

    const form = $('#checkout-form');
    const errBox = $('#form-error');
    const btn = $('#submit-btn');

    const showError = msg => { errBox.textContent = msg; errBox.classList.add('show'); errBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); };

    form.tanggal.min = todayISO();

    form.addEventListener('submit', async e => {
        e.preventDefault();
        errBox.classList.remove('show');

        const nama = form.nama.value.trim();
        const wa = form.wa.value.replace(/[\s-]/g, '');
        const alamat = form.alamat.value.trim();
        const pembayaran = 'QRIS';
        const catatan = form.catatan.value.trim();
        const penerima = form.penerima.value.trim();
        const tanggal = form.tanggal.value;
        const kartu = form.kartu.value.trim();

        if (nama.length < 2) return showError('Nama lengkap wajib diisi.');
        if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(wa)) return showError('Nomor WhatsApp tidak valid. Contoh: 081234567890');
        if (alamat.length < 10) return showError('Alamat pengiriman terlalu singkat, tulis yang lengkap ya.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || tanggal < todayISO()) return showError('Pilih tanggal pengiriman hari ini atau setelahnya.');

        const cur = calcTotals(); // hitung ulang saat submit
        if (cur.lines.length === 0) return showError('Keranjang kosong.');

        const order = {
            orderId: newOrderId(),
            nama, whatsapp: wa, penerima: penerima || nama, tanggalKirim: tanggal, alamat, kartu, catatan, pembayaran,
            items: cur.lines.map(l => ({ id: l.id, jenis: l.type, nama: l.name, harga: l.price, qty: l.qty, subtotal: l.subtotal })),
            subtotal: cur.subtotal, kodePromo: cur.code, diskon: cur.discount, total: cur.total
        };

        btn.disabled = true;
        btn.textContent = 'Mengirim pesanan…';
        try {
            const result = await sendOrder(order);
            clearCart();
            track('purchase', {
                transaction_id: order.orderId, currency: 'IDR', value: order.total,
                coupon: order.kodePromo || undefined, shipping: 0,
                items: order.items.map(i => ({ item_id: i.id, item_name: i.nama, price: i.harga, quantity: i.qty }))
            });
            showSuccess(root, order, result.demo);
        } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Pesan & Lanjut Bayar';
            showError('Pesanan belum terkirim (' + err.message + '). Cek koneksi internet lalu coba lagi. Keranjang kamu masih aman.');
        }
    });
}

/* ---------- WhatsApp & QRIS ---------- */
const WA_NUMBER = (typeof WHATSAPP_NUMBER !== 'undefined' ? String(WHATSAPP_NUMBER) : '').replace(/\D/g, '');
const QRIS_IMAGE = (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.QRIS_IMAGE) || 'images/qris.jpg';

function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + (text ? '?text=' + encodeURIComponent(text) : '');
}

function orderWhatsAppText(order) {
    const lines = order.items.map((i, n) => (n + 1) + '. ' + i.nama + ' x' + i.qty + ' = ' + rupiah(i.subtotal)).join('\n');
    return [
        'Halo Aksara Flora :) ',
        'Saya sudah memesan lewat website dan ingin lanjut ke pembayaran.',
        '',
        'ID Pesanan: ' + order.orderId,
        'Nama: ' + order.nama,
        'Penerima: ' + order.penerima,
        'Tanggal kirim: ' + order.tanggalKirim,
        'Alamat: ' + order.alamat,
        order.kartu ? 'Kartu ucapan: ' + order.kartu : '',
        order.catatan ? 'Catatan: ' + order.catatan : '',
        '',
        'Pesanan:',
        lines,
        order.diskon ? 'Diskon (' + order.kodePromo + '): -' + rupiah(order.diskon) : '',
        'TOTAL: ' + rupiah(order.total),
        '',
        'Pembayaran: QRIS. Bukti pembayaran saya lampirkan di chat ini.'
    ].filter((x, i, a) => x !== '' || (a[i - 1] !== '' && i !== 0)).join('\n');
}

function showSuccess(root, order, demo) {
    const wa = waLink(orderWhatsAppText(order));
    root.innerHTML = `
        <div class="panel success-card">
            <span class="big" aria-hidden="true">🎉</span>
            <h3>Pesanan diterima!</h3>
            <div class="order-id"></div>
            <p>Terima kasih, <strong class="who"></strong>. Bunga dijadwalkan terkirim tanggal <strong class="tgl"></strong>.</p>

            <div class="pay-steps">
                <div class="pay-step">
                    <span class="step-no">1</span>
                    <div>
                        <h4>Bayar lewat QRIS</h4>
                        <p>Scan kode di bawah, lalu masukkan nominal <strong>${rupiah(order.total)}</strong>.</p>
                    </div>
                </div>
                <div class="qris-box">
                    <img src="${QRIS_IMAGE}" alt="QRIS Aksara Flora" class="qris-img"
                         onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'qris-placeholder',textContent:'QRIS Aksara Flora (gambar belum dipasang)'}))">
                    <div class="qris-total">Total bayar <strong>${rupiah(order.total)}</strong></div>
                </div>
                <div class="pay-step">
                    <span class="step-no">2</span>
                    <div>
                        <h4>Kirim pesanan &amp; bukti bayar ke WhatsApp</h4>
                        <p>Detail pesananmu sudah kami siapkan otomatis. Tinggal kirim, lampirkan bukti bayar, dan kamu bisa langsung tanya-tanya soal pesanannya.</p>
                    </div>
                </div>
            </div>

            ${demo ? '<div class="demo-note">Mode demo: Google Sheets belum disambungkan, pesanan hanya tersimpan di browser ini.</div>' : ''}
            <div class="summary-actions">
                <a href="${wa}" target="_blank" rel="noopener" class="btn btn-wa btn-block">💬 Kirim ke WhatsApp Aksara Flora</a>
                <a href="produk.html" class="btn btn-outline btn-block">Pesan Lagi</a>
            </div>
        </div>`;
    $('.order-id', root).textContent = order.orderId;
    $('.who', root).textContent = order.nama;
    $('.tgl', root).textContent = order.tanggalKirim;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initWhatsAppFloat() {
    if (!WA_NUMBER || document.body.hasAttribute('data-no-track')) return;
    const a = document.createElement('a');
    a.className = 'wa-float';
    a.href = waLink('Halo Aksara Flora, saya mau tanya soal bunga :)');
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Chat WhatsApp Aksara Flora');
    a.innerHTML = '<span aria-hidden="true">💬</span> Chat';
    document.body.appendChild(a);
}

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    initNav();
    updateBadge();
    initCatalog();
    initCartPage();
    initCheckoutPage();
    initWhatsAppFloat();
});
