import React, { useState } from 'react';
import { MENU_UTAMA, rincianMenu } from './MainNav';
import SpmiTree from './SpmiTree';

const IKON = { tugas: '◧', naskah: '✎', form: '▤', siklus: '◷', log: '◉', edlk: '◩', dokumen: '▣', eklk: '◆', proses: '➚', ref: '§' };

const TREE_KEY = 'leap.spmi.treeOpen';
// Default TERTUTUP agar sidebar ringkas; '1' = terbuka.
function bacaTreeOpen() { try { return localStorage.getItem(TREE_KEY) === '1'; } catch (e) { return false; } }

export default function Sidebar({ modul, spmiTree, spmiSelected, bagian, aktif, onPilih, drawer, collapsed, isSA, onTutup, onToggleCollapse }) {
  const [cari, setCari] = useState('');
  const [treeOpen, setTreeOpen] = useState(bacaTreeOpen);
  function setTree(n) { setTreeOpen(n); try { localStorage.setItem(TREE_KEY, n ? '1' : '0'); } catch (e) {} }
  const menu = MENU_UTAMA.find((m) => m.id === bagian) || MENU_UTAMA[0];
  const items = rincianMenu(bagian, modul, isSA);
  const visible = items.filter((m) => m.nama.toLowerCase().includes(cari.toLowerCase()) || (m.id === 'modul-naskah' && spmiTree));
  // Saat mencari, pohon selalu ditampilkan agar hasil cari terlihat.
  const treeTampil = treeOpen || !!cari.trim();
  const diNaskah = String(aktif || '').indexOf('modul-naskah') === 0;
  // Klik "Naskah SPMI": jika pohon terbuka → tutup (rapi); jika tertutup → buka & tampilkan SEMUA BAGIAN
  // (selalu ke 'modul-naskah' agar tidak tersangkut di satu BAB saat masuk).
  function klikNaskah() { if (treeOpen && !cari.trim()) { setTree(false); } else { setTree(true); onPilih('modul-naskah'); } }
  return <aside className={'side section-side' + (drawer ? ' drawer' : '') + (collapsed ? ' collapsed' : '')} aria-label={'Rincian ' + menu.label}>
    <div className="section-side-head">
      <span className="section-side-title">{menu.label}</span>
      <button className="section-side-toggle" onClick={drawer ? onTutup : onToggleCollapse} aria-label={drawer ? 'Tutup rincian menu' : collapsed ? 'Buka rincian menu' : 'Tutup rincian menu'} title={collapsed ? 'Buka rincian menu' : 'Tutup rincian menu'}>{collapsed && !drawer ? '▥' : '‹'}</button>
    </div>
    <div className="section-side-content">
      <label className="section-search"><span className="sr-only">Cari rincian {menu.label}</span><input key={bagian} value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari rincian menu…" type="search" /></label>
      <nav className="nav" aria-label={'Halaman ' + menu.label}>
        <div className="section-side-caption">RINCIAN {menu.label.toUpperCase()}</div>
        {visible.map((m) => {
          const adaPohon = m.id === 'modul-naskah' && spmiTree;
          if (adaPohon) {
            return <React.Fragment key={m.id}>
              <button className={'ni ni-naskah' + (diNaskah ? ' act' : '')} aria-expanded={treeTampil}
                onClick={klikNaskah} title={treeTampil ? 'Klik untuk menyembunyikan daftar bagian' : 'Klik untuk menampilkan daftar bagian'}>
                <span className="ic">{IKON[m.ikon] || m.ikon || '•'}</span><span className="ni-l">{m.nama}</span>
                {m._jml != null && <span className="bdg">{m._jml}</span>}<span className="ni-caret">{treeTampil ? '▾' : '▸'}</span>
              </button>
              {treeTampil && <SpmiTree tree={spmiTree} aktif={spmiSelected} query={cari} pilih={onPilih} />}
            </React.Fragment>;
          }
          return <button key={m.id} className={'ni' + (aktif === m.id ? ' act' : '')} aria-current={aktif === m.id ? 'page' : undefined} onClick={() => onPilih(m.id)} title={m.nama}>
            <span className="ic">{IKON[m.ikon] || m.ikon || '•'}</span><span className="ni-l">{m.nama}</span>{m._jml != null && <span className="bdg">{m._jml}</span>}
          </button>;
        })}
        {!visible.length && <p className="section-empty">{items.length ? 'Tidak ada rincian yang cocok.' : 'Belum ada menu yang tersedia untuk akun ini.'}</p>}
      </nav>
      <div className="section-side-foot">Pilih menu utama di atas untuk berpindah tahap.</div>
    </div>
  </aside>;
}
