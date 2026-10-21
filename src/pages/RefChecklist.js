import React, { useMemo, useState } from 'react';
import { api } from '../api';

// Halaman daftar referensi dengan detail + link dokumen.
// Dipakai untuk Syarat & Keputusan (ref_syarat) dan Akreditasi (ref_akre).
// Pemetaan kolom (dari data Sheet): 1=No, 2=Item/Syarat, 3=Referensi, 4=Kode,
// 5=Status, 6=Pemeriksaan, 7=Link dokumen, 8=Catatan.
const K = { no: 1, item: 2, ref: 3, kode: 4, status: 5, periksa: 6, dok: 7, catatan: 8 };
const val = (b, k) => String((b.c && b.c[k]) || '').trim();
const linkUrl = (s) => { const m = String(s || '').match(/https?:\/\/[^\s)]+/); return m ? m[0] : ''; };
const STATUS_OPSI = ['Belum mulai', 'Dalam proses', 'Lengkap / Memenuhi', 'Tidak memenuhi', 'Tidak berlaku'];

function clsStatus(s) {
  const t = (s || '').toLowerCase();
  if (/acc|lengkap|selesai|terpenuhi|memenuhi|sesuai/.test(t)) return 'rs-ok';
  if (/proses|berjalan|sebagian/.test(t)) return 'rs-pr';
  if (/belum|menunggu|tidak/.test(t)) return 'rs-no';
  return 'rs-m';
}

export default function RefChecklist({ data, moduleId, title, sub, itemHeader, me, onPatch, onToast }) {
  const [aktif, setAktif] = useState(null);
  const [cari, setCari] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [linkVal, setLinkVal] = useState('');
  const [busy, setBusy] = useState('');
  const rows = useMemo(() => (data && data.data && data.data[moduleId] && data.data[moduleId].baris) || [], [data, moduleId]);
  const pengguna = (me && me.nama) || 'Portal';

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((b) => [K.item, K.kode, K.ref, K.status].map((k) => val(b, k)).join(' ').toLowerCase().includes(q));
  }, [rows, cari]);

  const sel = aktif ? rows.find((b) => b.id === aktif) : null;
  function buka(id) { setAktif(id); setStatusOpen(false); setLinkVal(''); setBusy(''); }

  async function simpan(kolom, nilai, label) {
    if (!sel) return;
    setBusy(label); setStatusOpen(false);
    try {
      await api.simpanRef({ modulId: moduleId, id: sel.id, kolom: kolom, nilai: nilai, pengguna: pengguna });
      if (onPatch) onPatch(moduleId, sel.id, kolom, nilai);
      if (onToast) onToast(label === 'status' ? 'Status tersimpan.' : 'Link dokumen tersimpan.', 'ok');
      if (label === 'link') setLinkVal('');
    } catch (e) {
      if (onToast) onToast(e.message || 'Gagal menyimpan.', 'err');
    } finally { setBusy(''); }
  }

  return (
    <div className="body ref-page">
      <div className="ref-main">
        <div className="ref-head"><h2>{title}</h2><p>{sub}</p></div>
        <div className="ref-tools">
          <input className="ref-search" type="search" placeholder="Cari butir, kode, atau status…" value={cari} onChange={(e) => setCari(e.target.value)} />
          <span className="ref-count">{tampil.length} butir</span>
        </div>

        {rows.length === 0 ? (
          <div className="panel"><div className="ref-empty">Data belum dimuat. Coba muat ulang portal.</div></div>
        ) : (
          <div className="panel ref-listpanel">
            <div className="ref-scroll">
              <table className="ref-table">
                <colgroup><col style={{ width: '8%' }} /><col /><col style={{ width: '15%' }} /><col style={{ width: '22%' }} /></colgroup>
                <thead><tr><th>No</th><th>{itemHeader || 'Syarat / Dokumen'}</th><th>Dokumen</th><th>Status</th></tr></thead>
                <tbody>
                  {tampil.map((b) => {
                    const url = linkUrl(val(b, K.dok));
                    return (
                      <tr key={b.id} className={aktif === b.id ? 'act' : ''} onClick={() => buka(b.id)} tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') buka(b.id); }}>
                        <td>{val(b, K.no) || '–'}</td>
                        <td><span className="ref-judul">{val(b, K.item)}</span>{val(b, K.kode) && <span className="ref-kode sm">{val(b, K.kode)}</span>}</td>
                        <td>{url ? <span className="ref-lk">ada berkas</span> : <span className="ref-lk none">belum ada</span>}</td>
                        <td><span className={'ref-stat ' + clsStatus(val(b, K.status))}>{val(b, K.status) || 'Belum diisi'}</span></td>
                      </tr>
                    );
                  })}
                  {!tampil.length && <tr><td colSpan={4} className="ref-empty">Tidak ada butir cocok dengan pencarian.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {sel && (
        <>
          <div className="ref-ov" onClick={() => setAktif(null)} />
          <aside className="ref-drawer" role="dialog" aria-label="Detail butir">
            <div className="ref-dh">
              <h3>{val(sel, K.item)}</h3>
              <span className={'ref-stat ' + clsStatus(val(sel, K.status))}>{val(sel, K.status) || 'Belum diisi'}</span>
              <button className="ref-x" onClick={() => setAktif(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="ref-db">
              <div className="ref-kv"><span className="k">Kode</span><span className="v">{val(sel, K.kode) || '—'}</span></div>
              <div className="ref-kv"><span className="k">Referensi</span><span className="v">{val(sel, K.ref) || '—'}</span></div>
              <div className="ref-kv"><span className="k">Pemeriksaan</span><span className="v">{val(sel, K.periksa) || '—'}</span></div>

              {/* Ubah status */}
              <div className="ref-statusrow">
                <span className="k">Status</span>
                <span className={'ref-stat ' + clsStatus(val(sel, K.status))}>{val(sel, K.status) || 'Belum diisi'}</span>
                <div className="ref-ddwrap">
                  <button className="ref-btn" disabled={!!busy} onClick={() => setStatusOpen((v) => !v)}>✎ {busy === 'status' ? 'Menyimpan…' : 'Ubah status ⌄'}</button>
                  {statusOpen && (
                    <div className="ref-dd">
                      {STATUS_OPSI.map((s) => (
                        <div key={s} className={'ref-dd-i' + (val(sel, K.status) === s ? ' on' : '')} onClick={() => simpan(K.status, s, 'status')}>{s}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <h4>Dokumen pendukung</h4>
              {linkUrl(val(sel, K.dok))
                ? <div className="ref-doc"><span className="fi">📄</span><div className="nm">{val(sel, K.dok)}</div><a className="go" href={linkUrl(val(sel, K.dok))} target="_blank" rel="noreferrer">Buka ↗</a></div>
                : <div className="ref-doc miss"><span className="fi">📄</span><div className="nm">Belum ada dokumen tertaut</div></div>}
              <div className="ref-addbox">
                <div className="ref-addlbl">＋ Tambah / ganti link dokumen</div>
                <div className="ref-addrow">
                  <input className="ref-addinp" type="url" placeholder="Tempel link Google Drive / URL…" value={linkVal} onChange={(e) => setLinkVal(e.target.value)} disabled={!!busy} />
                  <button className="ref-btn pri" disabled={!!busy || !linkVal.trim()} onClick={() => simpan(K.dok, linkVal.trim(), 'link')}>{busy === 'link' ? 'Menyimpan…' : 'Simpan'}</button>
                </div>
              </div>

              {val(sel, K.catatan) && (<><h4>Catatan</h4><p>{val(sel, K.catatan)}</p></>)}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
