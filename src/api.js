import { API_URL, TIMEOUT } from './config';

function sudahDiatur() {
  return API_URL && API_URL.indexOf('ISI_URL') < 0;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Waktu tunggu habis. Periksa koneksi.')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function get(action, params) {
  if (!sudahDiatur()) throw new Error('API_URL belum diatur di config.js.');
  const u = new URL(API_URL);
  u.searchParams.set('action', action);
  if (params) Object.keys(params).forEach((k) => u.searchParams.set(k, params[k]));
  const res = await withTimeout(fetch(u.toString(), { method: 'GET' }), TIMEOUT);
  const data = await res.json();
  return data;
}

// POST sebagai text/plain; bila gagal jaringan, pakai cadangan GET ?p=
async function post(action, body) {
  if (!sudahDiatur()) throw new Error('API_URL belum diatur di config.js.');
  const payload = JSON.stringify(Object.assign({ action }, body));
  try {
    const res = await withTimeout(fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: payload
    }), TIMEOUT);
    return await res.json();
  } catch (e) {
    // cadangan: GET ?action=&p=
    const u = new URL(API_URL);
    u.searchParams.set('action', action);
    u.searchParams.set('p', JSON.stringify(body));
    const res = await withTimeout(fetch(u.toString(), { method: 'GET' }), TIMEOUT);
    return await res.json();
  }
}

export const api = {
  sudahDiatur,
  ping: () => get('ping'),
  init: () => get('init'),
  versi: () => get('versi'),
  clearCache: () => get('clearCache'),
  pengguna: () => get('pengguna'),
  login: (nama, pin) => post('login', { nama, pin }),
  update: (b) => post('update', b),
  create: (b) => post('create', b),
  archive: (b) => post('archive', b),
  perbaruiDraft: (b) => post('perbaruiDraft', b),
  sinkronLinkForm: (b) => post('sinkronLinkForm', b),
  adminData: (b) => post('adminData', b),
  gantiSandi: (b) => post('gantiSandi', b),
  resetSandi: (b) => post('resetSandi', b),
  setAkses: (b) => post('setAkses', b),
  setAktif: (b) => post('setAktif', b),
  setPeran: (b) => post('setPeran', b)
};
