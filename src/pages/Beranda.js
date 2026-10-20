import React from 'react';

// Langkah audit mutu internal (bagian Evaluasi & Pengendalian pada siklus PPEPP).
const AUDIT = [
  { n: 1, t: 'Perencanaan Audit', d: 'Susun jadwal & objek audit, tetapkan auditor internal, siapkan instrumen audit.' },
  { n: 2, t: 'Pelaksanaan Audit', d: 'Pemeriksaan dokumen, observasi lapangan, dan wawancara terhadap seluruh standar.' },
  { n: 3, t: 'Temuan Audit', d: 'Identifikasi ketidaksesuaian (ringan/sedang/berat) & peluang peningkatan, didokumentasikan.' },
  { n: 4, t: 'Tindak Lanjut', d: 'Rekomendasi perbaikan (korektif/preventif), pelaksanaan, lalu monitoring efektivitasnya.' }
];

// Timeline DUMMY — contoh; nanti diisi tanggal nyata dari rencana kerja LEAP.
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const TIMELINE = [
  { nama: '1. Sistem Mutu (SPMI)', dari: 0, sampai: 2, warna: 'g' },
  { nama: '2. Siklus Mutu (PPEPP)', dari: 2, sampai: 7, warna: 'b' },
  { nama: '3. Evaluasi Diri (EDLK)', dari: 5, sampai: 6, warna: 'a' },
  { nama: '4. EKLK', dari: 7, sampai: 8, warna: 'b' },
  { nama: 'Audit Mutu Internal', dari: 9, sampai: 9, warna: 'a' },
  { nama: '5. Menuju Akreditasi', dari: 10, sampai: 11, warna: 'b' }
];

export default function Beranda({ app, me, onPilih }) {
  const go = onPilih || (() => {});
  const nama = (me && (me.nama || me.divisi)) || '';

  return (
    <div className="body panduan">
      <div className="hero">
        <div className="hero-t">Selamat datang{nama ? ', ' + nama : ''} 👋</div>
        <div className="hero-s">
          Portal ini membantu LEAP menyiapkan mutu: <b>susun dokumen SPMI</b> → jalankan <b>siklus PPEPP</b> →
          isi <b>Evaluasi Diri (EDLK)</b> → ajukan <b>EKLK</b> → menuju <b>akreditasi</b>.
          Dokumen tiap tahap boleh disiapkan paralel (kunci urutan dibuka).
        </div>
        <div className="hero-btns">
          <button className="btn pri" onClick={() => go('alur')}>🗺️ Lihat peta alur</button>
          <button className="btn" onClick={() => go('dashboard')}>📊 Buka Dashboard</button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">Alur besar — mulai dari mana?</div>
        <div className="pb">
          <ol className="steps">
            <li><b>Tahap 1 — Sistem Mutu (SPMI).</b> Rapikan naskah SPMI dan daftar formulir/POS-nya. Inilah <b>syarat</b> sebelum mengajukan EKLK.</li>
            <li><b>Tahap 2 — Siklus Mutu.</b> Jalankan kegiatan PPEPP dan catat buktinya (Log Bukti).</li>
            <li><b>Tahap 3 — Evaluasi Diri.</b> Nilai kesiapan per komponen (EDLK) dan lengkapi checklist dokumen.</li>
            <li><b>Tahap 4 — EKLK.</b> Isi instrumen, lalu ikuti proses EKLK hingga hasil — gerbang menuju akreditasi.</li>
          </ol>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">Alur Audit Mutu Internal <span className="ph-tag">min. 1×/tahun</span></div>
        <div className="pb">
          <div className="audit-flow">
            {AUDIT.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="audit-step">
                  <span className="audit-n">{s.n}</span>
                  <div className="audit-t">{s.t}</div>
                  <div className="audit-d">{s.d}</div>
                </div>
                {i < AUDIT.length - 1 && <div className="audit-arrow">▶</div>}
              </React.Fragment>
            ))}
          </div>
          <div className="bar bar-info" style={{ marginTop: 12 }}>
            <span>Audit internal adalah bagian <b>Evaluasi &amp; Pengendalian</b> dalam siklus <b>PPEPP</b>
              (Penetapan → Pelaksanaan → Evaluasi → Pengendalian → Peningkatan). Acuan: POS Audit Mutu Internal
              pada Naskah SPMI &amp; Permendikdasmen No. 24/2025.</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">Timeline pengerjaan <span className="ph-dummy">DUMMY — contoh</span></div>
        <div className="pb">
          <div className="tl-wrap">
            <table className="tl">
              <thead><tr><th className="tl-lbl">Tahap</th>{BULAN.map((m) => <th key={m}>{m}</th>)}</tr></thead>
              <tbody>
                {TIMELINE.map((r) => (
                  <tr key={r.nama}>
                    <td className="tl-lbl">{r.nama}</td>
                    {BULAN.map((m, i) => (
                      <td key={m}>{i >= r.dari && i <= r.sampai ? <span className={'tl-bar ' + r.warna} /> : null}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bar bar-info" style={{ marginTop: 10 }}>
            <span>Timeline ini masih <b>contoh/dummy</b>. Nanti diisi tanggal nyata dari rencana kerja LEAP.</span>
          </div>
        </div>
      </div>

      <div className="bar bar-info">
        <span>💡 Tip: pilih <b>menu utama di atas</b> untuk berpindah tahap. Rincian menu tampil di kiri; klik tombol <b>‹</b> untuk menutup panel atau <b>▥</b> untuk membukanya kembali.</span>
      </div>
    </div>
  );
}
