import React, { useState } from 'react';
import { MENU_UTAMA, rincianMenu } from './MainNav';
import SpmiTree from './SpmiTree';

const IKON = { tugas: '◧', naskah: '✎', form: '▤', siklus: '◷', log: '◉', edlk: '◩', dokumen: '▣', eklk: '◆', proses: '➚', ref: '§' };

const TREE_KEY = 'leap.spmi.treeOpen';
function bacaTreeOpen() { try { return localStorage.getItem(TREE_KEY) !== '0'; } catch (e) { return true; } }

export default function Sidebar({ modul, spmiTree, spmiSelected, bagian, aktif, onPilih, drawer, collapsed, isSA, onTutup, onToggleCollapse }) {
  const [cari, setCari] = useState('');
  const [treeOpen, setTreeOpen] = useState(bacaTreeOpen);
  function toggleTree() { setTreeOpen((v) => { const n = !v; try { localStorage.setItem(TREE_KEY, n ? '1' : '0'); } catch (e) {} return n; }); }
  const menu = MENU_UTAMA.find((m) => m.id === bagian) || MENU_UTAMA[0];
  const items = rincianMenu(bagian, modul, isSA);
  const visible = items.filter((m) => m.nama.toLowerCase().includes(cari.toLowerCase()) || (m.id === 'modul-naskah' && spmiTree));
  // Saat mencari, pohon selalu ditampilkan agar hasil cari terlihat.
  const treeTampil = treeOpen || !!cari.trim();
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
          return <React.Fragment key={m.id}>
            <div className={'ni-row' + (adaPohon ? ' has-tree' : '')}>
              <button className={'ni' + (aktif === m.id ? ' act' : '')} aria-current={aktif === m.id ? 'page' : undefined} onClick={() => onPilih(m.id)} title={m.nama}>
                <span className="ic">{IKON[m.ikon] || m.ikon || '•'}</span><span className="ni-l">{m.terkunci ? '🔒 ' : ''}{m.nama}</span>{m._jml != null && <span className="bdg">{m._jml}</span>}
              </button>
              {adaPohon && <button className="ni-tree-toggle" onClick={toggleTree} aria-expanded={treeTampil} aria-label={treeTampil ? 'Tutup daftar bagian naskah' : 'Buka daftar bagian naskah'} title={treeTampil ? 'Tutup daftar bagian' : 'Buka daftar bagian'}>{treeTampil ? '▾' : '▸'}</button>}
            </div>
            {adaPohon && treeTampil && <SpmiTree tree={spmiTree} aktif={spmiSelected} query={cari} pilih={onPilih} />}
          </React.Fragment>;
        })}
        {!visible.length && <p className="section-empty">{items.length ? 'Tidak ada rincian yang cocok.' : 'Belum ada menu yang tersedia untuk akun ini.'}</p>}
      </nav>
      <div className="section-side-foot">Pilih menu utama di atas untuk berpindah tahap.</div>
    </div>
  </aside>;
}
