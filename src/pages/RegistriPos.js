import React, { useMemo, useState } from 'react';
import { api } from '../api';
import { pastikanUrl, jenisTautan, warnaBadge } from '../utils/format';

// Registri Form & POS — tampilan per POS (poin 12).
// Ringkasan status semua POS + info POS dari naskah (baca-saja) + lampiran yang diisi tim.
export default function RegistriPos({ modul, moddata, opsi, me, appCfg, bolehEdit, registriPos, onPatch, onToast }) {
  const baris = useMemo(() => (moddata && moddata.baris) || [], [moddata]);
  const posList = useMemo(() => (registriPos && registriPos.posList) || [], [registriPos]);
  const [aktif, setAktif] = useState(() => {
    const perlu = posList.find((p) => p.belum > 0 || (p.lampiranKurang && p.lampiranKurang.length));
    return (perlu || posList[0] || {}).key || '';
  });
  const [simpan, setSimpan] = useState({});
  const [draftSibuk, setDraftSibuk] = useState(false);

  const posAktif = posList.find((p) => p.key === aktif) || posList[0];
  const barisPos = useMemo(() => {
    if (!posAktif) return [];
    return baris.filter((b) => String(b.c[2] || 'Lainnya').trim() === posAktif.pos);
  }, [baris, posAktif]);

  const bisaEdit = bolehEdit && !modul.bacaSaja;

  async function simpanSel(b, kol, nilai) {
    const key = b.id + ':' + kol; const lama = b.c[kol];
    onPatch(modul.id, b.id, kol, nilai);
    setSimpan((s) => ({ ...s, [key]: 'simpan' }));
    try {
      const r = await api.update({ modulId: modul.id, id: b.id, row: b.row, kolom: kol, nilai, pengguna: me.nama });
      if (r && r.ok) {
        onPatch(modul.id, b.id, kol, r.data.nilai);
        setSimpan((s) => ({ ...s, [key]: 'ok' }));
        setTimeout(() => setSimpan((s) => { const n = { ...s }; delete n[key]; return n; }), 1500);
      } else { onPatch(modul.id, b.id, kol, lama); setSimpan((s) => ({ ...s, [key]: 'err' })); onToast((r && r.message) || 'Gagal menyimpan.', 'err'); }
    } catch (e) { onPatch(modul.id, b.id, kol, lama); setSimpan((s) => ({ ...s, [key]: 'err' })); onToast(e.message, 'err'); }
  }

  async function perbaruiDraft() {
    setDraftSibuk(true);
    try {
      const r = await api.perbaruiDraft({ pengguna: me.nama });
      if (r && r.ok) { onToast('Draft lampiran diperbarui (' + r.data.jumlahPos + ' POS).', 'ok'); if (r.data.url) window.open(r.data.url, '_blank', 'noopener'); }
      else onToast((r && r.message) || 'Gagal memperbarui draft.', 'err');
    } catch (e) { onToast(e.message, 'err'); }
    setDraftSibuk(false);
  }

  if (!posList.length) {
    return <div className="body"><div className="kosong">Belum ada data POS. Pastikan sheet “6 Registri Form dan POS” terisi.</div></div>;
  }

  return (
    <div className="body">
      <div className="bar bar-info">
        📌 Di sini Anda <b>menata formulir/POS</b> (lampiran naskah): kode final, <b>yang perlu direvisi</b>, ketersediaan, dan tautan.
        Untuk memperbaiki <b>isi tulisan naskah</b>, buka menu <b>Revisi Naskah SPMI</b>.
      </div>
      <div className="bar bar-sync">
        🔄 <b>Sinkron:</b> setiap isian tersimpan otomatis ke spreadsheet (per sel). Draft Naskah (Google Doc) diperbarui saat tombol
        <b> Perbarui Draft</b> ditekan. Info POS mengikuti Naskah SPMI (baca-saja).
        {bolehEdit && (
          <span className="sync-act">
            <button className="btn pri" disabled={draftSibuk} onClick={perbaruiDraft}>{draftSibuk ? 'Memperbarui…' : '📄 Perbarui Draft Naskah'}</button>
            {appCfg && appCfg.draftDocUrl && <a className="btn" href={appCfg.draftDocUrl} target="_blank" rel="noopener noreferrer">Buka draft</a>}
          </span>
        )}
      </div>

      {/* Status semua POS */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="ph">Status semua POS <span className="mt">klik untuk membuka detail</span></div>
        <div className="pb">
          <div className="posgrid">
            {posList.map((p) => {
              const flag = p.lampiranKurang && p.lampiranKurang.length ? { c: 'r', t: 'lampiran ' + p.lampiranKurang.length }
                : p.belum > 0 ? { c: 'r', t: 'belum ' + p.belum }
                : p.berjalan > 0 ? { c: 'a', t: 'berjalan ' + p.berjalan }
                : { c: 'g', t: 'lengkap' };
              const w = (n) => (p.total ? Math.round(n / p.total * 100) : 0);
              return (
                <button key={p.key} className={'pc' + (posAktif && p.key === posAktif.key ? ' act' : '')} onClick={() => setAktif(p.key)}>
                  <div className="pc-nm">{p.pos}<span className={'flag ' + flag.c}>{flag.t}</span></div>
                  <div className="mbar">
                    <span className="s done" style={{ width: w(p.selesai) + '%' }} />
                    <span className="s prog" style={{ width: w(p.berjalan) + '%' }} />
                  </div>
                  <div className="pc-sub">{p.selesai} selesai · {p.berjalan} berjalan · {p.belum} belum</div>
                </button>
              );
            })}
          </div>
          <div className="leg">
            <span><i className="dot d-done" />Selesai</span>
            <span><i className="dot d-prog" />Berjalan (sudah diisi)</span>
            <span><i className="dot d-none" />Belum</span>
          </div>
        </div>
      </div>

      {posAktif && (
        <>
          {/* Info POS dari naskah (baca-saja) */}
          <div className="panel" style={{ marginBottom: 14 }}>
            <div className="ph">{posAktif.pos} <span className="mt">INFO NASKAH · BACA-SAJA</span></div>
            <div className="pb">
              {posAktif.info ? (
                <div className="grid2">
                  <Field k="Definisi" v={posAktif.info.definisi} />
                  <Field k="Tujuan" v={posAktif.info.tujuan} />
                  <Field k="Pihak yang Bertanggung Jawab" pills={posAktif.info.pihak} />
                  <Field k="Ruang Lingkup" v={posAktif.info.ruang} />
                  <Field k="Indikator Mutu" pills={posAktif.info.indikator} />
                  <Field k="Prosedur (ringkas)" v={posAktif.info.prosedur} />
                </div>
              ) : (
                <div className="kosong">Info POS ini belum ada di naskah (sheet <b>POS_Info</b>). Tabel lampiran di bawah tetap bisa diisi.</div>
              )}
            </div>
          </div>

          {/* Harus ada di lampiran */}
          {posAktif.lampiranKurang && posAktif.lampiranKurang.length > 0 && (
            <div className="warn">
              <div className="wh">⚠ Harus ada di lampiran — disebut di naskah tapi belum terdaftar di registri POS ini</div>
              {posAktif.lampiranKurang.map((f, i) => (
                <div key={i} className="wrow"><span className="wnm">{f}</span>
                  <span className="wsrc">daftarkan formulir ini pada baris POS di spreadsheet agar lampiran lengkap</span></div>
              ))}
            </div>
          )}

          {/* Lampiran — diisi tim */}
          <div className="panel">
            <div className="ph">Lampiran — Formulir {posAktif.pos} <span className="mt">BAGIAN YANG DIISI TIM</span></div>
            <div className="pb pb0">
              <div className="tbl-wrap tbl-pos">
                <table>
                  <thead><tr>
                    <th style={{ minWidth: 220 }}>Nama form (naskah)</th>
                    <th style={{ minWidth: 110 }}>Kode final</th>
                    <th style={{ minWidth: 150 }}>Yang perlu direvisi</th>
                    <th style={{ minWidth: 150 }}>Nama file</th>
                    <th style={{ minWidth: 90 }}>Link</th>
                    <th style={{ minWidth: 150 }}>Ketersediaan</th>
                    <th style={{ minWidth: 120 }}>PIC</th>
                  </tr></thead>
                  <tbody>
                    {barisPos.map((b) => (
                      <tr key={b.id + '_' + b.row}>
                        <td className="tnama">{b.c[5] || '—'}</td>
                        <td><Cell b={b} kol={13} tipe="text" ro={!bisaEdit} st={simpan[b.id + ':13']} onSave={simpanSel} /></td>
                        <td><Cell b={b} kol={17} tipe="select" opsi={opsi.yangDirevisi} ro={!bisaEdit} st={simpan[b.id + ':17']} onSave={simpanSel} /></td>
                        <td><Cell b={b} kol={18} tipe="text" ro={!bisaEdit} st={simpan[b.id + ':18']} onSave={simpanSel} /></td>
                        <td><Cell b={b} kol={15} tipe="url" ro={!bisaEdit} st={simpan[b.id + ':15']} onSave={simpanSel} /></td>
                        <td><Cell b={b} kol={14} tipe="select" opsi={opsi.ketersediaan} ro={!bisaEdit} st={simpan[b.id + ':14']} onSave={simpanSel} /></td>
                        <td><Cell b={b} kol={11} tipe="text" ro={!bisaEdit} st={simpan[b.id + ':11']} onSave={simpanSel} /></td>
                      </tr>
                    ))}
                    {!barisPos.length && <tr><td colSpan={7} className="kosong">Tidak ada form terdaftar untuk POS ini.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="tbl-note">Kolom <b>Link</b>: ikon menyesuaikan jenis (📕 PDF · 📄 Word · 📊 Sheet · 🔗 web); diklik → dokumen terbuka.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ k, v, pills }) {
  return (
    <div className="f">
      <div className="fk">{k}</div>
      {pills ? <div className="fv">{pills.map((p, i) => <span key={i} className="pill">{p}</span>)}</div>
        : <div className="fv">{v || '—'}</div>}
    </div>
  );
}

function Cell({ b, kol, tipe, opsi, ro, st, onSave }) {
  const [v, setV] = useState(b.c[kol] == null ? '' : String(b.c[kol]));
  React.useEffect(() => { setV(b.c[kol] == null ? '' : String(b.c[kol])); }, [b.c, kol]);

  const mark = st === 'simpan' ? <span className="sv saving">⟳</span>
    : st === 'ok' ? <span className="sv ok">✓</span> : st === 'err' ? <span className="sv err">!</span> : null;

  if (ro) {
    const val = b.c[kol];
    if (tipe === 'url') { const u = pastikanUrl(val); const inf = u && jenisTautan(u); return inf ? <a className="tautan" href={u} target="_blank" rel="noopener noreferrer">{inf.ikon} Buka</a> : <span className="kos">—</span>; }
    if (tipe === 'select' && val) { const badge = warnaBadge(val, opsi); return badge ? <span className="chip2" style={{ background: badge.bg, color: badge.fg }}>{String(val)}</span> : <span>{String(val)}</span>; }
    return <span className="trunc">{val == null || val === '' ? '—' : String(val)}</span>;
  }

  if (tipe === 'select') {
    return <span className="ed"><select className="ycell" value={v} onChange={(e) => { setV(e.target.value); onSave(b, kol, e.target.value); }}>
      <option value=""></option>{(opsi || []).map((o, i) => <option key={i} value={o.nilai}>{o.nilai}</option>)}</select>{mark}</span>;
  }
  const buka = tipe === 'url' && pastikanUrl(v) && jenisTautan(pastikanUrl(v));
  return (
    <span className="ed">
      <input className="ycell" type="text" value={v} placeholder={tipe === 'url' ? 'Tautan…' : ''}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== String(b.c[kol] == null ? '' : b.c[kol])) onSave(b, kol, v); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
      {buka && <a className="buka-ln" href={pastikanUrl(v)} target="_blank" rel="noopener noreferrer" title="Buka tautan">{buka.ikon}</a>}
      {mark}
    </span>
  );
}
