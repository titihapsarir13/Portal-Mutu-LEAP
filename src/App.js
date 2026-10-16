import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { APP_VERSION } from '../config';

export default function Topbar({ judul, sub, me, onRefresh, onBurger, onKeluar, onMundur, onMaju, onGantiSandi }) {
  const [buka, setBuka] = useState(false);
  const [diag, setDiag] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setBuka(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function jalankanDiag() {
    setBuka(false); setDiag({ status: 'cek' });
    try {
      const p = await api.ping();
      const v = await api.versi();
      setDiag({ status: 'ok', versiKode: p && p.data && p.data.versiKode, versiData: v && v.data && v.data.versi });
    } catch (e) { setDiag({ status: 'galat', pesan: e.message }); }
  }

  const inisial = (me && me.nama ? me.nama.replace(/[^A-Za-z ]/g, '').split(' ').map((x) => x[0]).slice(0, 2).join('') : '?').toUpperCase();

  return (
    <div className="top">
      <button className="burger" onClick={onBurger} aria-label="Menu">☰</button>
      <div className="navpair">
        <button className="navbtn" onClick={onMundur} aria-label="Kembali" title="Kembali">◀</button>
        <button className="navbtn" onClick={onMaju} aria-label="Maju" title="Maju">▶</button>
      </div>
      <div className="thead"><h1>{judul}</h1>{sub && <div className="sub">{sub}</div>}</div>
      <div className="spacer" />
      <div className="who"><span className="ava">{inisial}</span><span className="who-n">{me ? (me.divisi || me.nama) : ''}</span></div>
      <div className="kebab-wrap" ref={ref}>
        <button className="kebab" onClick={() => setBuka(!buka)} aria-label="Menu lainnya">⋯</button>
        {buka && (
          <div className="menu">
            <div className="mi" onClick={() => { setBuka(false); onRefresh(); }}>↻ Refresh data</div>
            {onGantiSandi && <div className="mi" onClick={() => { setBuka(false); onGantiSandi(); }}>🔑 Ganti sandi</div>}
            <div className="mi" onClick={jalankanDiag}>🩺 Diagnosa</div>
            {onKeluar && <><div className="msep" /><div className="mi" onClick={() => { setBuka(false); onKeluar(); }}>⎋ Keluar</div></>}
          </div>
        )}
      </div>
      {diag && (
        <div className="modal-bg" onClick={() => setDiag(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Diagnosa</h3>
            {diag.status === 'cek' && <p>Memeriksa…</p>}
            {diag.status === 'ok' && (
              <ul className="diag">
                <li>Versi web: <b>{APP_VERSION}</b></li>
                <li>Versi kode backend: <b>{diag.versiKode || '-'}</b></li>
                <li>Versi data: <b>{diag.versiData || '-'}</b></li>
                <li>Koneksi: <b style={{ color: '#1E7D52' }}>tersambung</b></li>
              </ul>
            )}
            {diag.status === 'galat' && <p style={{ color: '#B42318' }}>Gagal: {diag.pesan}</p>}
            <button className="btn" onClick={() => setDiag(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
