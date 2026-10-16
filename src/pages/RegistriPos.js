import React, { useMemo, useState } from 'react';
import { api } from '../api';
import { pastikanUrl, jenisTautan, warnaBadge } from '../utils/format';

// Registri Form & POS — tampilan per POS (poin 12).
// Ringkasan status semua POS + info POS dari naskah (baca-saja) + lampiran yang diisi tim.
export default function RegistriPos({ modul, moddata, opsi, me, appCfg, bolehEdit, registriPos, onPatch, onToast, onRefresh }) {
  const baris = useMemo(() => (moddata && moddata.baris) || [], [moddata]);
  const posList = useMemo(() => ((registriPos && registriPos.posList) || []).map((p) => {
    const rows = baris.filter((b) => String(b.c[2] || '').trim() === p.pos);
    const counts = { selesai: 0, berjalan: 0, belum: 0, revisi: 0 };
    rows.forEach((b) => { counts[statusForm(b.c[14])]++; if (b.c[17] && String(b.c[17]).toLowerCase() !== 'sudah sesuai') counts.revisi++; });
    return { ...p, ...counts, total: rows.length };
  }), [registriPos, baris]);
  const [aktif, setAktif] = useState(() => {
    const perlu = posList.find((p) => p.belum > 0 || (p.lampiranKurang && p.lampiranKurang.length));
    return (perlu || posList[0] || {}).key || '';
  });
  const [simpan, setSimpan] = useState({});
  const [draftSibuk, setDraftSibuk] = useState(false);
  const [sinkronSibuk, setSinkronSibuk] = useState(false);

  async function sinkronSumber() {
    setSinkronSibuk(true);
    try {
      const r = await api.sinkronLinkForm({ pengguna: me.nama });
      if (!r || !r.ok) throw new Error((r && r.message) || 'Sinkronisasi gagal.');
      if (onRefresh) await onRefresh();
      onToast(r.data.bertautan + ' formulir memiliki tautan sumber; ' + r.data.diperbarui + ' diperbarui.', 'ok');
    } catch (e) { onToast(e.message, 'err'); }
    finally { setSinkronSibuk(false); }
  }

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
    return <div className="body registri-pos"><div className="kosong">Belum ada data POS. Pastikan sheet “6 Registri Form dan POS” terisi.</div></div>;
  }

  return (
    <div className="body registri-pos">
      <div className="pos-intro"><h2>Registri Form &amp; POS</h2><p>Ringkasan status dan lampiran per POS. Pilih kartu untuk membuka detailnya.</p></div>
      <div className="bar bar-info">
        📌 Di sini Anda <b>menata formulir/POS</b> (lampiran naskah): kode final, <b>yang perlu direvisi</b>, ketersediaan, dan tautan.
        Untuk memperbaiki <b>isi tulisan naskah</b>, buka menu <b>Revisi Naskah SPMI</b>.
      </div>
      <div className="bar bar-sync">
        🔄 <b>Sinkron:</b> setiap isian tersimpan otomatis ke spreadsheet (per sel). Draft Naskah (Google Doc) diperbarui saat tombol
        <b> Perbarui Draft</b> ditekan. Info POS mengikuti Naskah SPMI (baca-saja).
        {bolehEdit && (
          <span className="sync-act">
            <button className="btn" disabled={sinkronSibuk || draftSibuk} onClick={sinkronSumber}>{sinkronSibuk ? 'Menyinkronkan…' : 'Sinkron LINK FORM'}</button>
            <button className="btn pri" disabled={draftSibuk || sinkronSibuk} onClick={perbaruiDraft}>{draftSibuk ? 'Memperbarui…' : '📄 Perbarui Draft Naskah'}</button>
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
              const flag = p.revisi > 0 ? { c: 'a', t: 'revisi ' + p.revisi }
                : p.belum > 0 ? { c: 'r', t: 'belum ' + p.belum }
                : p.berjalan > 0 ? { c: 'a', t: 'berjalan ' + p.berjalan }
                : { c: 'g', t: 'lengkap' };
              const w = (n) => (p.total ? Math.round(n / p.total * 100) : 0);
              return (
                <button key={p.key} className={'pos-card' + (posAktif && p.key === posAktif.key ? ' act' : '')} onClick={() => setAktif(p.key)}>
                  <div className="pc-nm"><span className="pos-title">{judulKartu(p.pos)}</span><span className={'flag ' + flag.c}>{flag.t}</span></div>
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
                    <th style={{ minWidth: 170 }}>Detail file</th>
                    <th style={{ minWidth: 200 }}>Link</th>
                    <th style={{ minWidth: 150 }}>Ketersediaan</th>
                    <th style={{ minWidth: 120 }}>PIC</th>
                  </tr></thead>
                  <tbody>
                    {barisPos.map((b) => (
                      <tr key={b.id + '_' + b.row}>
                        <td className="tnama">{b.c[5] || '—'}</td>
                        <td><Cell b={b} kol={13} tipe="text" ro={!bisaEdit} st={simpan[b.id + ':13']} onSave={simpanSel} />
                          {!b.c[13] && <small className="source-caption">Kode sumber: {kodeSumber(b)}</small>}</td>
                        <td><Cell b={b} kol={17} tipe="select" opsi={opsi.yangDirevisi} ro={!bisaEdit} st={simpan[b.id + ':17']} onSave={simpanSel} /></td>
                        <td>{b.c[6] && <div className="source-name">{String(b.c[6])}</div>}
                          <Cell b={b} kol={18} tipe="text" ro={!bisaEdit} st={simpan[b.id + ':18']} onSave={simpanSel} />
                          {!b.c[18] && <small className="source-caption">Nama di atas dari LINK FORM; nama final belum ditetapkan.</small>}</td>
                        <td><DetailFile b={b} /></td>
                        <td><TautanFile b={b} />
                          {bisaEdit && <><Cell b={b} kol={15} tipe="url" ro={false} st={simpan[b.id + ':15']} onSave={simpanSel} /><small className="source-caption">Tautan final (opsional)</small></>}</td>
                        <td><Cell b={b} kol={14} tipe="select" opsi={opsi.ketersediaan} ro={!bisaEdit} st={simpan[b.id + ':14']} onSave={simpanSel} /></td>
                        <td><Cell b={b} kol={11} tipe="text" ro={!bisaEdit} st={simpan[b.id + ':11']} onSave={simpanSel} /></td>
                      </tr>
                    ))}
                    {!barisPos.length && <tr><td colSpan={8} className="kosong">Tidak ada form terdaftar untuk POS ini.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="tbl-note">Tautan final digunakan bila sudah diisi. Jika belum, web menampilkan tautan sumber dari LINK FORM. Adanya tautan tidak otomatis mengubah status verifikasi atau keputusan kode.</div>
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


function statusForm(nilai) {
  const v = String(nilai || '').toLowerCase().trim();
  if (!v || /^(belum|tidak|dipastikan belum)\b/.test(v)) return 'belum';
  if (/(perlu|revisi|sebagian|proses)/.test(v)) return 'berjalan';
  if (/(selesai|sesuai|memadai|terverifikasi)/.test(v)) return 'selesai';
  return 'berjalan';
}
function judulKartu(nama) {
  return String(nama).replace(/^(POS\s*\d+)\s+/, '$1 · ')
    .replace('Sumber Daya Manusia (PTK)', 'SDM (PTK)')
    .replace('Sarana dan Prasarana', 'Sarana')
    .replace('Penerimaan Peserta Didik Baru (PPDB)', 'PPDB')
    .replace('Pelaksanaan Pendidikan Kursus', 'Pendidikan Kursus')
    .replace('Pelaksanaan Pembelajaran', 'Pembelajaran')
    .replace('Pelaksanaan Ujian (Penilaian Hasil/Ketuntasan Belajar)', 'Ujian');
}
function kodeSumber(b) {
  return [b.c[4], b.c[3]].find((x) => x && String(x).trim() !== '-') || 'belum ada';
}
function linksFile(b, kol) {
  const links = b.links && b.links[kol];
  const value = String(b.c[kol] || '').trim();
  // Setelah edit lokal, daftar hyperlink lama dari server tidak lagi dipakai.
  const dariTeks = /^https?:\/\//i.test(value) ? [{ url: value, label: value }] : [];
  return (kol === 15 && dariTeks.length ? dariTeks : links || dariTeks)
    .filter((l) => /^https?:\/\//i.test(l.url));
}
function DetailFile({ b }) {
  const links = linksFile(b, 15).length ? linksFile(b, 15) : linksFile(b, 6);
  const jenis = [...new Set(links.map((l) => jenisTautan(l.url).label))];
  return <div className="source-detail">
    <span>{jenis.length ? jenis.join(' · ') : 'Jenis file belum diketahui'}</span>
    {b.c[7] && <details><summary>Catatan LINK FORM</summary><div>{String(b.c[7])}</div></details>}
  </div>;
}
function TautanFile({ b }) {
  const final = linksFile(b, 15), links = final.length ? final : linksFile(b, 6);
  if (!links.length) return <span className="kos">Belum ada tautan</span>;
  return <div className="source-links">
    {links.map((l, i) => <a key={l.url} className="tautan" href={l.url} target="_blank" rel="noopener noreferrer" title={l.label}>
      {jenisTautan(l.url).ikon} Buka{links.length > 1 ? ' ' + (i + 1) : ''}
    </a>)}
    <small className="source-caption">{final.length ? 'Tautan final' : 'Sumber LINK FORM'}</small>
  </div>;
}
