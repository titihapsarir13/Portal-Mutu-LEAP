import React, { useState } from 'react';
import { MENU_UTAMA, rincianMenu } from './MainNav';

const IKON = { tugas: '◧', naskah: '✎', form: '▤', siklus: '◷', log: '◉', edlk: '◩', dokumen: '▣', eklk: '◆', proses: '➚', ref: '§' };

export default function Sidebar({ modul, naskahBaris, bagian, aktif, onPilih, drawer, collapsed, isSA, onTutup, onToggleCollapse }) {
  const [cari, setCari] = useState('');
  const menu = MENU_UTAMA.find((m) => m.id === bagian) || MENU_UTAMA[0];
  const items = rincianMenu(bagian, modul, isSA);
  const bagianNaskah = [...new Set((naskahBaris || []).map((b) => String(b.c[2] || '').trim()).filter(Boolean))];
  const visible = items.filter((m) => m.nama.toLowerCase().includes(cari.toLowerCase()) || (m.id === 'modul-naskah' && bagianNaskah.some((x) => x.toLowerCase().includes(cari.toLowerCase()))));
  return <aside className={'side section-side' + (drawer ? ' drawer' : '') + (collapsed ? ' collapsed' : '')} aria-label={'Rincian ' + menu.label}>
    <div className="section-side-head">
      <span className="section-side-title">{menu.label}</span>
      <button className="section-side-toggle" onClick={drawer ? onTutup : onToggleCollapse} aria-label={drawer ? 'Tutup rincian menu' : collapsed ? 'Buka rincian menu' : 'Tutup rincian menu'} title={collapsed ? 'Buka rincian menu' : 'Tutup rincian menu'}>{collapsed && !drawer ? '▥' : '‹'}</button>
    </div>
    <div className="section-side-content">
      <label className="section-search"><span className="sr-only">Cari rincian {menu.label}</span><input key={bagian} value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari rincian menu…" type="search" /></label>
      <nav className="nav" aria-label={'Halaman ' + menu.label}>
        <div className="section-side-caption">RINCIAN {menu.label.toUpperCase()}</div>
        {visible.map((m) => <React.Fragment key={m.id}><button className={'ni' + (aktif === m.id ? ' act' : '')} aria-current={aktif === m.id ? 'page' : undefined} onClick={() => onPilih(m.id)} title={m.nama}>
          <span className="ic">{IKON[m.ikon] || m.ikon || '•'}</span><span className="ni-l">{m.terkunci ? '🔒 ' : ''}{m.nama}</span>{m._jml != null && <span className="bdg">{m._jml}</span>}
        </button>
          {m.id === 'modul-naskah' && bagianNaskah.length > 0 && <div className="section-chapters">{bagianNaskah.filter((x) => !cari || x.toLowerCase().includes(cari.toLowerCase()) || m.nama.toLowerCase().includes(cari.toLowerCase())).map((nama) => { const id = 'modul-naskah~' + encodeURIComponent(nama); return <button key={id} className={'section-chapter' + (aktif === id ? ' active' : '')} onClick={() => onPilih(id)} aria-current={aktif === id ? 'page' : undefined}>{nama}</button>; })}</div>}
        </React.Fragment>)}
        {!visible.length && <p className="section-empty">{items.length ? 'Tidak ada rincian yang cocok.' : 'Belum ada menu yang tersedia untuk akun ini.'}</p>}
      </nav>
      <div className="section-side-foot">Pilih menu utama di atas untuk berpindah tahap.</div>
    </div>
  </aside>;
}
