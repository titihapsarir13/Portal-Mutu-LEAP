import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin({ me, onToast, onRefresh }) {
  const [data, setData] = useState(null);
  const [matriks, setMatriks] = useState({});
  const [sibuk, setSibuk] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function muat() {
    setErr('');
    try {
      const r = await api.adminData({ oleh: me.nama });
      if (r && r.ok) {
        setData(r.data);
        const mt = {};
        r.data.divisi.forEach((d) => { r.data.modul.forEach((m) => { mt[d + '|' + m.id] = { lihat: true, edit: true }; }); });
        (r.data.akses || []).forEach((a) => { mt[a.divisi + '|' + a.modul] = { lihat: !!a.lihat, edit: !!a.edit }; });
        setMatriks(mt);
      } else setErr((r && r.message) || 'Gagal memuat.');
    } catch (e) { setErr(e.message); }
  }

  function toggle(d, mid, jenis) {
    setMatriks((s) => {
      const k = d + '|' + mid; const cur = s[k] || { lihat: true, edit: true };
      const next = { ...cur, [jenis]: !cur[jenis] };
      if (jenis === 'lihat' && !next.lihat) next.edit = false; // tak bisa edit kalau tak bisa lihat
      if (jenis === 'edit' && next.edit) next.lihat = true;
      return { ...s, [k]: next };
    });
  }

  async function simpanAkses() {
    setSibuk(true);
    const akses = [];
    Object.keys(matriks).forEach((k) => {
      const v = matriks[k];
      if (!v.lihat || !v.edit) { const [divisi, modul] = k.split('|'); akses.push({ divisi, modul, lihat: v.lihat, edit: v.edit }); }
    });
    try {
      const r = await api.setAkses({ oleh: me.nama, akses });
      if (r && r.ok) { onToast('Hak akses disimpan.', 'ok'); if (onRefresh) onRefresh(); }
      else onToast((r && r.message) || 'Gagal.', 'err');
    } catch (e) { onToast(e.message, 'err'); }
    setSibuk(false);
  }

  async function aksiUser(fn, okMsg) {
    try { const r = await fn(); if (r && r.ok) { onToast(okMsg || r.message, 'ok'); muat(); } else onToast((r && r.message) || 'Gagal.', 'err'); }
    catch (e) { onToast(e.message, 'err'); }
  }

  if (err) return <div className="body"><div className="galat"><b>{err}</b></div></div>;
  if (!data) return <div className="body"><div className="kosong">Memuat…</div></div>;

  return (
    <div className="body">
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="ph">Pengguna</div>
        <div className="tbl-wrap" style={{ maxHeight: 'none' }}>
          <table>
            <thead><tr><th>Nama</th><th>Divisi</th><th>Peran</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {data.pengguna.map((p) => (
                <tr key={p.nama}>
                  <td><b>{p.nama}</b>{p.harusGanti ? <span className="chip c-a" style={{ marginLeft: 6 }}>belum ganti sandi</span> : null}</td>
                  <td>{p.divisi}</td>
                  <td>
                    <select className="self" value={p.peran === 'SA' ? 'SA' : 'Pengguna'}
                      onChange={(e) => aksiUser(() => api.setPeran({ oleh: me.nama, target: p.nama, peran: e.target.value }), 'Peran diperbarui.')}>
                      <option value="Pengguna">Pengguna</option><option value="SA">Super Admin</option>
                    </select>
                  </td>
                  <td>
                    <button className={'btn ' + (p.aktif ? '' : 'pri')}
                      onClick={() => aksiUser(() => api.setAktif({ oleh: me.nama, target: p.nama, aktif: !p.aktif }), 'Status diperbarui.')}>
                      {p.aktif ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td><button className="btn" onClick={() => { if (window.confirm('Reset sandi ' + p.nama + ' ke default (leap123)?')) aksiUser(() => api.resetSandi({ oleh: me.nama, target: p.nama }), 'Sandi direset.'); }}>Reset sandi</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="ph">Hak akses per divisi × modul <span className="mt">centang = boleh</span></div>
        <div className="tbl-wrap" style={{ maxHeight: 'none' }}>
          <table className="matriks">
            <thead>
              <tr><th style={{ minWidth: 180, position: 'sticky', left: 0, zIndex: 3 }}>Divisi</th>
                {data.modul.map((m) => <th key={m.id} title={m.nama}>{m.nama}</th>)}</tr>
            </thead>
            <tbody>
              {data.divisi.map((d) => (
                <tr key={d}>
                  <td style={{ position: 'sticky', left: 0, background: '#fff', fontWeight: 600, zIndex: 2 }}>{d}</td>
                  {data.modul.map((m) => {
                    const v = matriks[d + '|' + m.id] || { lihat: true, edit: true };
                    return (
                      <td key={m.id} className="cel-ak">
                        <label title="Boleh lihat"><input type="checkbox" checked={v.lihat} onChange={() => toggle(d, m.id, 'lihat')} /> L</label>
                        {!m.bacaSaja && <label title="Boleh edit"><input type="checkbox" checked={v.edit} onChange={() => toggle(d, m.id, 'edit')} /> E</label>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pb"><button className="btn pri" disabled={sibuk} onClick={simpanAkses}>{sibuk ? 'Menyimpan…' : 'Simpan hak akses'}</button>
          <span className="cnt" style={{ marginLeft: 10 }}>L = lihat, E = edit. Kosong = default (boleh semua).</span></div>
      </div>
    </div>
  );
}
