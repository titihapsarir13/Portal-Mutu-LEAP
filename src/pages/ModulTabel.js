import React, { useMemo, useState } from 'react';
import { api } from '../api';
import { tglTampil, warnaBadge, norm } from '../utils/format';
import TambahModal from '../components/TambahModal';

export default function ModulTabel({ modul, moddata, opsi, me, onPatch, onTambah, onHapus, onToast }) {
  const kolomTabel = (modul.kolom || []).filter((k) => k.tabel);
  const kolomFilter = kolomTabel.filter((k) => k.tipe === 'select');
  const [filter, setFilter] = useState({});
  const [cari, setCari] = useState('');
  const [simpan, setSimpan] = useState({});
  const [tambah, setTambah] = useState(false);
  const baris = useMemo(() => (moddata && moddata.baris) || [], [moddata]);

  const terlihat = useMemo(() => {
    const q = norm(cari);
    return baris.filter((b) => {
      for (const k of kolomFilter) {
        const fv = filter[k.k];
        if (fv && String(b.c[k.k] || '') !== fv) return false;
      }
      if (q) {
        const gabung = kolomTabel.map((k) => norm(b.c[k.k])).join(' ');
        if (gabung.indexOf(q) < 0) return false;
      }
      return true;
    });
  }, [baris, filter, cari, kolomFilter, kolomTabel]);

  async function simpanSel(b, kol, nilai) {
    const key = b.id + ':' + kol.k;
    const lama = b.c[kol.k];
    onPatch(modul.id, b.id, kol.k, nilai); // optimistik
    setSimpan((s) => ({ ...s, [key]: 'simpan' }));
    try {
      const r = await api.update({ modulId: modul.id, id: b.id, row: b.row, kolom: kol.k, nilai, pengguna: me.nama });
      if (r && r.ok) {
        onPatch(modul.id, b.id, kol.k, r.data.nilai);
        setSimpan((s) => ({ ...s, [key]: 'ok' }));
        setTimeout(() => setSimpan((s) => { const n = { ...s }; delete n[key]; return n; }), 1500);
      } else {
        onPatch(modul.id, b.id, kol.k, lama);
        setSimpan((s) => ({ ...s, [key]: 'err' }));
        onToast((r && r.message) || 'Gagal menyimpan.', 'err');
      }
    } catch (e) {
      onPatch(modul.id, b.id, kol.k, lama);
      setSimpan((s) => ({ ...s, [key]: 'err' }));
      onToast(e.message, 'err');
    }
  }

  async function hapusBaris(b) {
    if (!window.confirm('Arsipkan baris ' + b.id + '? Baris akan disembunyikan dari web (data di spreadsheet tetap ada).')) return;
    try {
      const r = await api.archive({ modulId: modul.id, id: b.id, pengguna: me.nama });
      if (r && r.ok) { onHapus(modul.id, b.id); onToast('Baris diarsipkan.', 'ok'); }
      else onToast((r && r.message) || 'Gagal.', 'err');
    } catch (e) { onToast(e.message, 'err'); }
  }

  return (
    <div className="body">
      <div className="toolbar">
        {kolomFilter.map((k) => (
          <select key={k.k} className="self" value={filter[k.k] || ''} onChange={(e) => setFilter({ ...filter, [k.k]: e.target.value })}>
            <option value="">{k.label}: Semua</option>
            {(opsi[k.opsi] || []).map((o, i) => <option key={i} value={o.nilai}>{o.nilai}</option>)}
          </select>
        ))}
        <input className="searchf" placeholder="Cari…" value={cari} onChange={(e) => setCari(e.target.value)} />
        {(Object.keys(filter).some((k) => filter[k]) || cari) &&
          <button className="btn" onClick={() => { setFilter({}); setCari(''); }}>Reset</button>}
        <span className="cnt">menampilkan {terlihat.length} dari {baris.length}</span>
        {modul.bisaTambah && !modul.bacaSaja && <button className="btn pri" onClick={() => setTambah(true)}>+ Tambah</button>}
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              {kolomTabel.map((k) => <th key={k.k} style={{ minWidth: k.lebar || 120 }}>{k.label}</th>)}
              {modul.bisaTambah && !modul.bacaSaja && <th style={{ width: 44 }} />}
            </tr>
          </thead>
          <tbody>
            {terlihat.map((b) => (
              <tr key={b.id + '_' + b.row}>
                {kolomTabel.map((k) => (
                  <td key={k.k}>
                    <Sel b={b} k={k} opsi={opsi} readOnly={modul.bacaSaja || !k.edit}
                      simpanStatus={simpan[b.id + ':' + k.k]} onSimpan={simpanSel} />
                  </td>
                ))}
                {modul.bisaTambah && !modul.bacaSaja && (
                  <td><button className="xrow" title="Arsipkan" onClick={() => hapusBaris(b)}>🗑</button></td>
                )}
              </tr>
            ))}
            {!terlihat.length && <tr><td colSpan={kolomTabel.length + 1} className="kosong">Tidak ada baris.</td></tr>}
          </tbody>
        </table>
      </div>

      {tambah && (
        <TambahModal modul={modul} opsi={opsi} me={me}
          onTutup={() => setTambah(false)}
          onBerhasil={(baris) => { setTambah(false); onTambah(modul.id, baris); onToast('Baris ditambahkan.', 'ok'); }}
          onToast={onToast} />
      )}
    </div>
  );
}

function Sel({ b, k, opsi, readOnly, simpanStatus, onSimpan }) {
  const [v, setV] = useState(b.c[k.k] == null ? '' : String(b.c[k.k]));
  React.useEffect(() => { setV(b.c[k.k] == null ? '' : String(b.c[k.k])); }, [b.c, k.k]);

  if (readOnly) {
    const teks = k.tipe === 'date' ? tglTampil(b.c[k.k]) : String(b.c[k.k] == null ? '' : b.c[k.k]);
    const pakaiBadge = (k.tipe === 'select' || !!k.opsi) && teks;
    if (pakaiBadge) {
      const badge = warnaBadge(b.c[k.k], opsi[k.opsi]);
      if (badge) return <span className="chip2" style={{ background: badge.bg, color: badge.fg }}>{teks}</span>;
    }
    return <div className="trunc">{teks}</div>;
  }

  const mark = simpanStatus === 'simpan' ? <span className="sv saving">⟳</span>
    : simpanStatus === 'ok' ? <span className="sv ok">✓</span>
      : simpanStatus === 'err' ? <span className="sv err">!</span> : null;

  if (k.tipe === 'select') {
    return (
      <span className="ed">
        <select className="ycell" value={v} onChange={(e) => { setV(e.target.value); onSimpan(b, k, e.target.value); }}>
          <option value=""></option>
          {(opsi[k.opsi] || []).map((o, i) => <option key={i} value={o.nilai}>{o.nilai}</option>)}
        </select>{mark}
      </span>
    );
  }
  if (k.tipe === 'date') {
    return <span className="ed"><input className="ycell" type="date" value={v}
      onChange={(e) => { setV(e.target.value); onSimpan(b, k, e.target.value); }} />{mark}</span>;
  }
  // text / url / textarea / number
  return (
    <span className="ed">
      <input className="ycell" type={k.tipe === 'number' ? 'number' : 'text'} value={v}
        placeholder={k.tipe === 'url' ? 'Tautan…' : ''}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== String(b.c[k.k] == null ? '' : b.c[k.k])) onSimpan(b, k, v); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />{mark}
    </span>
  );
}
