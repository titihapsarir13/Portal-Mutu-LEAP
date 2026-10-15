import React, { useState } from 'react';
import { api } from '../api';

export default function GantiSandi({ me, wajib, onSelesai, onBatal }) {
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [pesan, setPesan] = useState('');
  const [sibuk, setSibuk] = useState(false);

  async function simpan(e) {
    e.preventDefault();
    setPesan('');
    if (baru.length < 5) { setPesan('Sandi baru minimal 5 karakter.'); return; }
    if (baru !== ulang) { setPesan('Konfirmasi sandi tidak cocok.'); return; }
    setSibuk(true);
    try {
      const r = await api.gantiSandi({ nama: me.nama, sandiLama: lama, sandiBaru: baru });
      if (r && r.ok) onSelesai();
      else setPesan((r && r.message) || 'Gagal mengganti sandi.');
    } catch (err) { setPesan(err.message); }
    setSibuk(false);
  }

  return (
    <div className="loginwrap">
      <form className="lc" onSubmit={simpan}>
        <div className="lg">LM</div>
        <h2>{wajib ? 'Ganti Sandi' : 'Ubah Sandi'}</h2>
        <p>{wajib ? 'Ini login pertama Anda. Demi keamanan, buat sandi baru dulu.' : 'Masukkan sandi lama dan sandi baru Anda.'}</p>
        <div className="fld"><label>Sandi lama</label>
          <input className="inpf" type="password" value={lama} onChange={(e) => setLama(e.target.value)} placeholder={wajib ? 'leap123' : '••••••'} /></div>
        <div className="fld"><label>Sandi baru</label>
          <input className="inpf" type="password" value={baru} onChange={(e) => setBaru(e.target.value)} placeholder="minimal 5 karakter" /></div>
        <div className="fld"><label>Ulangi sandi baru</label>
          <input className="inpf" type="password" value={ulang} onChange={(e) => setUlang(e.target.value)} /></div>
        {pesan && <div className="lerr">{pesan}</div>}
        <button className="lbtn" disabled={sibuk} type="submit">{sibuk ? 'Menyimpan…' : 'Simpan sandi'}</button>
        {!wajib && <button type="button" className="lbtn2" onClick={onBatal}>Batal</button>}
      </form>
    </div>
  );
}
