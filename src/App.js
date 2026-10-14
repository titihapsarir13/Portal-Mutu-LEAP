import React, { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEY } from './config';
import { api } from './api';
import { usePortal } from './hooks/usePortal';
import { useHash, keHalaman } from './navigasi';
import Gate from './components/Gate';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import ModulTabel from './pages/ModulTabel';

const ME_KEY = STORAGE_KEY + '.me';

function bacaMe() { try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null'); } catch (e) { return null; } }

export default function App() {
  const [me, setMe] = useState(bacaMe);
  const portal = usePortal(!!me);
  const hash = useHash('dashboard');
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(null);

  function masuk(m) { try { localStorage.setItem(ME_KEY, JSON.stringify(m)); } catch (e) {} setMe(m); }
  function keluar() { try { localStorage.removeItem(ME_KEY); } catch (e) {} setMe(null); }
  function tampilToast(pesan, jenis) { setToast({ pesan, jenis }); setTimeout(() => setToast(null), 3500); }

  useEffect(() => { setDrawer(false); }, [hash]);

  const data = portal.data;

  // filter modul per divisi
  const modulTampil = useMemo(() => {
    if (!me) return [];
    const semuaModul = (data && data.modul) || [];
    const div = (me.divisi || '').toLowerCase();
    const super_ = /kepala lembaga|tim mutu/.test(div);
    return semuaModul
      .filter((m) => {
        const d = (m.divisi || 'Semua').toLowerCase();
        if (super_ || d === 'semua' || !d) return true;
        return d.split(/[|,]/).map((x) => x.trim()).some((x) => x && (div.indexOf(x) >= 0 || x.indexOf(div) >= 0));
      })
      .map((m) => ({ ...m, _jml: data && data.data[m.id] ? data.data[m.id].baris.length : undefined }));
  }, [me, data]);

  if (!me) return <Gate onMasuk={masuk} />;

  const modulAktif = hash.indexOf('modul-') === 0 ? modulTampil.filter((m) => ('modul-' + m.id) === hash)[0] : null;
  const judul = hash === 'dashboard' ? 'Dashboard' : (modulAktif ? modulAktif.judul : '—');
  const sub = hash === 'dashboard' ? 'Ringkasan progres persiapan akreditasi' : (modulAktif ? modulAktif.deskripsi : '');

  return (
    <div className={'app' + (drawer ? ' drawer-open' : '')}>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}
      <Sidebar app={data && data.app} modul={modulTampil} aktif={hash}
        onPilih={(id) => keHalaman(id)} drawer={drawer} onTutup={() => setDrawer(false)} />
      <div className="main">
        <Topbar judul={judul} sub={sub} me={me}
          onRefresh={async () => { await portal.refresh(); tampilToast('Data diperbarui.', 'ok'); }}
          onBurger={() => setDrawer(true)} onKeluar={keluar} />

        {portal.status === 'muat' && !data && <div className="body"><div className="kosong">Memuat…</div></div>}
        {portal.status === 'galat' && !data && (
          <div className="body"><div className="galat">
            <b>Tidak dapat memuat data.</b><div>{portal.pesan}</div>
            {!api.sudahDiatur() && <div className="hint">API_URL belum diatur di config.js. Lihat PANDUAN langkah G.</div>}
          </div></div>
        )}

        {data && hash === 'dashboard' && <Dashboard data={data} />}
        {data && modulAktif && (
          <ModulTabel modul={modulAktif} moddata={data.data[modulAktif.id]} opsi={data.opsi} me={me}
            onPatch={portal.patchSel} onTambah={portal.tambahLokal} onHapus={portal.hapusLokal} onToast={tampilToast} />
        )}
        {data && hash.indexOf('modul-') === 0 && !modulAktif && <div className="body"><div className="kosong">Modul tidak tersedia untuk divisi Anda.</div></div>}
      </div>

      {toast && <div className={'toast ' + (toast.jenis === 'err' ? 'err' : 'ok')}>{toast.pesan}</div>}
    </div>
  );
}
