import { SPMI_API_URL } from './configSpmi';
export function spmiTerhubung() { return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(SPMI_API_URL); }
async function request(options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const r = await fetch(options ? SPMI_API_URL : SPMI_API_URL + '?action=naskahSpmi', { ...options, signal: controller.signal });
    const json = await r.json();
    if (!json.ok) { const e = new Error(json.message || 'Gagal memproses naskah.'); e.code = json.code; e.data = json.data; throw e; }
    return json.data;
  } catch (e) { if (e.name === 'AbortError') throw new Error('Waktu tunggu habis. Draf tetap terbuka. Muat ulang data untuk mengecek hasil simpan sebelum mencoba lagi.'); throw e; }
  finally { clearTimeout(timer); }
}
export const muatSpmi = () => request();
export const simpanSpmi = (body) => request({ method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, action: 'simpanRancanganSpmi' }) });
