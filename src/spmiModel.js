export const nodeKey = (path) => JSON.stringify(path);
export const routeSpmi = (key) => key === 'all' ? 'modul-naskah' : 'modul-naskah~' + encodeURIComponent(key);
export function selectedSpmi(hash) { try { return decodeURIComponent(hash.split('~')[1] || '') || 'all'; } catch (e) { return 'all'; } }
// Tautan ke Naskah SPMI dengan filter status otomatis (dipakai Status SPMI → klik chip).
export const routeSpmiFilter = (key, status) => routeSpmi(key) + '~' + encodeURIComponent(status || '');
export function filterDariHash(hash) {
  const parts = String(hash || '').split('~');
  if (parts.length < 3) return null; // tanpa filter
  try { const v = decodeURIComponent(parts[2]); return STATUS_REVIEW.includes(v) ? v : null; } catch (e) { return null; }
}
const norm = (s) => String(s || '').toLowerCase().replace(/^(?:[a-z]|\d+)[.)]\s*/, '').replace(/[^a-z0-9]/g, '');
const generic = /^(naskah|subbab|heading|pengantar|pengantarbab|judulkeputusan|pokokketentuan|susunantim|tugaswewenangindikator|daftardokumen|uraian)$/;
export function judulBagian(r) {
  const c = r.komponen || '';
  if (generic.test(norm(c))) return r.subbagian || r.bagian || r.judulBab || c;
  return c || r.subbagian || r.bagian || r.judulBab || 'Naskah';
}
export function jalurBagian(r) {
  const bab = [r.bab, r.judulBab].filter(Boolean).join(' · ') || 'Tanpa BAB';
  const path = [bab];
  [r.bagian, r.subbagian].filter(Boolean).forEach((label) => {
    if (norm(label) !== norm(path[path.length - 1])) path.push(label);
  });
  let comp = judulBagian(r);
  if (/^Prosedur\s*\/\s*/i.test(comp)) {
    if (norm(path[path.length - 1]) !== 'prosedur') path.push('Prosedur');
    comp = comp.replace(/^Prosedur\s*\/\s*/i, '');
  }
  if (comp && norm(comp) !== norm(path[path.length - 1]) && norm(comp) !== norm(r.judulBab)) path.push(comp);
  return path;
}
export const STATUS_REVIEW = ['', 'Perlu revisi', 'Perlu diskusi', 'Menunggu persetujuan', 'ACC'];
export function tampilDiWeb(r) {
  const bab = String(r.bab || '').trim().toUpperCase();
  return !['AWAL', 'PENUTUP', 'LAMPIRAN', 'RENSTRA'].includes(bab) && !/RENSTRA/.test(bab) && !/^(REN|LAMP)-/.test(r.id);
}
export function buatPohon(rows) {
  const root = { key: 'all', label: 'Semua bagian', path: [], ids: [], children: [] };
  const byKey = { all: root };
  const make = (parent, label, path) => {
    const key = nodeKey(path);
    if (!byKey[key]) { const n = { key, label, path, ids: [], children: [] }; parent.children.push(n); byKey[key] = n; }
    return byKey[key];
  };
  // Insertion order follows source rows; stages share their Prosedur parent.
  rows.filter(tampilDiWeb).forEach((r) => {
    const path = jalurBagian(r);
    root.ids.push(r.id); let parent = root;
    path.forEach((label, i) => { parent = make(parent, label, path.slice(0, i + 1)); parent.ids.push(r.id); });
  });
  return { root, byKey };
}
export function teksBanding(value) {
  return String(value || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/^\s*(?:[-+*•]|\d+[.)]|[a-zA-Z][.)])\s+/gm, '')
    .replace(/\\([*_`[\]|\\])/g, '$1')
    .replace(/\*\*|__|(?<!\w)\*|\*(?!\w)|`/g, '')
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, '').replace(/\|/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
export function jejak(r) {
  const status = String(r.status || '').toUpperCase();
  if (/DIBUANG/.test(status)) return { key: 'dibuang', label: 'Ditandai dibuang' };
  if (/BELUM ADA/.test(status)) return { key: 'belum', label: 'Ditandai belum ada' };
  if (!r.rancangan.trim()) return { key: 'belum', label: 'Belum terisi' };
  if (teksBanding(r.awal) === teksBanding(r.rancangan)) return { key: 'sama', label: 'Sama dengan awal' };
  if (!r.awal.trim()) return { key: 'tambahan', label: 'Tambahan tim' };
  return { key: 'berbeda', label: 'Berbeda dari awal' };
}

// Rekap status review per BAB untuk halaman Status SPMI.
// "bagian" = baris yang dapat ditinjau (punya pasangan Isian). Catatan dikelompokkan per subbab.
const SEV_REVIEW = { 'Perlu revisi': 4, 'Perlu diskusi': 3, 'Menunggu persetujuan': 2, '': 1, 'ACC': 0 };
export function rekapStatusBab(rows, tree) {
  const byId = {};
  (rows || []).forEach((r) => { byId[r.id] = r; });
  const ambil = (ids) => (ids || []).map((id) => byId[id]).filter((r) => r && tampilDiWeb(r) && r.adaIsian);
  return ((tree && tree.root && tree.root.children) || []).map((bab) => {
    const babRows = ambil(bab.ids);
    const c = { acc: 0, revisi: 0, diskusi: 0, menunggu: 0, belum: 0 };
    babRows.forEach((r) => {
      const s = r.statusReview || '';
      if (s === 'ACC') c.acc++; else if (s === 'Perlu revisi') c.revisi++;
      else if (s === 'Perlu diskusi') c.diskusi++; else if (s === 'Menunggu persetujuan') c.menunggu++;
      else c.belum++;
    });
    const total = babRows.length;
    const verdict = total === 0 ? 'kosong' : (c.acc === total ? 'acc' : (c.belum === total ? 'belum' : 'proses'));
    const grup = [];
    (bab.children || []).forEach((sub) => {
      const subRows = ambil(sub.ids);
      if (!subRows.length) return;
      let sev = -1, tag = 'ACC';
      const poin = [];
      subRows.forEach((r) => {
        const s = r.statusReview || '';
        const sv = (s in SEV_REVIEW) ? SEV_REVIEW[s] : 1;
        if (sv > sev) { sev = sv; tag = s; }
        const txt = String(r.catatanIsian || '').trim();
        if (txt) poin.push({ text: txt, status: s });
      });
      const adaPerhatian = subRows.some((r) => (r.statusReview || '') !== 'ACC');
      if (poin.length || adaPerhatian) grup.push({ key: sub.key, label: sub.label, tag: tag, poin: poin });
    });
    return { key: bab.key, label: bab.label, total: total, acc: c.acc, revisi: c.revisi, diskusi: c.diskusi, menunggu: c.menunggu, belum: c.belum, verdict: verdict, grup: grup };
  });
}
