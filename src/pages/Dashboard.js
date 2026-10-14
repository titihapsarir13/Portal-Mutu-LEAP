import React from 'react';

export default function Dashboard({ data }) {
  const d = (data && data.dashboard) || {};
  const fase = d.fase || [];
  const standar = d.standar || [];
  const eklk = d.eklk || [];
  const dok = d.dokumen || { verif: 0, total: 0 };

  return (
    <div className="body">
      <div className="kpis">
        <Kpi l="Total tugas" v={d.totalTugas != null ? d.totalTugas : '-'} dd="lintas divisi" />
        <Kpi l="Progres keseluruhan" v={(d.pctKeseluruhan != null ? d.pctKeseluruhan : 0) + '%'} dd="tugas selesai" />
        <Kpi l="Dokumen terverifikasi" v={<span>{dok.verif}<small className="den">/{dok.total}</small></span>} dd="bukti divalidasi" />
        <Kpi l="Simulasi EKLK (10A)" v={eklk[0] ? (eklk[0].terisi ? eklk[0].nilai : '—') : '-'}
          dd={eklk[0] ? <Badge t={eklk[0].kategori} /> : ''} />
      </div>

      <div className="row2">
        <Panel judul="Progres per fase alur kerja" kanan="% tugas selesai">
          {fase.length ? fase.map((f, i) => (
            <Bar key={i} nama={f.nama} pct={f.pct} />
          )) : <Kosong />}
        </Panel>
        <Panel judul="Simulasi nilai EKLK" kanan="nonresmi">
          {eklk.map((e, i) => (
            <div className="mini" key={i}>
              <span>{e.nama}</span>
              <b>{e.terisi ? e.nilai.toFixed(2).replace('.', ',') : '—'} <Badge t={e.kategori} /></b>
            </div>
          ))}
          <div className="mini"><span>Kecakapan hidup (10C)</span><b>— <Badge t="kerangka" /></b></div>
        </Panel>
      </div>

      <div className="row2" style={{ marginTop: 14 }}>
        <Panel judul="Kesiapan bukti per standar">
          {standar.length ? standar.map((s, i) => (
            <Bar key={i} nama={s.nama} pct={s.pct} />
          )) : <Kosong />}
        </Panel>
        <Panel judul="Dokumen & bukti">
          <div className="mini"><span>Dokumen terverifikasi memadai</span><b>{dok.verif} dari {dok.total}</b></div>
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ l, v, dd }) {
  return <div className="kpi"><div className="l">{l}</div><div className="v">{v}</div><div className="d">{dd}</div></div>;
}
function Panel({ judul, kanan, children }) {
  return <div className="panel"><div className="ph">{judul}{kanan && <span className="mt">{kanan}</span>}</div><div className="pb">{children}</div></div>;
}
function Bar({ nama, pct }) {
  return (
    <div className="prow"><div className="nm">{nama}</div>
      <div className="bar"><i style={{ width: Math.max(0, Math.min(100, pct)) + '%' }} /></div>
      <div className="pc">{pct}%</div></div>
  );
}
function Kosong() { return <div className="kosong">Belum ada data.</div>; }
function Badge({ t }) {
  if (!t || t === '-') return null;
  const cls = t === 'A' ? 'c-g' : t === 'B' ? 'c-a' : t === 'C' ? 'c-r' : 'c-m';
  return <span className={'chip ' + cls}>{t}</span>;
}
