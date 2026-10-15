import React, { useMemo, useState } from 'react';
import { api } from '../api';
import { tglTampil, warnaBadge, norm, jenisTautan, pastikanUrl } from '../utils/format';
import TambahModal from '../components/TambahModal';

export default function ModulTabel({ modul, moddata, opsi, me, appCfg, bolehEdit, onPatch, onTambah, onHapus, onToast }) {
  const kolomTabel = (modul.kolom || []).filter((k) => k.tabel);
  const kolomFilter = kolomTabel.filter((k) => k.tipe === 'select');
  const [filter, setFilter] = useState({});
  const [cari, setCari] = useState('');
  const [simpan, setSimpan] = useState({});
  const [tambah, setTambah] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [draftSibuk, setDraftSibuk] = useState(false);
  const baris = useMemo(() => (moddata && moddata.baris) || [], [moddata]);

  const bisaEditEfektif = bolehEdit && !modul.bacaSaja && (!modul.terkunci || lockOpen);

  // offset sticky-left untuk `sticky` kolom pertama
  const stickyN = Math.min(modul.sticky || 0, kolomTabel.length);
  const stickyLeft = useMemo(() => {
    const out = {}; let acc = 0;
    for (let i = 0; i < stickyN; i++) { out[i] = acc; acc += (kolomTabel[i].lebar || 120); }
    return out;
  }, [stickyN, kolomTabel]);

  const terlihat = useMemo(() => {
    const q = norm(cari);
    return baris.filter((b) => {
      for (const k of kolomFilter) { if (filter[k.k] && String(b.c[k.k] || '') !== filter[k.k]) return false; }
      if (q) { if (kolomTabel.map((k) => norm(b.c[k.k])).join(' ').indexOf(q) < 0) return false; }
      return true;
    });
  }, [baris, filter, cari, kolomFilter, kolomTabel]);

  async function simpanSel(b, kol, nilai) {
    const key = b.id + ':' + kol.k; const lama = b.c[kol.k];
    onPatch(modul.id, b.id, kol.k, nilai);
    setSimpan((s) => ({ ...s, [key]: 'simpan' }));
    try {
      const r = await api.update({ modulId: modul.id, id: b.id, row: b.row, kolom: kol.k, nilai, pengguna: me.nama });
      if (r && r.ok) {
        onPatch(modul.id, b.id, kol.k, r.data.nilai);
        setSimpan((s) => ({ ...s, [key]: 'ok' }));
        setTimeout(() => setSimpan((s) => { const n = { ...s }; delete n[key]; return n; }), 1500);
      } else { onPatch(modul.id, b.id, kol.k, lama); setSimpan((s) => ({ ...s, [key]: 'err' })); onToast((r && r.message) || 'Gagal menyimpan.', 'err'); }
    } catch (e) { onPatch(modul.id, b.id, kol.k, lama); setSimpan((s) => ({ ...s, [key]: 'err' })); onToast(e.message, 'err'); }
  }

  async function hapusBaris(b) {
    if (!window.confirm('Arsipkan baris ' + b.id + '? Disembunyikan dari web; data di spreadsheet tetap ada.')) return;
    try { const r = await api.archive({ modulId: modul.id, id: b.id, pengguna: me.nama });
      if (r && r.ok) { onHapus(modul.id, b.id); onToast('Baris diarsipkan.', 'ok'); } else onToast((r && r.message) || 'Gagal.', 'err');
    } catch (e) { onToast(e.message, 'err'); }
  }

  async function perbaruiDraft() {
    setDraftSibuk(true);
    try {
      const r = await api.perbaruiDraft({ pengguna: me.nama });
      if (r && r.ok) { onToast('Draft lampiran diperbarui (' + r.data.jumlahPos + ' POS).', 'ok'); if (r.data.url) window.open(r.data.url, '_blank', 'noopener'); }
      else onToast((r && r.message) || 'Gagal memperbarui draft.', 'err');
    } catch (e) { onToast(e.message, 'err'); }
    setDraftSibuk(false);
  }

  return (
    <div className="body">
      {modul.id === 'naskah' && (
        <div className="bar bar-info">📝 Di sini Anda <b>memperbaiki isi tulisan naskah</b> (bab per bab): temuan & revisi yang diperlukan.
          Untuk menata <b>formulir/POS</b> (lampiran), buka menu <b>Registri Form &amp; POS</b>.</div>
      )}
      {!bolehEdit && !modul.bacaSaja && (
        <div className="bar bar-info">👁️ Divisi Anda hanya dapat <b>melihat</b> modul ini. Hubungi Super Admin untuk hak edit.</div>
      )}
      {modul.terkunci && !lockOpen && bisaEditEfektif === false && bolehEdit && !modul.bacaSaja && (
        <div className="bar bar-lock">
          🔒 Modul ini <b>terkunci</b> karena prasyarat belum cukup ({(modul.alasanKunci || []).join(', ')}).
          <button className="btn" style={{ marginLeft: 10 }} onClick={() => setLockOpen(true)}>Tetap isi {me.peran === 'SA' ? '(buka kunci)' : ''}</button>
        </div>
      )}

      <div className="toolbar">
        {kolomFilter.map((k) => (
          <select key={k.k} className="self" value={filter[k.k] || ''} onChange={(e) => setFilter({ ...filter, [k.k]: e.target.value })}>
            <option value="">{k.label}: Semua</option>
            {(opsi[k.opsi] || []).map((o, i) => <option key={i} value={o.nilai}>{o.nilai}</option>)}
          </select>
        ))}
        <input className="searchf" placeholder="Cari…" value={cari} onChange={(e) => setCari(e.target.value)} />
        {(Object.keys(filter).some((k) => filter[k]) || cari) && <button className="btn" onClick={() => { setFilter({}); setCari(''); }}>Reset</button>}
        <span className="cnt">menampilkan {terlihat.length} dari {baris.length}</span>
        {modul.id === 'form' && bolehEdit && (
          <>
            <button className="btn pri" disabled={draftSibuk} onClick={perbaruiDraft}>{draftSibuk ? 'Memperbarui…' : '📄 Perbarui Draft Naskah'}</button>
            {appCfg && appCfg.draftDocUrl && <a className="btn" href={appCfg.draftDocUrl} target="_blank" rel="noopener noreferrer">Buka draft</a>}
          </>
        )}
        {modul.bisaTambah && bisaEditEfektif && <button className="btn pri" onClick={() => setTambah(true)}>+ Tambah</button>}
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              {kolomTabel.map((k, ci) => {
                const st = ci < stickyN ? { position: 'sticky', left: stickyLeft[ci], zIndex: 3 } : {};
                return <th key={k.k} className={ci < stickyN ? 'stick' : ''} style={{ minWidth: k.lebar || 120, ...st }}>{k.label}</th>;
              })}
              {modul.bisaTambah && bisaEditEfektif && <th style={{ width: 40 }} />}
            </tr>
          </thead>
          <tbody>
            {terlihat.map((b) => (
              <tr key={b.id + '_' + b.row}>
                {kolomTabel.map((k, ci) => {
                  const st = ci < stickyN ? { position: 'sticky', left: stickyLeft[ci], zIndex: 1, background: '#fff' } : {};
                  return (
                    <td key={k.k} className={ci < stickyN ? 'stick' : ''} style={st}>
                      <Sel b={b} k={k} opsi={opsi} readOnly={!bisaEditEfektif || !k.edit}
                        simpanStatus={simpan[b.id + ':' + k.k]} onSimpan={simpanSel} />
                    </td>
                  );
                })}
                {modul.bisaTambah && bisaEditEfektif && <td><button className="xrow" title="Arsipkan" onClick={() => hapusBaris(b)}>🗑</button></td>}
              </tr>
            ))}
            {!terlihat.length && <tr><td colSpan={kolomTabel.length + 1} className="kosong">Tidak ada baris.</td></tr>}
          </tbody>
        </table>
      </div>

      {tambah && (
        <TambahModal modul={modul} opsi={opsi} me={me} onTutup={() => setTambah(false)}
          onBerhasil={(baris) => { setTambah(false); onTambah(modul.id, baris); onToast('Baris ditambahkan.', 'ok'); }} onToast={onToast} />
      )}
    </div>
  );
}

function Tautan({ nilai }) {
  const url = pastikanUrl(nilai);
  const info = jenisTautan(url);
  if (!info) return <span className="trunc">{String(nilai)}</span>;
  return <a className="tautan" href={url} target="_blank" rel="noopener noreferrer" title={info.label}>
    <span className="t-ikon">{info.ikon}</span><span className="t-lbl">{info.label}</span></a>;
}

function Sel({ b, k, opsi, readOnly, simpanStatus, onSimpan }) {
  const [v, setV] = useState(b.c[k.k] == null ? '' : String(b.c[k.k]));
  React.useEffect(() => { setV(b.c[k.k] == null ? '' : String(b.c[k.k])); }, [b.c, k.k]);

  if (readOnly) {
    const val = b.c[k.k];
    if (k.tipe === 'url') { return val ? <Tautan nilai={val} /> : <span className="kos">—</span>; }
    const teks = k.tipe === 'date' ? tglTampil(val) : String(val == null ? '' : val);
    const pakaiBadge = (k.tipe === 'select' || !!k.opsi) && teks;
    if (pakaiBadge) { const badge = warnaBadge(val, opsi[k.opsi]); if (badge) return <span className="chip2" style={{ background: badge.bg, color: badge.fg }}>{teks}</span>; }
    return <div className="trunc">{teks}</div>;
  }

  const mark = simpanStatus === 'simpan' ? <span className="sv saving">⟳</span>
    : simpanStatus === 'ok' ? <span className="sv ok">✓</span> : simpanStatus === 'err' ? <span className="sv err">!</span> : null;

  if (k.tipe === 'select') {
    return <span className="ed"><select className="ycell" value={v} onChange={(e) => { setV(e.target.value); onSimpan(b, k, e.target.value); }}>
      <option value=""></option>{(opsi[k.opsi] || []).map((o, i) => <option key={i} value={o.nilai}>{o.nilai}</option>)}</select>{mark}</span>;
  }
  if (k.tipe === 'date') {
    return <span className="ed"><input className="ycell" type="date" value={v} onChange={(e) => { setV(e.target.value); onSimpan(b, k, e.target.value); }} />{mark}</span>;
  }
  const buka = k.tipe === 'url' && pastikanUrl(v) && jenisTautan(pastikanUrl(v));
  return (
    <span className="ed">
      <input className="ycell" type={k.tipe === 'number' ? 'number' : 'text'} value={v} placeholder={k.tipe === 'url' ? 'Tautan…' : ''}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== String(b.c[k.k] == null ? '' : b.c[k.k])) onSimpan(b, k, v); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
      {buka && <a className="buka-ln" href={pastikanUrl(v)} target="_blank" rel="noopener noreferrer" title="Buka tautan">{buka.ikon}</a>}
      {mark}
    </span>
  );
}
