import React from 'react';

const IKON = {
  dashboard: '▦', tugas: '◧', naskah: '✎', form: '▤', siklus: '◷', log: '◉',
  edlk: '◩', dokumen: '▣', eklk: '◆', proses: '➚', ref: '§'
};

export default function Sidebar({ app, modul, aktif, onPilih, drawer, onTutup }) {
  const grup = {};
  modul.forEach((m) => { (grup[m.grup || 'Lainnya'] = grup[m.grup || 'Lainnya'] || []).push(m); });
  const urutGrup = ['Ringkasan', 'Pengisian', 'Referensi', 'Lainnya'].filter((g) => grup[g]);

  return (
    <aside className={'side' + (drawer ? ' drawer' : '')}>
      <div className="brand">
        <div className="logo">LM</div>
        <div><b>{(app && app.namaApp) || 'Portal Mutu LEAP'}</b><small>Checklist Akreditasi</small></div>
        {drawer && <button className="xdraw" onClick={onTutup} aria-label="Tutup">✕</button>}
      </div>
      <nav className="nav">
        <div className="ng">Ringkasan</div>
        <Item id="dashboard" ikon={IKON.dashboard} label="Dashboard" aktif={aktif} onPilih={onPilih} />
        {urutGrup.filter((g) => g !== 'Ringkasan').map((g) => (
          <React.Fragment key={g}>
            <div className="ng">{g}</div>
            {grup[g].map((m) => (
              <Item key={m.id} id={'modul-' + m.id} ikon={IKON[m.ikon] || '•'} label={m.nama}
                badge={m._jml} aktif={aktif} onPilih={onPilih} />
            ))}
          </React.Fragment>
        ))}
      </nav>
      <div className="sfoot">v{(app && app.versiKode) || '1.0.0'} · tersambung ke Spreadsheet</div>
    </aside>
  );
}

function Item({ id, ikon, label, badge, aktif, onPilih }) {
  return (
    <div className={'ni' + (aktif === id ? ' act' : '')} onClick={() => onPilih(id)}>
      <span className="ic">{ikon}</span> <span className="ni-l">{label}</span>
      {badge != null && <span className="bdg">{badge}</span>}
    </div>
  );
}
