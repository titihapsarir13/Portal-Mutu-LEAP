// Muat init: tampilkan salinan perangkat seketika, lalu cek versi ke server.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ambilInit, simpanInit, hapusInit } from '../simpanan';

export function usePortal(aktif) {
  const [state, setState] = useState({ status: 'muat', data: null, pesan: '' });

  const muat = useCallback(async (paksa) => {
    // 1) salinan perangkat
    if (!paksa) {
      const lokal = await ambilInit();
      if (lokal) setState({ status: 'siap', data: lokal, pesan: '' });
    }
    // 2) server
    try {
      const r = await api.init();
      if (r && r.ok) {
        await simpanInit(r.data);
        setState({ status: 'siap', data: r.data, pesan: '' });
      } else {
        setState((s) => s.data ? s : { status: 'galat', data: null, pesan: (r && r.message) || 'Gagal memuat.' });
      }
    } catch (e) {
      setState((s) => s.data ? s : { status: 'galat', data: null, pesan: e.message });
    }
  }, []);

  const refresh = useCallback(async () => {
    try { await api.clearCache(); } catch (e) {}
    await hapusInit();
    await muat(true);
  }, [muat]);

  useEffect(() => { if (aktif) muat(false); }, [aktif, muat]);

  // cek versi ringan saat kembali ke tab
  useEffect(() => {
    if (!aktif) return;
    const onVis = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await api.versi();
        if (r && r.ok && state.data && String(r.data.versi) !== String(state.data.versi)) {
          muat(true);
        }
      } catch (e) {}
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [aktif, state.data, muat]);

  const patchSel = useCallback((modulId, id, kolom, nilai) => {
    setState((s) => {
      if (!s.data) return s;
      const md = s.data.data[modulId];
      if (!md) return s;
      const baris = md.baris.map((b) => b.id === id ? { ...b, c: { ...b.c, [kolom]: nilai }, ...(b.links ? { links: { ...b.links, [kolom]: [] } } : {}) } : b);
      return { ...s, data: { ...s.data, data: { ...s.data.data, [modulId]: { ...md, baris } } } };
    });
  }, []);

  const tambahLokal = useCallback((modulId, baris) => {
    setState((s) => {
      if (!s.data) return s;
      const md = s.data.data[modulId];
      if (!md) return s;
      return { ...s, data: { ...s.data, data: { ...s.data.data, [modulId]: { ...md, baris: md.baris.concat([baris]) } } } };
    });
  }, []);

  const hapusLokal = useCallback((modulId, id) => {
    setState((s) => {
      if (!s.data) return s;
      const md = s.data.data[modulId];
      if (!md) return s;
      return { ...s, data: { ...s.data, data: { ...s.data.data, [modulId]: { ...md, baris: md.baris.filter((b) => b.id !== id) } } } };
    });
  }, []);

  return { ...state, refresh, patchSel, tambahLokal, hapusLokal };
}
