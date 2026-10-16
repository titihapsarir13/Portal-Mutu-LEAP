import React, { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEY } from './config';
import { api } from './api';
import { usePortal } from './hooks/usePortal';
import { useHash, keHalaman, mundur, maju } from './navigasi';
import Gate from './components/Gate';
import Sidebar from './components/Sidebar';
import MainNav, { bagianHalaman, rincianMenu } from './components/MainNav';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import ModulTabel from './pages/ModulTabel';
import RegistriPos from './pages/RegistriPos';
import AlurMap from './pages/AlurMap';
import Admin from './pages/Admin';
import GantiSandi from './pages/GantiSandi';
import Beranda from './pages/Beranda';

const TANPA_LOGIN = true;
const PENGUNJUNG = Object.freeze({ nama: 'Pengunjung', divisi: 'Umum', peran: 'Pengunjung' });
const ME_KEY = STORAGE_KEY + '.me';
const COLL_KEY = STORAGE_KEY + '.collapsed';
function bacaMe() { try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null'); } catch (e) { return null; } }

export default function App() {
  const [me, setMe] = useState(() => TANPA_LOGIN ? PENGUNJUNG : bacaMe());
  const portal = usePortal(!!me && !(me && me.harusGanti));
  const hash = useHash('beranda');
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(COLL_KEY) === '1'; } catch (e) { return false; } });
  const [halamanTerakhir, setHalamanTerakhir] = useState({});
  const [toast, setToast] = useState(null);
  const [gantiManual, setGantiManual] = useState(false);

  function masuk(m) { try { localStorage.setItem(ME_KEY, JSON.stringify(m)); } catch (e) {} setMe(m); }
  function keluar() { try { localStorage.removeItem(ME_KEY); } catch (e) {} setMe(null); }
  function tampilToast(pesan, jenis) { setToast({ pesan, jenis }); setTimeout(() => setToast(null), 3500); }
  function toggleCollapse() { setCollapsed((c) => { const n = !c; try { localStorage.setItem(COLL_KEY, n ? '1' : '0'); } catch (e) {} return n; }); }

  useEffect(() => { setDrawer(false); }, [hash]);

  const data = portal.data;
  const isSA = !!(me && me.peran === 'SA');

  const akses = (data && data.akses) || {};
  function bolehLihat(id) { if (isSA) return true; const r = akses[me.divisi] && akses[me.divisi][id]; return r ? r.lihat : true; }
  function bolehEdit(id) { if (TANPA_LOGIN) return false; if (isSA) return true; const r = akses[me.divisi] && akses[me.divisi][id]; return r ? r.edit : true; }

  const modulTampil = useMemo(() => {
    if (!me) return [];
    const semua = (data && data.modul) || [];
    const div = (me.divisi || '').toLowerCase();
    const sup = me.peran === 'SA';
    return semua
      .filter((m) => {
        if (!bolehLihat(m.id)) return false;
        const d = (m.divisi || 'Semua').toLowerCase();
        if (sup || d === 'semua' || !d) return true;
        return d.split(/[|,]/).map((x) => x.trim()).some((x) => x && (div.indexOf(x) >= 0 || x.indexOf(div) >= 0));
      })
      .map((m) => ({ ...m, _jml: data && data.data[m.id] ? data.data[m.id].baris.length : undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, data]);

  const bagian = bagianHalaman(hash, modulTampil);
  useEffect(() => { setHalamanTerakhir((v) => v[bagian] === hash ? v : { ...v, [bagian]: hash }); }, [hash, bagian]);
  function pilihUtama(menu) {
    const items = rincianMenu(menu.id, modulTampil, isSA);
    const terakhir = halamanTerakhir[menu.id];
    keHalaman(items.some((x) => x.id === (terakhir || '').split('~')[0]) ? terakhir : (items[0] || {}).id || menu.awal);
  }
  function toggleSidebar() { if (window.matchMedia('(max-width: 900px)').matches) setDrawer((v) => !v); else toggleCollapse(); }

  if (!me) return <Gate onMasuk={masuk} />;
  if (me.harusGanti) {
    return <GantiSandi me={me} wajib onSelesai={() => { const m = { ...me, harusGanti: false }; masuk(m); tampilToast('Sandi berhasil diganti.', 'ok'); }} />;
  }

  const halamanDasar = hash.split('~')[0];
  let bagianNaskah = '';
  try { bagianNaskah = halamanDasar === 'modul-naskah' ? decodeURIComponent(hash.split('~')[1] || '') : ''; } catch (e) {}
  const modulAktif = halamanDasar.indexOf('modul-') === 0 ? modulTampil.find((m) => ('modul-' + m.id) === halamanDasar) : null;
  const dataAktif = data && modulAktif && data.data[modulAktif.id];
  const dataTampil = bagianNaskah && dataAktif ? { ...dataAktif, baris: dataAktif.baris.filter((b) => String(b.c[2] || '').trim() === bagianNaskah) } : dataAktif;
  let judul = 'Dashboard', sub = 'Ringkasan progres persiapan akreditasi';
  if (hash === 'beranda') { judul = 'Beranda & Panduan'; sub = 'Mulai dari sini — alur SPMI menuju EKLK & akreditasi'; }
  else if (hash === 'alur') { judul = 'Alur Kerja'; sub = 'Peta alur garis besar persiapan akreditasi'; }
  else if (hash === 'admin') { judul = 'Admin & Akses'; sub = 'Kelola pengguna, sandi, dan hak akses'; }
  else if (modulAktif) { judul = modulAktif.judul; sub = modulAktif.deskripsi; }

  return (
    <div className={'app app-topnav' + (drawer ? ' drawer-open' : '')}>
      <MainNav app={data && data.app} aktif={bagian} onPilih={pilihUtama} onMundur={mundur} onMaju={maju} onToggleSidebar={toggleSidebar} />
      <div className="workspace">
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}
      <Sidebar key={bagian} app={data && data.app} modul={modulTampil} naskahBaris={data && data.data.naskah && data.data.naskah.baris} bagian={bagian} aktif={hash} isSA={isSA} collapsed={collapsed}
        onPilih={(id) => keHalaman(id)} drawer={drawer} onTutup={() => setDrawer(false)}
        onToggleCollapse={toggleCollapse} />
      <div className="main">
        <Topbar judul={judul} sub={bagianNaskah || sub} me={me}
          onRefresh={async () => { await portal.refresh(); tampilToast('Data diperbarui.', 'ok'); }}
          onBurger={() => setDrawer(true)} onKeluar={TANPA_LOGIN ? undefined : keluar}
          onMundur={mundur} onMaju={maju} onGantiSandi={TANPA_LOGIN ? undefined : () => setGantiManual(true)} />

        {portal.status === 'muat' && !data && hash !== 'beranda' && <div className="body"><div className="kosong">Memuat…</div></div>}
        {portal.status === 'galat' && !data && (
          <div className="body"><div className="galat"><b>Tidak dapat memuat data.</b><div>{portal.pesan}</div>
            {!api.sudahDiatur() && <div className="hint">API_URL belum diatur di config.js. Lihat PANDUAN langkah G.</div>}</div></div>
        )}

        {hash === 'beranda' && <Beranda app={data && data.app} me={me} onPilih={(id) => keHalaman(id)} />}
        {data && hash === 'dashboard' && <Dashboard data={data} onPilih={(id) => keHalaman(id)} />}
        {data && hash === 'alur' && <AlurMap modul={modulTampil} onPilih={(id) => keHalaman(id)} />}
        {data && hash === 'admin' && (isSA
          ? <Admin me={me} onToast={tampilToast} onRefresh={portal.refresh} />
          : <div className="body"><div className="galat"><b>Halaman khusus Super Admin.</b></div></div>)}
        {data && modulAktif && modulAktif.id === 'form' && (
          <RegistriPos modul={modulAktif} moddata={dataTampil} opsi={data.opsi} me={me}
            appCfg={data.app} bolehEdit={bolehEdit(modulAktif.id)} registriPos={data.registriPos} onRefresh={portal.refresh}
            onPatch={portal.patchSel} onToast={tampilToast} />
        )}
        {data && modulAktif && modulAktif.id !== 'form' && (
          <ModulTabel modul={modulAktif} moddata={dataTampil} opsi={data.opsi} me={me}
            appCfg={data.app} bolehEdit={bolehEdit(modulAktif.id)}
            onPatch={portal.patchSel} onTambah={portal.tambahLokal} onHapus={portal.hapusLokal} onToast={tampilToast} />
        )}
        {data && hash.indexOf('modul-') === 0 && !modulAktif && <div className="body"><div className="kosong">Modul tidak tersedia untuk Anda.</div></div>}
      </div>

      </div>

      {gantiManual && <GantiSandi me={me} onSelesai={() => { setGantiManual(false); tampilToast('Sandi diperbarui.', 'ok'); }} onBatal={() => setGantiManual(false)} />}
      {toast && <div className={'toast ' + (toast.jenis === 'err' ? 'err' : 'ok')}>{toast.pesan}</div>}
    </div>
  );
}
