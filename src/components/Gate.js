import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Gate({ onMasuk }) {
  const [list, setList] = useState([]);
  const [nama, setNama] = useState('');
  const [pin, setPin] = useState('');
  const [pesan, setPesan] = useState('');
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    let batal = false;
    api.pengguna().then((r) => {
      if (batal) return;
      if (r && r.ok && r.data.pengguna) { setList(r.data.pengguna); if (r.data.pengguna[0]) setNama(r.data.pengguna[0].nama); }
    }).catch(() => {});
    return () => { batal = true; };
  }, []);

  async function masuk(e) {
    e.preventDefault();
    setSibuk(true); setPesan('');
    try {
      const r = await api.login(nama, pin);
      if (r && r.ok) {
        const me = { nama: r.data.nama, divisi: r.data.divisi || '' };
        onMasuk(me);
      } else { setPesan((r && r.message) || 'Gagal masuk.'); }
    } catch (err) { setPesan(err.message); }
    setSibuk(false);
  }

  return (
    <div className="loginwrap">
      <form className="lc" onSubmit={masuk}>
        <div className="lg">LM</div>
        <h2>Portal Mutu LEAP</h2>
        <p>Masuk untuk mengisi checklist akreditasi. Setiap perubahan dicatat atas nama Anda.</p>
        <div className="fld">
          <label>Nama / divisi</label>
          {list.length ? (
            <select className="inpf" value={nama} onChange={(e) => setNama(e.target.value)}>
              {list.map((p, i) => <option key={i} value={p.nama}>{p.nama}{p.divisi && p.divisi !== p.nama ? ` — ${p.divisi}` : ''}</option>)}
            </select>
          ) : (
            <input className="inpf" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Anda" />
          )}
        </div>
        <div className="fld">
          <label>PIN</label>
          <input className="inpf" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
        </div>
        {pesan && <div className="lerr">{pesan}</div>}
        <button className="lbtn" disabled={sibuk} type="submit">{sibuk ? 'Memeriksa…' : 'Masuk'}</button>
        <div className="lnote">PIN hanya penyaring ringan, bukan keamanan penuh. Jangan isi data rahasia.</div>
      </form>
    </div>
  );
}
