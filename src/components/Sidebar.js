import React from 'react';

const IKON = {
  beranda: '🏁', dashboard: '▦', alur: '🗺️', admin: '⚙️',
  tugas: '◧', naskah: '✎', form: '▤', siklus: '◷', log: '◉',
  edlk: '◩', dokumen: '▣', eklk: '◆', proses: '➚', ref: '§'
};

// Urutan tahap sesuai alur SPMI → PPEPP → EDLK → EKLK → akreditasi.
// Tiap tahap berisi daftar id modul; modul yang tak terdaftar di sini dan
// bergrup "Referensi" otomatis masuk ke tahap "Referensi".
const TAHAP = [
  { key: 't1', label: 'Tahap 1 · Sistem Mutu', ids: ['naskah', 'form'] },
  { key: 't2', label: 'Tahap 2 · Siklus Mutu', ids: ['siklus', 'log'] },
  { key: 't3', label: 'Tahap 3 · Evaluasi Diri', ids: ['edlk', 'dokumen'] },
  { key: 't4', label: 'Tahap 4 · EKLK', ids: ['eklk_bim', 'eklk_ket', 'proses'] },
  { key: 'koord', label: 'Koordinasi', ids: ['tugas'] }
];

export default function Sidebar({ app, modul, aktif, onPilih, drawer, collapsed, isSA, onTutup, onToggleCollapse, grupTutup, onToggleGrup }) {
  const byId = {};
  modul.forEach((m) => { byId[m.id] = m; });
  const terpakai = {};

  // bangun tahap dari daftar; hanya tampilkan modul yang tersedia untuk pengguna
  const tahapTampil = TAHAP.map((t) => {
    const items = t.ids.map((id) => byId[id]).filter(Boolean);
    items.forEach((m) => { terpakai[m.id] = true; });
    return { ...t, items };
  }).filter((t) => t.items.length);

  // sisa modul yang belum terpetakan → kelompokkan per grup (mis. Referensi)
  const sisa = {};
  modul.forEach((m) => {
    if (terpakai[m.id]) return;
    const g = m.grup || 'Lainnya';
    (sisa[g] = sisa[g] || []).push(m);
  });
  const sisaGrup = Object.keys(sisa);

  return (
    <aside className={'side' + (drawer ? ' drawer' : '') + (collapsed ? ' collapsed' : '')}>
      <div className="brand">
        <div className="logo">LM</div>
        {!collapsed && <div className="brand-t"><b>{(app && app.namaApp) || 'Portal Mutu LEAP'}</b><small>Checklist Akreditasi</small></div>}
        {drawer && <button className="xdraw" onClick={onTutup} aria-label="Tutup">✕</button>}
        {/* tombol ciutkan — tepi DALAM (pojok kanan-atas), menyatu dengan panel */}
        {!drawer && (
          <button className="ciutkan" onClick={onToggleCollapse} aria-label={collapsed ? 'Buka menu' : 'Ciutkan menu'}
            title={collapsed ? 'Buka menu' : 'Ciutkan menu'}>{collapsed ? '›' : '‹'}</button>
        )}
      </div>

      <nav className="nav">
        <Grup label="Mulai di sini" collapsed={collapsed} tutup={false}>
          <Item id="beranda" ikon={IKON.beranda} label="Beranda & Panduan" aktif={aktif} onPilih={onPilih} collapsed={collapsed} />
          <Item id="alur" ikon={IKON.alur} label="Alur Kerja (peta)" aktif={aktif} onPilih={onPilih} collapsed={collapsed} />
          <Item id="dashboard" ikon={IKON.dashboard} label="Dashboard" aktif={aktif} onPilih={onPilih} collapsed={collapsed} />
        </Grup>

        {tahapTampil.map((t) => {
          const tutup = !!(grupTutup && grupTutup[t.key]) && !collapsed;
          return (
            <Grup key={t.key} label={t.label} collapsed={collapsed} tutup={tutup} onToggle={() => onToggleGrup(t.key)} dapatTutup>
              {!tutup && t.items.map((m) => (
                <Item key={m.id} id={'modul-' + m.id} ikon={IKON[m.ikon] || '•'} label={m.nama}
                  badge={m._jml} lock={m.terkunci} aktif={aktif} onPilih={onPilih} collapsed={collapsed} />
              ))}
            </Grup>
          );
        })}

        {sisaGrup.map((g) => {
          const key = 'g_' + g;
          const tutup = !!(grupTutup && grupTutup[key]) && !collapsed;
          return (
            <Grup key={key} label={g} collapsed={collapsed} tutup={tutup} onToggle={() => onToggleGrup(key)} dapatTutup>
              {!tutup && sisa[g].map((m) => (
                <Item key={m.id} id={'modul-' + m.id} ikon={IKON[m.ikon] || '•'} label={m.nama}
                  badge={m._jml} lock={m.terkunci} aktif={aktif} onPilih={onPilih} collapsed={collapsed} />
              ))}
            </Grup>
          );
        })}

        {isSA && (
          <Grup label="Administrasi" collapsed={collapsed} tutup={false}>
            <Item id="admin" ikon={IKON.admin} label="Admin & Akses" aktif={aktif} onPilih={onPilih} collapsed={collapsed} />
          </Grup>
        )}
      </nav>

      {!collapsed && <div className="sfoot">v{(app && app.versiKode) || '2.1.0'} · tersambung ke Spreadsheet</div>}
    </aside>
  );
}

function Grup({ label, collapsed, tutup, onToggle, dapatTutup, children }) {
  if (collapsed) {
    return (<><div className="ng mini" title={label}>•</div>{children}</>);
  }
  return (
    <>
      <div className={'ng' + (dapatTutup ? ' klikng' : '')} onClick={dapatTutup ? onToggle : undefined}>
        {dapatTutup && <span className="chev">{tutup ? '▸' : '▾'}</span>}
        {label}
      </div>
      {children}
    </>
  );
}

function Item({ id, ikon, label, badge, lock, aktif, onPilih, collapsed }) {
  return (
    <div className={'ni' + (aktif === id ? ' act' : '')} onClick={() => onPilih(id)} title={collapsed ? label : ''}>
      <span className="ic">{ikon}</span>
      {!collapsed && <span className="ni-l">{lock ? '🔒 ' : ''}{label}</span>}
      {!collapsed && badge != null && <span className="bdg">{badge}</span>}
    </div>
  );
}
