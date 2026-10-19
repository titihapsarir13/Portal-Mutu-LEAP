import React, { useMemo, useState } from 'react';
import { rekapStatusBab, routeSpmi, routeSpmiFilter } from '../spmiModel';

// Label & warna untuk tiap status review.
const TAG = {
  '': { teks: 'belum ditinjau', cls: 'c-m' },
  'Perlu revisi': { teks: 'perlu revisi', cls: 'c-r' },
  'Perlu diskusi': { teks: 'perlu diskusi', cls: 'c-d' },
  'Menunggu persetujuan': { teks: 'menunggu persetujuan', cls: 'c-w' },
  'ACC': { teks: 'acc', cls: 'c-g' }
};
const VONIS = {
  acc: { teks: 'ACC', cls: 'v-g' },
  proses: { teks: 'Dalam Proses', cls: 'v-a' },
  belum: { teks: 'Belum ditinjau', cls: 'v-m' },
  kosong: { teks: '—', cls: 'v-m' }
};

export default function StatusSpmi({ spmi, tree, onPilih }) {
  const [saring, setSaring] = useState('semua');
  const rekap = useMemo(() => rekapStatusBab((spmi.data && spmi.data.rows) || [], tree), [spmi.data, tree]);
  const tampil = rekap.filter((b) =>
    saring === 'semua' ? true : saring === 'acc' ? b.verdict === 'acc' : (b.verdict === 'proses' || b.verdict === 'belum'));

  return <div className="body statusspmi">
    {!spmi.live && <div className="spmi-notice">Pratinjau. Hubungkan layanan penyimpanan untuk data terkini.</div>}
    {spmi.error && <div className="galat" role="alert">{spmi.error}<button className="btn" onClick={spmi.refresh}>Coba muat ulang</button></div>}

    <div className="ss-head">
      <div><h2>Status SPMI</h2><p>Ringkasan status review per BAB — untuk memilah bagian yang sudah/belum beres.</p></div>
      <div className="ss-loaded">
        <span><small>DATA TERAKHIR DIMUAT</small><time>{spmi.data && spmi.data.waktu ? new Date(spmi.data.waktu).toLocaleString('id-ID') : 'Belum dimuat'}</time></span>
        <button className="btn" disabled={!spmi.live || spmi.status === 'muat'} onClick={spmi.refresh}>↻ Muat ulang naskah</button>
      </div>
    </div>

    <div className="ss-filters"><span className="ss-filters-l">SARING</span>
      {[['semua', 'Semua'], ['perhatian', 'Perlu perhatian'], ['acc', 'Sudah ACC semua']].map(([k, l]) =>
        <button key={k} className={'ss-fl' + (saring === k ? ' on' : '')} aria-pressed={saring === k} onClick={() => setSaring(k)}>{l}</button>)}
    </div>

    <div className="panel ss-panel">
      <table className="ss-table">
        <thead><tr><th className="ss-c-bab">BAB</th><th className="ss-c-status">STATUS</th><th className="ss-c-pic">PIC</th><th>CATATAN / REVIEW</th></tr></thead>
        <tbody>
          {tampil.map((b) => {
            const v = VONIS[b.verdict] || VONIS.kosong;
            const chips = b.verdict === 'acc' || b.verdict === 'kosong' ? [] : [
              ['ACC', b.acc, 'c-g'], ['Perlu revisi', b.revisi, 'c-r'], ['Perlu diskusi', b.diskusi, 'c-d'],
              ['Menunggu persetujuan', b.menunggu, 'c-w'], ['', b.belum, 'c-m']
            ].filter(([, n]) => n > 0);
            return <tr key={b.key}>
              <td><span className="ss-bab" role="link" tabIndex={0} onClick={() => onPilih(routeSpmi(b.key))}
                onKeyDown={(e) => { if (e.key === 'Enter') onPilih(routeSpmi(b.key)); }}>{b.label}</span></td>
              <td>
                <span className={'ss-verdict ' + v.cls}>{b.verdict === 'kosong' ? '—' : `${v.teks} (${b.acc}/${b.total} bagian ACC)`}</span>
                {chips.length > 0 && <div className="ss-chips">{chips.map(([status, n, cls]) =>
                  <span key={status || 'belum'} className={'ss-chip ' + cls} role="link" tabIndex={0}
                    onClick={() => onPilih(routeSpmiFilter(b.key, status))}
                    onKeyDown={(e) => { if (e.key === 'Enter') onPilih(routeSpmiFilter(b.key, status)); }}>
                    {n} {(TAG[status] || {}).teks}</span>)}</div>}
              </td>
              <td className="ss-pic">—</td>
              <td>
                {b.grup.length === 0
                  ? <span className="ss-empty">{b.verdict === 'acc' ? 'Semua bagian sudah ACC — tidak ada catatan terbuka.' : 'Belum ada catatan review pada BAB ini.'}</span>
                  : <div className="ss-notes">{b.grup.map((g) => {
                    const t = TAG[g.tag] || TAG[''];
                    return <div key={g.key} className="ss-grp">
                      <span className="ss-src" role="link" tabIndex={0} onClick={() => onPilih(routeSpmi(g.key))}
                        onKeyDown={(e) => { if (e.key === 'Enter') onPilih(routeSpmi(g.key)); }}>{g.label}</span>
                      <span className={'ss-tag ' + t.cls}>{t.teks}</span>
                      {g.poin.length > 0
                        ? <ul className="ss-pts">{g.poin.flatMap((p, i) =>
                          String(p.text).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
                            .map((s, j) => <li key={i + '-' + j}>{s.replace(/^[-*•]\s*/, '')}</li>))}</ul>
                        : <div className="ss-nonote">Status ditandai, belum ada catatan tertulis.</div>}
                    </div>;
                  })}</div>}
              </td>
            </tr>;
          })}
          {!tampil.length && <tr><td colSpan={4} className="kosong">{!spmi.data ? 'Naskah belum dimuat.' : 'Tidak ada BAB sesuai saringan.'}</td></tr>}
        </tbody>
      </table>
    </div>
    <p className="ss-legend">Klik judul BAB → buka BAB di naskah · judul subbab → loncat ke subbab · chip status → buka naskah BAB itu dengan filter status otomatis.</p>
  </div>;
}
