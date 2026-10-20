import React from 'react';

export const MENU_UTAMA = [
  { id: 'beranda', label: 'Beranda', awal: 'beranda' },
  { id: 'spmi', label: 'SPMI', awal: 'status-spmi' },
  { id: 'siklus', label: 'Siklus Mutu', awal: 'modul-siklus' },
  { id: 'evaluasi', label: 'Evaluasi Diri', awal: 'modul-edlk' },
  { id: 'eklk', label: 'EKLK', awal: 'modul-eklk_bim' }
];

export function bagianModul(m) {
  if (['naskah', 'form', 'tugas'].includes(m.id)) return 'spmi';
  if (['siklus', 'log'].includes(m.id)) return 'siklus';
  if (['edlk', 'dokumen'].includes(m.id)) return 'evaluasi';
  if (['eklk_bim', 'eklk_ket', 'proses', 'ref_eklk_kh'].includes(m.id) || /^eklk_/.test(m.id)) return 'eklk';
  return 'beranda';
}

// Halaman tetap (bukan modul backend) yang berada di tab Beranda.
export const HALAMAN_BERANDA = ['beranda', 'alur', 'dashboard', 'admin', 'dasar-hukum', 'syarat', 'akreditasi'];

export function bagianHalaman(hash, modul) {
  if (hash === 'status-spmi') return 'spmi';
  if (!hash || HALAMAN_BERANDA.includes(hash)) return 'beranda';
  const id = hash.split('~')[0].replace(/^modul-/, '');
  return bagianModul((modul || []).find((m) => m.id === id) || { id });
}

// Rincian menu yang disembunyikan dari tab SPMI (hanya tampilan; data sumber tetap ada).
const SPMI_SEMBUNYI = ['form', 'tugas'];
// Modul referensi yang kini ditampilkan lewat halaman khusus (Dasar Hukum, Syarat, Akreditasi),
// jadi tidak lagi muncul sebagai item modul kosong di sidebar Beranda. Datanya tetap dibaca.
const REF_HALAMAN = ['ref_regulasi', 'ref_syarat', 'ref_akre'];

export function rincianMenu(bagian, modul, isSA) {
  // Ikon dibedakan tiap menu Beranda agar mudah dikenali.
  const items = bagian === 'beranda' ? [
    { id: 'beranda', nama: 'Panduan', ikon: '🏠' },
    { id: 'alur', nama: 'Alur Kerja (Peta)', ikon: '🗺️' },
    { id: 'dashboard', nama: 'Dashboard', ikon: '📊' },
    { id: 'dasar-hukum', nama: 'Dasar Hukum & Peraturan', ikon: '⚖️' },
    { id: 'syarat', nama: 'Syarat & Keputusan', ikon: '📋' },
    { id: 'akreditasi', nama: 'Akreditasi', ikon: '🏅' }
  ] : [];
  // Tab SPMI: Status SPMI di urutan pertama, lalu Naskah SPMI.
  if (bagian === 'spmi') items.push({ id: 'status-spmi', nama: 'Status SPMI', ikon: '▦' });
  const urutan = { naskah: 0, form: 1, tugas: 2, siklus: 0, log: 1, edlk: 0, dokumen: 1, eklk_bim: 0, eklk_ket: 1, ref_eklk_kh: 2, proses: 3 };
  const list = (modul || [])
    .filter((m) => bagianModul(m) === bagian)
    .filter((m) => !(bagian === 'spmi' && SPMI_SEMBUNYI.includes(m.id)))
    .filter((m) => !(bagian === 'beranda' && REF_HALAMAN.includes(m.id)))
    .slice().sort((a, b) => (urutan[a.id] ?? 100) - (urutan[b.id] ?? 100) || (a.urutan || 0) - (b.urutan || 0));
  list.forEach((m) => items.push({ ...m, id: 'modul-' + m.id, nama: m.id === 'naskah' ? 'Naskah SPMI' : m.nama, modul: true }));
  if (bagian === 'beranda' && isSA) items.push({ id: 'admin', nama: 'Admin & Akses', ikon: '⚙️' });
  return items;
}

export default function MainNav({ app, aktif, onPilih, onMundur, onMaju, onToggleSidebar }) {
  return <header className="primary-header">
    <div className="primary-brand">
      <button className="primary-toggle" onClick={onToggleSidebar} aria-label="Buka atau tutup rincian menu" title="Buka/tutup rincian menu">☰</button>
      <div className="primary-history"><button onClick={onMundur} aria-label="Kembali">‹</button><button onClick={onMaju} aria-label="Maju">›</button></div>
      <span>{(app && app.namaApp) || 'Portal Mutu LEAP'}</span>
    </div>
    <nav className="primary-tabs" aria-label="Menu utama">
      {MENU_UTAMA.map((m) => <button key={m.id} className={'primary-tab' + (aktif === m.id ? ' active' : '')} aria-current={aktif === m.id ? 'page' : undefined} onClick={() => onPilih(m)}>{m.label}</button>)}
    </nav>
  </header>;
}
