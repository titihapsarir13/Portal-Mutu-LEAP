// Salinan data di perangkat (IndexedDB). Gagal diam-diam bila peramban menolak.
import { APP_VERSION } from './config';

const DB = 'portalLeap';
const STORE = 'cache';

function open() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
}

export async function simpanInit(obj) {
  try {
    const db = await open();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ versiApp: APP_VERSION, obj }, 'init');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (e) { /* abaikan */ }
}

export async function ambilInit() {
  try {
    const db = await open();
    const val = await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get('init');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    if (val && val.versiApp === APP_VERSION) return val.obj;
    return null;
  } catch (e) { return null; }
}

export async function hapusInit() {
  try {
    const db = await open();
    await new Promise((res) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete('init'); tx.oncomplete = res; tx.onerror = res;
    });
  } catch (e) { /* abaikan */ }
}
