import React, { useState } from 'react';
import { api } from '../api';

export default function TambahModal({ modul, opsi, me, onTutup, onBerhasil, onToast }) {
  const fields = (modul.kolom || []).filter((k) => k.edit);
  const [val, setVal] = useState({});
  const [sibuk, setSibuk] = useState(false);

  function set(k, v) { setVal((s) => ({ ...s, [k]: v })); }

  async function simpan() {
    for (const f of fields) {
      if (f.wajib && !val[f.k]) { onToast('Isi dulu: ' + f.label, 'err'); return; }
    }
    setSibuk(true);
    try {
      const r = await api.create({ modulId: modul.id, data: val, pengguna: me.nama });
      if (r && r.ok) {
        const c = {}; Object.keys(val).forEach((k) => { c[k] = val[k]; });
        onBerhasil({ id: r.data.id, row: r.data.row, c });
      } else onToast((r && r.message) || 'Gagal menambah.', 'err');
    } catch (e) { onToast(e.message, 'err'); }
    setSibuk(false);
  }

  return (
    <div className="modal-bg" onClick={onTutup}>
      <div className="modal lebar" onClick={(e) => e.stopPropagation()}>
        <h3>Tambah: {modul.nama}</h3>
        <div className="formgrid">
          {fields.map((f) => (
            <div className="ffld" key={f.k}>
              <label>{f.label}{f.wajib ? ' *' : ''}</label>
              {f.tipe === 'select' ? (
                <select value={val[f.k] || ''} onChange={(e) => set(f.k, e.target.value)}>
                  <option value=""></option>
                  {(opsi[f.opsi] || []).map((o, i) => <option key={i} value={o.nilai}>{o.nilai}</option>)}
                </select>
              ) : f.tipe === 'textarea' ? (
                <textarea rows={2} value={val[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
              ) : (
                <input type={f.tipe === 'date' ? 'date' : f.tipe === 'number' ? 'number' : 'text'}
                  value={val[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
              )}
            </div>
          ))}
        </div>
        <div className="mbtns">
          <button className="btn" onClick={onTutup}>Batal</button>
          <button className="btn pri" disabled={sibuk} onClick={simpan}>{sibuk ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
}
