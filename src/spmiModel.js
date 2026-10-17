export const nodeKey = (path) => JSON.stringify(path);
export const routeSpmi = (key) => key === 'all' ? 'modul-naskah' : 'modul-naskah~' + encodeURIComponent(key);
export function selectedSpmi(hash) { try { return decodeURIComponent(hash.split('~')[1] || '') || 'all'; } catch (e) { return 'all'; } }
export function buatPohon(rows) {
  const root = { key: 'all', label: 'Semua bagian', path: [], ids: [], children: [] };
  const byKey = { all: root };
  const make = (parent, label, path) => {
    const key = nodeKey(path);
    if (!byKey[key]) { const n = { key, label, path, ids: [], children: [] }; parent.children.push(n); byKey[key] = n; }
    return byKey[key];
  };
  const paths = new Map();
  rows.forEach((r) => {
    const bab = [r.bab, r.judulBab].filter(Boolean).join(' · ');
    const path = [bab || 'Tanpa BAB', r.bagian || r.komponen || 'Pengantar'];
    if (r.subbagian) path.push(r.subbagian);
    const key = nodeKey(path); paths.set(key, (paths.get(key) || 0) + 1);
  });
  rows.forEach((r) => {
    const bab = [r.bab, r.judulBab].filter(Boolean).join(' · ');
    const path = [bab || 'Tanpa BAB', r.bagian || r.komponen || 'Pengantar'];
    if (r.subbagian) path.push(r.subbagian);
    const hasChildren = [...paths.keys()].some((k) => k.startsWith(nodeKey(path).slice(0, -1) + ','));
    if (paths.get(nodeKey(path)) > 1 || hasChildren) path.push((r.komponen || 'Bagian') + (rows.some((x) => x.id !== r.id && x.bab === r.bab && x.bagian === r.bagian && x.subbagian === r.subbagian && x.komponen === r.komponen) ? ' · ' + r.id : ''));
    root.ids.push(r.id); let parent = root;
    path.forEach((label, i) => { parent = make(parent, label, path.slice(0, i + 1)); parent.ids.push(r.id); });
  });
  return { root, byKey };
}
export function jejak(r) {
  const status = String(r.status || '').toUpperCase();
  if (/DIBUANG/.test(status)) return { key: 'dibuang', label: 'Ditandai dibuang' };
  if (/BELUM ADA/.test(status)) return { key: 'belum', label: 'Ditandai belum ada' };
  if (!r.rancangan.trim()) return { key: 'belum', label: 'Belum terisi' };
  if (r.awal.trim() === r.rancangan.trim()) return { key: 'sama', label: 'Sama dengan awal' };
  if (!r.awal.trim()) return { key: 'tambahan', label: 'Tambahan tim' };
  return { key: 'berbeda', label: 'Berbeda dari awal' };
}
