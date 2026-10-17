import React, { useEffect, useMemo, useRef, useState } from 'react';
import { simpanSpmi } from '../apiSpmi';
import { jejak, routeSpmi } from '../spmiModel';

const FILTER = [['semua', 'Semua bagian'], ['berbeda', 'Berbeda'], ['sama', 'Sama'], ['tambahan', 'Tambahan tim'], ['dibuang', 'Dibuang'], ['belum', 'Belum / Ditandai belum ada']];
function Text({ value, empty }) { return <div className="spmi-prose">{value || <span className="spmi-empty">{empty || '—'}</span>}</div>; }

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
    <header><div><small>{row.id}</small><h2 id="spmi-edit-title">Edit rancangan · {row.komponen || row.bagian}</h2></div></header>
    <p>Perubahan disimpan ke kolom Isi Naskah pada sheet Naskah Isian.</p>
    <label>Nama pengubah<input value={nama} maxLength={100} onChange={(e) => setNama(e.target.value)} disabled={busy} placeholder="Nama Anda" /></label>
    <label>Rancangan<textarea ref={area} value={text} maxLength={45000} onChange={(e) => setText(e.target.value)} disabled={busy} rows={15} /></label>
    <div className="spmi-edit-meta">{text.length.toLocaleString('id-ID')} / 45.000 karakter</div>
    {error && <div className="galat" role="alert">{error}</div>}
    {konflik != null && <details><summary>Lihat isi terbaru di spreadsheet</summary><Text value={konflik} /></details>}
    <footer><button className="btn" disabled={busy} onClick={() => { if (!dirty || window.confirm('Batalkan perubahan rancangan yang belum disimpan?')) onBatal(); }}>Batal</button><button className="btn pri" disabled={busy || !dirty || !nama.trim() || konflik != null} onClick={simpan}>{busy ? 'Menyimpan…' : 'Simpan rancangan'}</button></footer>
  </section></div>;
}

export default function SpmiNaskah({ spmi, tree, selected, onPilih, onToast }) {
  const [filter, setFilter] = useState('semua'), [query, setQuery] = useState(''), [page, setPage] = useState(1), [edit, setEdit] = useState(null);
  const [size, setSize] = useState(20);
  const [ringkas, setRingkas] = useState(false);
  const scrollArea = useRef(null), sudahLewat = useRef(false);
  useEffect(() => {
    setRingkas(false); sudahLewat.current = false;
    if (scrollArea.current) scrollArea.current.scrollTop = 0;
  }, [selected]);
  function gulirTabel(e) {
    const lewat = e.currentTarget.scrollTop > 48;
    if (lewat && !sudahLewat.current) setRingkas(true);
    sudahLewat.current = lewat;
  }
  const node = tree.byKey[selected] || tree.root;
  const rows = useMemo(() => { const ids = new Set(node.ids); return ((spmi.data && spmi.data.rows) || []).filter((r) => ids.has(r.id)); }, [node, spmi.data]);
  const counts = useMemo(() => rows.reduce((acc, r) => { const k = jejak(r).key; acc[k] = (acc[k] || 0) + 1; return acc; }, {}), [rows]);
  const filtered = rows.filter((r) => (filter === 'semua' || jejak(r).key === filter) && (!query || [r.id, r.bagian, r.subbagian, r.komponen, r.awal, r.rancangan].join(' ').toLowerCase().includes(query.toLowerCase())));
  useEffect(() => { setPage(1); }, [selected, filter, query, size]);
  const totalPage = Math.max(1, Math.ceil(filtered.length / size)), currentPage = Math.min(page, totalPage);
  const shown = filtered.slice((currentPage - 1) * size, currentPage * size);
  const siblings = Object.values(tree.byKey).filter((n) => n.path.length === node.path.length && n.path.slice(0, -1).join('\u0000') === node.path.slice(0, -1).join('\u0000'));
  const ix = siblings.findIndex((n) => n.key === node.key);
  const bisaEdit = spmi.live && spmi.status === 'siap';
  async function copyLink() { try { await navigator.clipboard.writeText(window.location.href); onToast('Tautan bagian disalin.', 'ok'); } catch (e) { onToast('Salin alamat bagian dari bilah alamat browser.', 'err'); } }
  const sourceLink = spmi.data && spmi.data.spreadsheetId ? 'https://docs.google.com/spreadsheets/d/' + spmi.data.spreadsheetId + '/edit' : null;
  return <div className={'body spmi-reader' + (ringkas ? ' spmi-reader-compact' : '')}>
    {!spmi.live && <div className="spmi-notice">Pratinjau dari file Sistem Portal Mutu LEAP.xlsx. Hubungkan backend SPMI untuk mengedit dan menyimpan ke spreadsheet dummy.</div>}
    {spmi.error && <div className="galat" role="alert">{spmi.error}<button className="btn" onClick={spmi.refresh}>Coba muat ulang</button></div>}
    {spmi.status === 'muat' && <p role="status">Memuat naskah terbaru…</p>}
    {spmi.data && spmi.data.isianTanpaAwal && spmi.data.isianTanpaAwal.length > 0 && <div className="spmi-notice">Ada {spmi.data.isianTanpaAwal.length} ID isian tanpa pasangan Naskah Awal. Tambahkan pasangan pada sumber agar dapat ditampilkan.</div>}
    <section className="spmi-heading" aria-label="Pengaturan pembaca naskah">
      <div className="spmi-crumb">SPMI{node.path.length ? ' / ' + node.path.slice(0, -1).join(' / ') : ' / Naskah SPMI'}</div>
      <div className="spmi-title-row"><h2>{node.label}</h2><button className="btn spmi-heading-toggle" onClick={() => setRingkas((v) => !v)} aria-expanded={!ringkas} aria-controls="spmi-heading-detail">{ringkas ? '⌄ Perluas' : '⌃ Perkecil'}</button><button className="btn" onClick={copyLink}>Salin tautan</button><div className="spmi-prev-next"><button className="btn" disabled={ix <= 0} onClick={() => onPilih(routeSpmi(siblings[ix - 1].key))} aria-label="Bagian sebelumnya">‹</button><button className="btn" disabled={ix < 0 || ix >= siblings.length - 1} onClick={() => onPilih(routeSpmi(siblings[ix + 1].key))} aria-label="Bagian berikutnya">›</button></div></div>
      <div id="spmi-heading-detail" hidden={ringkas}><div className="spmi-heading-grid"><div><small>SUMBER ACUAN</small><p>Naskah Awal</p></div><div><small>RANCANGAN TIM</small><p>Naskah Isian {sourceLink && <a href={sourceLink} target="_blank" rel="noopener noreferrer">Buka spreadsheet ↗</a>}</p></div><div><small>DATA TERAKHIR DIMUAT</small><p>{spmi.data && spmi.data.waktu ? new Date(spmi.data.waktu).toLocaleString('id-ID') : 'File unggahan'}</p></div></div>
      <div className="spmi-tools"><span>Tampilkan</span>{FILTER.map(([id, label]) => <button key={id} className={'spmi-filter' + (filter === id ? ' active' : '')} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label} <b>{id === 'semua' ? rows.length : counts[id] || 0}</b></button>)}</div>
      <div className="spmi-searchbar"><input type="search" placeholder="Cari isi naskah atau ID…" aria-label="Cari isi naskah" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn" disabled={!spmi.live || spmi.status === 'muat' || !!edit} onClick={spmi.refresh}>↻ Muat ulang naskah</button></div>
      </div>
      {ringkas && <div className="spmi-compact-summary">{filtered.length} bagian · {FILTER.find(([id]) => id === filter)[1]}{query ? ' · Pencarian: ' + query : ''}</div>}
      {selected !== 'all' && !tree.byKey[selected] && <p className="spmi-notice">Pilihan bagian lama tidak ditemukan. Menampilkan seluruh naskah; pilih kembali pada menu kiri.</p>}
    </section>
    <div className="spmi-comparison-wrap" ref={scrollArea} onScroll={gulirTabel} tabIndex={0} role="region" aria-label="Tabel perbandingan naskah, gulir untuk membaca"><table className="spmi-comparison"><colgroup><col className="spmi-col-awal" /><col className="spmi-col-jejak" /><col className="spmi-col-draft" /><col className="spmi-col-note" /></colgroup><thead><tr><th scope="col">NASKAH AWAL</th><th scope="col">JEJAK</th><th scope="col">RANCANGAN · ISIAN TIM</th><th scope="col">CATATAN / REVIEW</th></tr></thead><tbody>
      {shown.map((r) => { const trace = jejak(r); return <tr key={r.id}>
        <td><div className="spmi-row-label">{r.komponen || r.bagian}<small>{r.id}</small></div><Text value={r.awal} empty="Tidak ada isi pada naskah awal." /></td>
        <td><span className={'spmi-trace ' + trace.key}>{trace.label}</span><details className="spmi-mapping"><summary>Pemetaan sumber</summary><p>{r.status || '—'}</p></details></td>
        <td><div className="spmi-draft-tools"><span>{r.subbagian || r.bagian}</span><button className="btn spmi-edit-button" disabled={!bisaEdit || !r.adaIsian} title={!spmi.live ? 'Hubungkan backend SPMI untuk mengaktifkan Edit' : !r.adaIsian ? 'Tambahkan baris pasangan Naskah Isian dahulu' : 'Edit isi rancangan'} onClick={() => setEdit({ ...r })}>✎ Edit</button></div><Text value={r.rancangan} empty="Belum ada isi rancangan." /></td>
        <td>{r.catatanIsian ? <Text value={r.catatanIsian} /> : <span className="spmi-empty">Belum ada catatan review.</span>}{r.catatanAwal && r.catatanAwal !== r.catatanIsian && <details><summary>Catatan naskah awal</summary><Text value={r.catatanAwal} /></details>}</td>
      </tr>; })}
      {!shown.length && <tr><td colSpan={4} className="kosong">{spmi.status === 'muat' || !spmi.data ? 'Naskah belum dimuat.' : 'Tidak ada bagian yang sesuai dengan pilihan dan pencarian.'}</td></tr>}
    </tbody></table></div>
    <div className="spmi-pagination"><span>{filtered.length} bagian · Halaman {currentPage} / {totalPage}</span><label>Baris <select value={size} onChange={(e) => setSize(Number(e.target.value))}><option>20</option><option>50</option><option>100</option></select></label><button className="btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><button className="btn" disabled={currentPage >= totalPage} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></div>
    <p className="spmi-reader-note">Jejak membandingkan teks dan penanda pemetaan sumber. Status ini belum merupakan hasil verifikasi kesesuaian aturan. Edit rancangan memperbarui Naskah Isian di spreadsheet.</p>
    {edit && <EditRancangan row={edit} onBatal={() => setEdit(null)} onSimpan={(r) => { spmi.patch(r.id, r.rancangan); setEdit(null); onToast('Rancangan tersimpan pada Naskah Isian.', 'ok'); }} />}
  </div>;
}
