import React, { useMemo, useState } from 'react';

// Dasar Hukum & Peraturan — membaca modul referensi "ref_regulasi" dari backend (Sheet 1A).
// Pemetaan kolom (dari data Sheet): 1=Kode, 2=Judul regulasi, 3=Penetapan/berlaku,
// 4=Cakupan/pasal, 5=Relevansi untuk LEAP (kesimpulan), 6=Sumber, 7=Catatan/tindak lanjut,
// 8=Status verifikasi.
const K = { kode: 1, judul: 2, tetap: 3, cakupan: 4, relevansi: 5, sumber: 6, catatan: 7, verif: 8 };
const val = (b, k) => String((b.c && b.c[k]) || '').trim();
const linkUrl = (s) => { const m = String(s || '').match(/https?:\/\/[^\s)]+/); return m ? m[0] : ''; };

export default function DasarHukum({ data, onPilih }) {
  const [aktif, setAktif] = useState(null);
  const [cari, setCari] = useState('');
  const rows = useMemo(() => (data && data.data && data.data.ref_regulasi && data.data.ref_regulasi.baris) || [], [data]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((b) => [K.kode, K.judul, K.relevansi, K.cakupan].map((k) => val(b, k)).join(' ').toLowerCase().includes(q));
  }, [rows, cari]);

  const sel = aktif ? rows.find((b) => b.id === aktif) : null;

  return (
    <div className="body ref-page">
      <div className="ref-main">
        <div className="ref-head">
          <h2>Dasar Hukum &amp; Peraturan</h2>
          <p>Rekap acuan untuk pengambilan keputusan — tanpa harus membuka dokumen satu per satu.</p>
        </div>
        <div className="ref-tools">
          <input className="ref-search" type="search" placeholder="Cari peraturan, pasal, atau kata kunci…" value={cari} onChange={(e) => setCari(e.target.value)} />
          <span className="ref-count">{tampil.length} peraturan</span>
        </div>

        {rows.length === 0 ? (
          <div className="panel"><div className="ref-empty">Data regulasi belum dimuat. Coba muat ulang portal.</div></div>
        ) : (
          <div className="panel ref-listpanel">
            <table className="ref-table">
              <colgroup><col style={{ width: '13%' }} /><col /><col style={{ width: '34%' }} /></colgroup>
              <thead><tr><th>Kode</th><th>Peraturan</th><th>Kesimpulan / relevansi untuk LEAP</th></tr></thead>
              <tbody>
                {tampil.map((b) => (
                  <tr key={b.id} className={aktif === b.id ? 'act' : ''} onClick={() => setAktif(b.id)} tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setAktif(b.id); }}>
                    <td><span className="ref-kode">{val(b, K.kode)}</span></td>
                    <td><span className="ref-judul">{val(b, K.judul)}</span></td>
                    <td><span className="ref-ringkas">{val(b, K.relevansi) || '—'}</span><span className="ref-more">Baca detail →</span></td>
                  </tr>
                ))}
                {!tampil.length && <tr><td colSpan={3} className="ref-empty">Tidak ada peraturan cocok dengan pencarian.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && (
        <>
          <div className="ref-ov" onClick={() => setAktif(null)} />
          <aside className="ref-drawer" role="dialog" aria-label="Detail peraturan">
            <div className="ref-dh">
              <h3>{val(sel, K.judul)}</h3>
              <button className="ref-x" onClick={() => setAktif(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="ref-db">
              <span className="ref-kode big">{val(sel, K.kode)}</span>
              {val(sel, K.relevansi) && (<><h4>Kesimpulan — relevansi untuk LEAP</h4><p>{val(sel, K.relevansi)}</p></>)}
              {val(sel, K.tetap) && (<><h4>Penetapan &amp; keberlakuan</h4><p>{val(sel, K.tetap)}</p></>)}
              {val(sel, K.cakupan) && (<><h4>Cakupan / pasal penting</h4><p>{val(sel, K.cakupan)}</p></>)}
              {val(sel, K.catatan) && (<><h4>Catatan / tindak lanjut</h4><p>{val(sel, K.catatan)}</p></>)}
              <h4>Sumber &amp; status</h4>
              <p className="ref-src">
                {linkUrl(val(sel, K.sumber))
                  ? <a href={linkUrl(val(sel, K.sumber))} target="_blank" rel="noreferrer">{val(sel, K.sumber)} ↗</a>
                  : (val(sel, K.sumber) || '—')}
              </p>
              {val(sel, K.verif) && <p className="ref-verif">{val(sel, K.verif)}</p>}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
