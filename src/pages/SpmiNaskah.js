import React, { useEffect, useMemo, useRef, useState } from 'react';
import { simpanSpmi, simpanReviewSpmi } from '../apiSpmi';
import Text from '../components/SpmiText';
import { STATUS_REVIEW, routeSpmi, judulBagian, tampilDiWeb } from '../spmiModel';

function EditRancangan({ row, onBatal, onSimpan }) {
  const [text, setText] = useState(row.rancangan);
  const [nama, setNama] = useState(() => { try { return localStorage.getItem('leap.spmi.pengubah') || ''; } catch (e) { return ''; } });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [konflik, setKonflik] = useState(null);
  const area = useRef(null), dirty = text !== row.rancangan;
  useEffect(() => { area.current.focus(); }, []);
  useEffect(() => { const stop = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', stop); return () => window.removeEventListener('beforeunload', stop); }, [dirty]);
  async function simpan() {
    if (!nama.trim()) { setError('Isi nama pengubah terlebih dahulu.'); return; }
    setBusy(true); setError('');
    try { const result = await simpanSpmi({ id: row.id, rancangan: text, sebelum: row.rancangan, pengubah: nama.trim() }); try { localStorage.setItem('leap.spmi.pengubah', nama.trim()); } catch (e) {} onSimpan(result); }
    catch (e) { setError(e.message || 'Gagal menyimpan. Draf Anda tetap terbuka.'); if (e.code === 'KONFLIK') setKonflik(e.data && e.data.terbaru); }
    finally { setBusy(false); }
  }
  return <div className="spmi-edit-bg"><section className="spmi-edit" role="dialog" aria-modal="true" aria-labelledby="spmi-edit-title">
    <header><div><small>{row.id}</small><h2 id="spmi-edit-title">Edit rancangan · {judulBagian(row)}</h2></div></header>
    <p>Perubahan disimpan ke kolom Isi Naskah pada sheet Naskah Isian. Gunakan format **tebal**, - untuk bullet, dan 1. untuk daftar bernomor; dua spasi di awal untuk subdaftar.</p>
    <label>Nama pengubah<input value={nama} maxLength={100} onChange={(e) => setNama(e.target.value)} disabled={busy} placeholder="Nama Anda" /></label>
    <label>Rancangan<textarea ref={area} value={text} maxLength={45000} onChange={(e) => setText(e.target.value)} disabled={busy} rows={15} /></label>
    <details className="spmi-edit-preview"><summary>Pratinjau format</summary><Text value={text} /></details>
    <div className="spmi-edit-meta">{text.length.toLocaleString('id-ID')} / 45.000 karakter</div>
    {error && <div className="galat" role="alert">{error}</div>}
    {konflik != null && <details><summary>Lihat isi terbaru di spreadsheet</summary><Text value={konflik} /></details>}
    <footer><button className="btn" disabled={busy} onClick={() => { if (!dirty || window.confirm('Batalkan perubahan rancangan yang belum disimpan?')) onBatal(); }}>Batal</button><button className="btn pri" disabled={busy || !dirty || !nama.trim() || konflik != null} onClick={simpan}>{busy ? 'Menyimpan…' : 'Simpan rancangan'}</button></footer>
  </section></div>;
}

function EditReview({ row, onBatal, onSimpan }) {
  const [catatan, setCatatan] = useState(row.catatanIsian || ''), [status, setStatus] = useState(row.statusReview || '');
  const [nama, setNama] = useState(() => { try { return localStorage.getItem('leap.spmi.pengubah') || ''; } catch (e) { return ''; } });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [konflik, setKonflik] = useState(false);
  const dirty = catatan !== (row.catatanIsian || '') || status !== (row.statusReview || '');
  useEffect(() => { const stop = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', stop); return () => window.removeEventListener('beforeunload', stop); }, [dirty]);
  async function simpan() {
    setBusy(true); setError('');
    try {
      const result = await simpanReviewSpmi({ id: row.id, catatan, statusReview: status, pengubah: nama.trim(), sebelumReview: { catatan: row.catatanIsian || '', status: row.statusReview || '', revision: row.versiReview || 0 } });
      try { localStorage.setItem('leap.spmi.pengubah', nama.trim()); } catch (e) {}
      onSimpan(result);
    } catch (e) { setError(e.message); if (e.code === 'KONFLIK') setKonflik(true); }
    finally { setBusy(false); }
  }
  return <div className="spmi-edit-bg"><section className="spmi-edit" role="dialog" aria-modal="true" aria-labelledby="review-title">
    <header><small>{row.id}</small><h2 id="review-title">Catatan dan status · {judulBagian(row)}</h2></header>
    <label>Nama pengubah<input autoFocus value={nama} maxLength={100} onChange={(e) => setNama(e.target.value)} disabled={busy} /></label>
    <label>Catatan / Review<textarea value={catatan} maxLength={45000} onChange={(e) => setCatatan(e.target.value)} disabled={busy} rows={10} /></label>
    <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>{STATUS_REVIEW.map((v) => <option key={v} value={v}>{v || 'Belum ditinjau'}</option>)}</select></label>
    {error && <div className="galat" role="alert">{error}</div>}
    <footer><button className="btn" disabled={busy} onClick={() => { if (!dirty || window.confirm('Batalkan perubahan catatan/status yang belum disimpan?')) onBatal(); }}>Batal</button><button className="btn pri" disabled={busy || !dirty || nama.trim().length < 2 || konflik} onClick={simpan}>{busy ? 'Menyimpan…' : 'Simpan catatan dan status'}</button></footer>
  </section></div>;
}

export default function SpmiNaskah({ spmi, tree, selected, onPilih, onToast }) {
  const [filter, setFilter] = useState('semua'), [query, setQuery] = useState(''), [page, setPage] = useState(1), [edit, setEdit] = useState(null), [review, setReview] = useState(null);
  const [size, setSize] = useState(20), [ringkas, setRingkas] = useState(false);
  const scrollArea = useRef(null), sudahLewat = useRef(false);
  useEffect(() => { setRingkas(false); sudahLewat.current = false; if (scrollArea.current) scrollArea.current.scrollTop = 0; }, [selected]);
  function gulirTabel(e) { const lewat = e.currentTarget.scrollTop > 48; if (lewat && !sudahLewat.current) setRingkas(true); sudahLewat.current = lewat; }
  const node = tree.byKey[selected] || tree.root;
  const rows = useMemo(() => { const ids = new Set(node.ids); return ((spmi.data && spmi.data.rows) || []).filter((r) => tampilDiWeb(r) && ids.has(r.id)); }, [node, spmi.data]);
  const filtered = rows.filter((r) => (filter === 'semua' || (r.statusReview || '') === filter) && (!query || [r.id, r.bagian, r.subbagian, r.komponen, r.awal, r.rancangan, r.catatanIsian].join(' ').toLowerCase().includes(query.toLowerCase())));
  useEffect(() => { setPage(1); }, [selected, filter, query, size]);
  const totalPage = Math.max(1, Math.ceil(filtered.length / size)), currentPage = Math.min(page, totalPage);
  const shown = filtered.slice((currentPage - 1) * size, currentPage * size);
  const siblings = Object.values(tree.byKey).filter((n) => n.path.length === node.path.length && n.path.slice(0, -1).join('\u0000') === node.path.slice(0, -1).join('\u0000'));
  const ix = siblings.findIndex((n) => n.key === node.key);
  const bisaEdit = spmi.live && spmi.status === 'siap', bisaReview = bisaEdit && spmi.data && spmi.data.reviewEnabled;
  async function copyLink() { try { await navigator.clipboard.writeText(window.location.href); onToast('Tautan bagian disalin.', 'ok'); } catch (e) { onToast('Salin alamat bagian dari bilah alamat browser.', 'err'); } }
  const labelFilter = filter === 'semua' ? 'Semua status' : filter || 'Belum ditinjau';
  return <div className={'body spmi-reader' + (ringkas ? ' spmi-reader-compact' : '')}>
    {!spmi.live && <div className="spmi-notice">Pratinjau naskah. Hubungkan layanan penyimpanan untuk mengedit.</div>}
    {spmi.error && <div className="galat" role="alert">{spmi.error}<button className="btn" onClick={spmi.refresh}>Coba muat ulang</button></div>}
    {spmi.status === 'muat' && <p role="status">Memuat naskah terbaru…</p>}
    {spmi.live && spmi.data && !spmi.data.reviewEnabled && <div className="spmi-notice">Penyimpanan review belum aktif. Perbarui deployment Apps Script sesuai petunjuk paket.</div>}
    <section className="spmi-heading" aria-label="Pengaturan pembaca naskah">
      <div className="spmi-crumb">SPMI{node.path.length ? ' / ' + node.path.slice(0, -1).join(' / ') : ' / Naskah SPMI'}</div>
      <div className="spmi-title-row"><h2>{node.label}</h2><button className="btn spmi-heading-toggle" onClick={() => setRingkas((v) => !v)} aria-expanded={!ringkas} aria-controls="spmi-heading-detail">{ringkas ? '⌄ Perluas' : '⌃ Perkecil'}</button><button className="btn" onClick={copyLink}>Salin tautan</button><div className="spmi-prev-next"><button className="btn" disabled={ix <= 0} onClick={() => onPilih(routeSpmi(siblings[ix - 1].key))} aria-label="Bagian sebelumnya">‹</button><button className="btn" disabled={ix < 0 || ix >= siblings.length - 1} onClick={() => onPilih(routeSpmi(siblings[ix + 1].key))} aria-label="Bagian berikutnya">›</button></div></div>
      <div className="spmi-loaded"><span><small>DATA TERAKHIR DIMUAT</small><time>{spmi.data && spmi.data.waktu ? new Date(spmi.data.waktu).toLocaleString('id-ID') : 'Belum dimuat'}</time></span><button className="btn" disabled={!spmi.live || spmi.status === 'muat' || !!edit || !!review} onClick={spmi.refresh}>↻ Muat ulang naskah</button></div>
      <div id="spmi-heading-detail" hidden={ringkas}>
        <div className="spmi-tools"><span>Status</span>{['semua', ...STATUS_REVIEW].map((v) => <button key={v} className={'spmi-filter' + (filter === v ? ' active' : '')} onClick={() => setFilter(v)} aria-pressed={filter === v}>{v === 'semua' ? 'Semua status' : v || 'Belum ditinjau'}</button>)}</div>
        <div className="spmi-searchbar"><input type="search" placeholder="Cari naskah, catatan atau ID…" aria-label="Cari isi naskah" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </div>
      {ringkas && <div className="spmi-compact-summary">{labelFilter}{query ? ' · Pencarian: ' + query : ''}</div>}
      {selected !== 'all' && !tree.byKey[selected] && <p className="spmi-notice">Pilihan bagian lama tidak tampil. Pilih kembali pada menu kiri.</p>}
    </section>
    <div className="spmi-comparison-wrap" ref={scrollArea} onScroll={gulirTabel} tabIndex={0} role="region" aria-label="Tabel perbandingan naskah, gulir untuk membaca"><table className="spmi-comparison"><colgroup><col className="spmi-col-awal" /><col className="spmi-col-draft" /><col className="spmi-col-note" /><col className="spmi-col-status" /></colgroup><thead><tr><th scope="col">NASKAH AWAL</th><th scope="col">RANCANGAN ISIAN TIM</th><th scope="col">CATATAN / REVIEW</th><th scope="col">STATUS</th></tr></thead><tbody>
      {shown.map((r) => <tr key={r.id}>
        <td><div className="spmi-row-label">{judulBagian(r)}<small>{r.id}</small></div><Text value={r.awal} empty="Tidak ada uraian terpisah pada ORI untuk bagian ini." /></td>
        <td><div className="spmi-draft-tools"><span>{judulBagian(r)}</span><button className="btn spmi-edit-button" disabled={!bisaEdit || !r.adaIsian} onClick={() => setEdit({ ...r })}>✎ Edit</button></div><Text value={r.rancangan} empty={r.komponen === 'Prosedur' && rows.some((x) => x.subbagian === r.subbagian && /^Prosedur \/ Tahap/.test(x.komponen)) ? 'Rincian prosedur berada pada tahap-tahap di bawah.' : 'Belum ada isi rancangan.'} /></td>
        <td><div className="spmi-review-tools"><button className="btn spmi-edit-button" disabled={!bisaReview || !r.adaIsian} onClick={() => setReview({ ...r })}>✎ Edit catatan</button></div><Text value={r.catatanIsian} empty="Belum ada catatan review." />{r.catatanAwal && r.catatanAwal !== r.catatanIsian && <details><summary>Catatan acuan</summary><Text value={r.catatanAwal} /></details>}</td>
        <td><span className={'spmi-review-status status-' + STATUS_REVIEW.indexOf(r.statusReview || '')}>{r.statusReview || 'Belum ditinjau'}</span><button className="btn spmi-status-button" disabled={!bisaReview || !r.adaIsian} onClick={() => setReview({ ...r })}>Ubah status</button>{r.waktuReview && <small className="spmi-review-time">{new Date(r.waktuReview).toLocaleString('id-ID')}</small>}</td>
      </tr>)}
      {!shown.length && <tr><td colSpan={4} className="kosong">{spmi.status === 'muat' || !spmi.data ? 'Naskah belum dimuat.' : 'Tidak ada bagian sesuai status atau pencarian.'}</td></tr>}
    </tbody></table></div>
    <div className="spmi-pagination"><span>{filtered.length} bagian · Halaman {currentPage} / {totalPage}</span><label>Baris <select value={size} onChange={(e) => setSize(Number(e.target.value))}><option>20</option><option>50</option><option>100</option></select></label><button className="btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><button className="btn" disabled={currentPage >= totalPage} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></div>
    {edit && <EditRancangan row={edit} onBatal={() => setEdit(null)} onSimpan={(r) => { spmi.patchRow(r); setEdit(null); onToast('Rancangan tersimpan.', 'ok'); }} />}
    {review && <EditReview row={review} onBatal={() => setReview(null)} onSimpan={(r) => { spmi.patchRow(r); setReview(null); onToast('Catatan dan status tersimpan.', 'ok'); }} />}
  </div>;
}
