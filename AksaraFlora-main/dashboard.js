/* ==========================================================
   Aksara Flora - Dashboard penjualan
   - Mode Sheets : data diambil dari Google Apps Script (butuh kunci dashboard)
   - Mode demo   : SHEET_URL kosong -> data dari pesanan yang tersimpan di browser ini
   Data dari Sheets TIDAK berisi nama, WhatsApp, atau alamat pelanggan.
   ========================================================== */
(function () {
    const root = document.getElementById('dash-root');
    if (!root) return;

    const KEY_STORE = 'aksaraFloraDashKey';
    const url = ((typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.SHEET_URL) || '').trim();
    const nf = n => Number(n || 0).toLocaleString('id-ID');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));   // data Sheets tidak dipercaya
    const DAYS = 14;

    function pad(n) { return String(n).padStart(2, '0'); }
    function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

    /* ---------- hitung statistik ---------- */
    function buildStats(orders) {
        const today = isoDate(new Date());
        const st = { orders: orders.length, revenue: 0, discount: 0, items: 0, upcoming: 0, days: [], products: {}, payments: {} };
        const perDay = {};
        orders.forEach(o => {
            const total = Number(o.total) || 0;
            st.revenue += total;
            st.discount += Number(o.diskon) || 0;
            if (String(o.tanggalKirim || '') >= today) st.upcoming++;
            const day = String(o.waktu || '').slice(0, 10);
            perDay[day] = perDay[day] || { revenue: 0, orders: 0 };
            perDay[day].revenue += total; perDay[day].orders++;
            const pay = o.pembayaran || '-';
            st.payments[pay] = st.payments[pay] || { orders: 0, revenue: 0 };
            st.payments[pay].orders++; st.payments[pay].revenue += total;
            (o.items || []).forEach(i => {
                const q = Number(i.qty) || 0;
                st.items += q;
                const p = st.products[i.nama] = st.products[i.nama] || { qty: 0, revenue: 0 };
                p.qty += q; p.revenue += Number(i.subtotal) || 0;
            });
        });
        for (let k = DAYS - 1; k >= 0; k--) {
            const d = new Date(); d.setDate(d.getDate() - k);
            const key = isoDate(d);
            st.days.push({ key, label: pad(d.getDate()) + '/' + pad(d.getMonth() + 1), ...(perDay[key] || { revenue: 0, orders: 0 }) });
        }
        st.avg = st.orders ? Math.round(st.revenue / st.orders) : 0;
        return st;
    }

    /* ---------- tampilan ---------- */
    function chartSVG(days) {
        const W = 700, H = 220, padL = 8, padB = 28, padT = 14;
        const max = Math.max(1, ...days.map(d => d.revenue));
        const bw = (W - padL * 2) / days.length;
        const bars = days.map((d, i) => {
            const h = Math.round((H - padB - padT) * d.revenue / max);
            const x = padL + i * bw + bw * 0.18, y = H - padB - h;
            return `<rect class="bar" x="${x.toFixed(1)}" y="${y}" width="${(bw * 0.64).toFixed(1)}" height="${h}" rx="4"><title>${esc(d.label)}: ${esc(rupiah(d.revenue))} (${d.orders} pesanan)</title></rect>` +
                   (i % 2 === 0 ? `<text class="axis" x="${(x + bw * 0.32).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>` : '');
        }).join('');
        return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Omzet ${DAYS} hari terakhir">${bars}</svg></div>`;
    }

    function render(orders, note) {
        const st = buildStats(orders);
        const prod = Object.entries(st.products).sort((a, b) => b[1].qty - a[1].qty);
        const maxQty = Math.max(1, ...prod.map(p => p[1].qty));
        const pays = Object.entries(st.payments).sort((a, b) => b[1].orders - a[1].orders);
        const recent = orders.slice(-10).reverse();

        root.innerHTML = `
            ${note ? `<div class="demo-note">${esc(note)}</div>` : ''}
            <div class="dash-bar">
                <span class="hint">Diperbarui ${esc(new Date().toLocaleTimeString('id-ID'))}</span>
                <div><button type="button" class="btn btn-outline btn-sm" id="dash-refresh">↻ Segarkan</button>
                ${url ? '<button type="button" class="btn btn-outline btn-sm" id="dash-logout">Keluar</button>' : ''}</div>
            </div>
            <div class="stat-grid">
                <div class="stat"><span class="stat-label">Jumlah pesanan</span><span class="stat-value">${nf(st.orders)}</span></div>
                <div class="stat"><span class="stat-label">Total omzet</span><span class="stat-value">${esc(rupiah(st.revenue))}</span></div>
                <div class="stat"><span class="stat-label">Rata-rata per pesanan</span><span class="stat-value">${esc(rupiah(st.avg))}</span></div>
                <div class="stat"><span class="stat-label">Pengiriman mendatang</span><span class="stat-value">${nf(st.upcoming)}</span></div>
            </div>
            <div class="panel" style="margin-bottom:24px"><h3>Omzet ${DAYS} hari terakhir</h3>${chartSVG(st.days)}</div>
            <div class="dash-cols">
                <div class="panel"><h3>Produk terlaris</h3>
                    ${prod.length ? prod.map(([n, p]) => `
                        <div class="hbar"><div class="hbar-top"><span>${esc(n)}</span><strong>${nf(p.qty)} terjual</strong></div>
                        <div class="hbar-track"><div class="hbar-fill" style="width:${Math.round(p.qty / maxQty * 100)}%"></div></div>
                        <div class="hint">${esc(rupiah(p.revenue))}</div></div>`).join('') : '<p class="hint">Belum ada data.</p>'}
                </div>
                <div class="panel"><h3>Metode pembayaran</h3>
                    ${pays.length ? pays.map(([n, p]) => `
                        <div class="summary-row"><span>${esc(n)} <small>(${nf(p.orders)} pesanan)</small></span><strong>${esc(rupiah(p.revenue))}</strong></div>`).join('') : '<p class="hint">Belum ada data.</p>'}
                    <div class="summary-row discount" style="margin-top:10px"><span>Total diskon diberikan</span><span>${esc(rupiah(st.discount))}</span></div>
                </div>
            </div>
            <div class="panel" style="margin-top:24px"><h3>Pesanan terbaru</h3>
                ${recent.length ? `<div class="table-wrap"><table class="dash-table"><thead><tr>
                    <th>ID</th><th>Waktu</th><th>Kirim</th><th>Item</th><th>Bayar</th><th>Total</th></tr></thead><tbody>
                    ${recent.map(o => `<tr><td>${esc(o.orderId)}</td><td>${esc(o.waktu)}</td><td>${esc(o.tanggalKirim)}</td>
                        <td>${esc((o.items || []).map(i => i.qty + '× ' + i.nama).join('; '))}</td><td>${esc(o.pembayaran)}</td>
                        <td><strong>${esc(rupiah(o.total))}</strong></td></tr>`).join('')}
                    </tbody></table></div>` : '<p class="hint">Belum ada pesanan.</p>'}
            </div>`;
        $('#dash-refresh').addEventListener('click', load);
        const lo = $('#dash-logout');
        if (lo) lo.addEventListener('click', () => { try { sessionStorage.removeItem(KEY_STORE); } catch (e) {} showLogin(); });
    }

    function showLogin(msg) {
        root.innerHTML = `
            <form class="panel login-box" id="dash-login">
                <h3>Masuk Dashboard</h3>
                <div class="form-error ${msg ? 'show' : ''}" role="alert">${esc(msg || '')}</div>
                <div class="field"><label for="dash-key">Kunci dashboard</label>
                    <input type="password" id="dash-key" autocomplete="current-password" required>
                    <div class="hint">Kunci diatur di Google Apps Script (lihat README).</div></div>
                <div class="summary-actions"><button class="btn btn-primary btn-block" type="submit">Buka Dashboard</button></div>
            </form>`;
        $('#dash-login').addEventListener('submit', e => {
            e.preventDefault();
            try { sessionStorage.setItem(KEY_STORE, $('#dash-key').value); } catch (err) {}
            load($('#dash-key').value);
        });
    }

    async function load(keyArg) {
        if (!url) {   // mode demo
            const local = (JSON.parse(localStorage.getItem(ORDERS_KEY) || 'null')) || [];
            return render(local, 'Mode demo: SHEET_URL belum diisi, data diambil dari pesanan yang dibuat di browser ini.');
        }
        let key = typeof keyArg === 'string' ? keyArg : '';
        if (!key) { try { key = sessionStorage.getItem(KEY_STORE) || ''; } catch (e) {} }
        if (!key) return showLogin();
        root.innerHTML = '<div class="panel empty-state"><p>Memuat data…</p></div>';
        try {
            const res = await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'stats', key }) });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'Gagal memuat data');
            render(Array.isArray(data.orders) ? data.orders : []);
        } catch (err) {
            try { sessionStorage.removeItem(KEY_STORE); } catch (e) {}
            showLogin(err.message);
        }
    }

    document.addEventListener('DOMContentLoaded', () => load());
})();
