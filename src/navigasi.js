// Navigasi berbasis hash (#halaman), aman di GitHub Pages.
import { useEffect, useState } from 'react';
import { STORAGE_KEY } from './config';

const KEY_TERAKHIR = STORAGE_KEY + '.hashTerakhir';

export function bacaHash() {
  const h = (window.location.hash || '').replace(/^#/, '');
  return h || null;
}

export function keHalaman(id) {
  if (bacaHash() === id) return;
  window.location.hash = '#' + id;
}

export function mundur() { window.history.back(); }
export function maju() { window.history.forward(); }

export function useHash(defaultId) {
  const [hash, setHash] = useState(() => bacaHash() || terakhir() || defaultId);
  useEffect(() => {
    if (!bacaHash()) {
      // buka tanpa hash -> kembalikan ke halaman terakhir
      window.location.hash = '#' + (terakhir() || defaultId);
    }
    const onPop = () => {
      const h = bacaHash() || defaultId;
      setHash(h);
      try { localStorage.setItem(KEY_TERAKHIR, h); } catch (e) {}
    };
    window.addEventListener('hashchange', onPop);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('hashchange', onPop);
      window.removeEventListener('popstate', onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return hash;
}

function terakhir() {
  try { return localStorage.getItem(KEY_TERAKHIR); } catch (e) { return null; }
}
