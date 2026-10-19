import { useCallback, useEffect, useState } from 'react';
import preview from '../spmiPreview.json';
import { tampilDiWeb } from '../spmiModel';
import { muatSpmi, spmiTerhubung } from '../apiSpmi';
const visible = (data) => ({ ...data, rows: (data.rows || []).filter(tampilDiWeb) });
export function useSpmi(aktif) {
  const live = spmiTerhubung();
  const [state, setState] = useState(() => ({ data: live ? null : visible(preview), status: live ? 'awal' : 'siap', error: '' }));
  const refresh = useCallback(async () => {
    if (!live) return;
    setState((s) => ({ ...s, status: 'muat', error: '' }));
    try { const data = await muatSpmi(); setState({ data: visible(data), status: 'siap', error: '' }); }
    catch (e) { setState((s) => ({ ...s, status: 'galat', error: e.message })); }
  }, [live]);
  useEffect(() => { if (aktif && live && state.status === 'awal') refresh(); }, [aktif, live, state.status, refresh]);
  const patch = useCallback((id, rancangan) => setState((s) => ({ ...s, data: { ...s.data, rows: s.data.rows.map((r) => r.id === id ? { ...r, rancangan } : r) } })), []);
  const patchRow = useCallback((row) => setState((s) => ({ ...s, data: { ...s.data, rows: s.data.rows.map((r) => r.id === row.id ? { ...r, ...row } : r) } })), []);
  return { ...state, live, refresh, patch, patchRow };
}
