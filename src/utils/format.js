// Pemformatan tampilan dan warna badge.

export function tglTampil(v) {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return String(v);
}

const HIJAU = ['selesai', 'memenuhi', 'terverifikasi memadai', 'memadai', 'diputuskan', 'dijawab', 'selaras', 'sesuai'];
const KUNING = ['berjalan', 'dibahas', 'sebagian', 'perlu perbaikan', 'ada, perlu perbaikan', 'perlu tindak lanjut', 'sudah diajukan', 'belum memadai'];
const MERAH = ['belum ada', 'konflik', 'belum memenuhi', 'dipastikan belum tersedia', 'gap'];

export function warnaBadge(nilai, opsiGroup) {
  const v = String(nilai || '').toLowerCase().trim();
  if (!v) return null;
  if (opsiGroup) {
    const f = opsiGroup.filter((o) => String(o.nilai).toLowerCase() === v)[0];
    if (f && f.warna) return { bg: f.warna, fg: teksKontras(f.warna) };
  }
  if (HIJAU.some((x) => v.indexOf(x) >= 0)) return { bg: '#E4F4EC', fg: '#1E7D52' };
  if (KUNING.some((x) => v.indexOf(x) >= 0)) return { bg: '#FBF1D6', fg: '#9A6700' };
  if (MERAH.some((x) => v.indexOf(x) >= 0)) return { bg: '#FBE9E7', fg: '#B42318' };
  return { bg: '#EEF1F6', fg: '#5B6472' };
}

function teksKontras(hex) {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1F2430' : '#fff';
  } catch (e) { return '#1F2430'; }
}

export function norm(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
}
