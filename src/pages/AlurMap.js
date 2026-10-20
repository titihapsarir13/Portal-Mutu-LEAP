import React from 'react';

// Pemetaan modul ke 5 fase alur kerja
const FASE = [
  { no: '0', nama: 'Keputusan & Verifikasi', modul: ['tugas'] },
  { no: '1', nama: 'Perbaikan Naskah SPMI', modul: ['naskah', 'form'] },
  { no: '2', nama: 'Siklus Mutu Berjalan', modul: ['siklus', 'log'] },
  { no: '3', nama: 'Pengisian EDLK & EKLK', modul: ['edlk', 'dokumen', 'eklk_bim', 'eklk_ket'] },
  { no: '4', nama: 'Menuju Akreditasi', modul: ['proses'] }
];

// Kebutuhan (dokumen/bukti) tiap tahap besar. Masih template awal — dapat dipindah ke Sheet.
const KEBUTUHAN = [
  { tahap: 'Tahap 1 — Sistem Mutu (SPMI)', butir: ['Naskah SPMI (Bab I–V) tersusun', 'Daftar POS & formulir (kode S-xxx)', 'Review naskah selesai (status ACC)', 'Pengesahan SK Kepala Lembaga'] },
  { tahap: 'Tahap 2 — Siklus Mutu (PPEPP)', butir: ['Jadwal siklus PPEPP tahunan', 'Log bukti pelaksanaan tiap standar', 'Notulen rapat tinjauan mutu', 'Laporan Audit Mutu Internal (1×/tahun)'] },
  { tahap: 'Tahap 3 — Evaluasi Diri (EDLK)', butir: ['Instrumen EDLK terisi per komponen', 'Checklist dokumen pendukung lengkap', 'Skor mandiri & catatan perbaikan', 'Bukti unggah per butir'] },
  { tahap: 'Tahap 4 — EKLK → Akreditasi', butir: ['Instrumen EKLK terisi + bukti', 'Data lembaga & legalitas terkini', 'Rekap hasil EDLK & tindak lanjut', 'Berkas siap diajukan ke akreditasi'] }
];

export default function AlurMap({ modul, onPilih }) {
  const byId = {};
  modul.forEach((m) => { byId[m.id] = m; });

  return (
    <div className="body">
      <div className="bar bar-sync" style={{ marginBottom: 14 }}>
        <span>🔓 <b>Kunci urutan dibuka.</b> Urutan ideal tetap SPMI → EKLK → akreditasi, tetapi dokumen tiap tahap
          boleh disiapkan paralel — tidak harus menunggu SPMI selesai.</span>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">Alur kerja garis besar <span className="mt">klik kotak untuk membuka modulnya</span></div>
        <div className="pb">
          <div className="map">
            {FASE.map((f, i) => (
              <React.Fragment key={f.no}>
                <div className="fase">
                  <div className="fase-h"><span className="fase-no">{f.no}</span> {f.nama}</div>
                  <div className="fase-nodes">
                    {f.modul.map((id) => {
                      const m = byId[id];
                      if (!m) return null;
                      const pr = m.progres || { pct: 0, pctAda: 0, selesai: 0, berjalan: 0, total: 0 };
                      const pct = pr.pct || 0;
                      const pctAda = pr.pctAda != null ? pr.pctAda : pct;
                      const warna = pct >= 80 ? 'n-g' : pctAda >= 40 ? 'n-a' : 'n-r';
                      const wDone = pr.total ? Math.round(pr.selesai / pr.total * 100) : 0;
                      const wProg = pr.total ? Math.round(pr.berjalan / pr.total * 100) : 0;
                      return (
                        <button key={id} className={'node ' + warna}
                          onClick={() => onPilih('modul-' + id)} title={'Buka ' + m.nama}>
                          <div className="node-nama">{m.nama}</div>
                          <div className="node-bar"><span className="nb done" style={{ width: wDone + '%' }} /><span className="nb prog" style={{ width: wProg + '%' }} /></div>
                          <div className="node-pct">{pct}% selesai{pr.berjalan ? ` · ${pr.berjalan} berjalan` : ''} · {pr.selesai}/{pr.total}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {i < FASE.length - 1 && <div className="panah">▶</div>}
              </React.Fragment>
            ))}
          </div>
          <div className="map-ket">
            <span><i className="dotn n-g" /> ≥80% siap</span>
            <span><i className="dotn n-a" /> 40–79%</span>
            <span><i className="dotn n-r" /> &lt;40%</span>
            <span>🔓 semua tahap terbuka — bisa dikerjakan paralel</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="ph">Kebutuhan tiap tahap <span className="mt">dokumen/bukti yang perlu disiapkan</span></div>
        <div className="pb">
          <div className="kebutuhan-grid">
            {KEBUTUHAN.map((k) => (
              <div className="kebutuhan-card" key={k.tahap}>
                <div className="kebutuhan-h">{k.tahap}</div>
                <ul className="kebutuhan-list">
                  {k.butir.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="bar bar-info" style={{ marginTop: 12 }}>
            <span>Daftar kebutuhan ini masih <b>template awal</b> — akan disesuaikan dengan instrumen EKLK &amp; peraturan,
              dan dapat dipindah ke Sheet agar bisa dicentang statusnya.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
