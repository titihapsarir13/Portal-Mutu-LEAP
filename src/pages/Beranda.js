import React from 'react';

// Halaman awal: panduan ringkas alur + penjelasan beda modul (poin 13).
export default function Beranda({ app, me, onPilih }) {
  const go = onPilih || (() => {});
  const nama = (me && (me.nama || me.divisi)) || '';

  return (
    <div className="body">
      <div className="hero">
        <div className="hero-t">Selamat datang{nama ? ', ' + nama : ''} 👋</div>
        <div className="hero-s">
          Portal ini membantu LEAP menyiapkan mutu secara berurutan: <b>susun dokumen SPMI</b> →
          jalankan <b>siklus PPEPP</b> → isi <b>Evaluasi Diri (EDLK)</b> → ajukan <b>EKLK</b> → menuju akreditasi.
        </div>
        <div className="hero-btns">
          <button className="btn pri" onClick={() => go('alur')}>🗺️ Lihat peta alur</button>
          <button className="btn" onClick={() => go('dashboard')}>▦ Buka Dashboard</button>
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

      <div className="row2">
        <div className="panel">
          <div className="ph">✎ Revisi Naskah SPMI <span className="mt klik" onClick={() => go('modul-naskah')}>buka →</span></div>
          <div className="pb">
            <p className="expl">Di sini Anda <b>memperbaiki isi tulisan naskah</b> (bab per bab): temuan, revisi yang diperlukan,
              dan status perbaikannya. Jawabannya berupa <b>kalimat/paragraf</b> yang akan masuk ke dokumen SPMI.</p>
          </div>
        </div>
        <div className="panel">
          <div className="ph">▤ Registri Form &amp; POS <span className="mt klik" onClick={() => go('modul-form')}>buka →</span></div>
          <div className="pb">
            <p className="expl">Di sini Anda <b>menata formulir &amp; POS</b> (lampiran naskah): tentukan kode final,
              apa yang perlu direvisi, ketersediaan, dan tautan dokumennya — <b>bukan</b> mengubah tulisan naskah.</p>
          </div>
        </div>
      </div>

      <div className="bar bar-info" style={{ marginTop: 14 }}>
        <span>💡 Tip: pilih <b>menu utama di atas</b> untuk berpindah tahap. Rincian menu tampil di kiri; klik tombol <b>‹</b> untuk menutup panel atau <b>▥</b> untuk membukanya kembali.</span>
      </div>
    </div>
  );
}
