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
  acc: { teks: 'Sudah ACC', cls: 'v-g' },
  proses: { teks: 'Dalam proses', cls: 'v-a' },
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
      <div className="ss-scroll">
        <table className="ss-table">
          <colgroup><col className="ss-c-bab" /><col /><col className="ss-c-pic" /></colgroup>
          <thead><tr><th>BAB</th><th>CATATAN / REVIEW &amp; STATUS</th><th>PIC</th></tr></thead>
          <tbody>
            {tampil.map((b) => {
              const v = VONIS[b.verdict] || VONIS.kosong;
              const chips = b.verdict === 'acc' || b.verdict === 'kosong' ? [] : [
                ['ACC', b.acc, 'c-g'], ['Perlu revisi', b.revisi, 'c-r'], ['Perlu diskusi', b.diskusi, 'c-d'],
                ['Menunggu persetujuan', b.menunggu, 'c-w'], ['', b.belum, 'c-m']
              ].filter(([, n]) => n > 0);
              const adaKomentar = b.komentar.length > 0;
              return <tr key={b.key}>
                <td className="ss-bab-cell">
                  <div className="ss-bab-inner">
                    <span className="ss-bab" role="link" tabIndex={0} onClick={() => onPilih(routeSpmi(b.key))}
                      onKeyDown={(e) => { if (e.key === 'Enter') onPilih(routeSpmi(b.key)); }}>{b.label}</span>
                    <div className="ss-pills">
                      <span className={'ss-verdict ' + v.cls}>{b.verdict === 'kosong' ? '—' : v.teks}</span>
                      {b.total > 0 && <span className="ss-pill-sub">{b.acc}/{b.total} ACC</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {/* Status BAB + aksi di baris paling atas */}
                  <div className="ss-statusrow">
                    <span className="ss-sr-l">STATUS BAB</span>
                    <span className={'ss-verdict ' + v.cls}>{b.verdict === 'kosong' ? '—' : v.teks}</span>
                    {chips.map(([status, n, cls]) =>
                      <span key={status || 'belum'} className={'ss-chip ' + cls} role="link" tabIndex={0}
                        onClick={() => onPilih(routeSpmiFilter(b.key, status))}
                        onKeyDown={(e) => { if (e.key === 'Enter') onPilih(routeSpmiFilter(b.key, status)); }}
                        title="Buka naskah BAB ini dengan filter status">
                        {n} {(TAG[status] || {}).teks}</span>)}
                    <button className="ss-open" onClick={() => onPilih(routeSpmi(b.key))}>Tinjau di naskah →</button>
                  </div>

                  {/* Komentar nyata */}
                  {adaKomentar && <div className="ss-cmts">
                    {b.komentar.map((k, i) => {
                      const t = TAG[k.status] || TAG[''];
                      return <div className="ss-cmt" key={i}>
                        <span className="ss-cmt-i">💬</span>
                        <div className="ss-cmt-b">
                          {k.sub && <span className="ss-cmt-sub" role="link" tabIndex={0}
                            onClick={() => onPilih(routeSpmi(k.subKey))}
                            onKeyDown={(e) => { if (e.key === 'Enter') onPilih(routeSpmi(k.subKey)); }}>{k.sub}</span>}
                          <span className={'ss-tag ' + t.cls}>{t.teks}</span>
                          <div className="ss-cmt-t">{k.text}</div>
                          <span className="ss-who">{k.docs ? ('👤 ' + (k.author || 'Komentar') + ' · Google Docs') : '✎ Catatan tim'}{k.count > 1 ? ` · ${k.count} bagian` : ''}</span>
                        </div>
                      </div>;
                    })}
                  </div>}

                  {/* Catatan sistem yang berulang — diringkas */}
                  {b.sistem.map((s, i) => (
                    <div className="ss-sysnote" key={'s' + i}>
                      <span className="ss-sys-i">ℹ️</span>
                      <span><b>{s.count} bagian</b> — {s.text}</span>
                    </div>
                  ))}

                  {!adaKomentar && b.sistem.length === 0 &&
                    <div className="ss-empty">{b.verdict === 'acc' ? 'Semua bagian sudah ACC — tidak ada catatan terbuka.' : 'Belum ada komentar review pada BAB ini.'}</div>}
                </td>
                <td className="ss-pic">—</td>
              </tr>;
            })}
            {!tampil.length && <tr><td colSpan={3} className="kosong">{!spmi.data ? 'Naskah belum dimuat.' : 'Tidak ada BAB sesuai saringan.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <p className="ss-legend">💬 komentar nyata (perlu ditindak) · ℹ️ catatan sistem/pemetaan (diringkas). Klik judul BAB/subbab → buka naskah · chip status → buka naskah dengan filter.</p>
  </div>;
}
