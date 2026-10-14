# Portal Mutu LEAP

Web pengisian & visualisasi checklist akreditasi SPMI–EKLK LEAP.
React (Create React App) + GitHub Pages, tersambung ke Google Spreadsheet lewat Apps Script Web App.

- Frontend: folder ini (`public/`, `src/`, `package.json`).
- Backend: proyek Apps Script terpisah (lihat folder `1_APPS_SCRIPT`).
- Terbit otomatis via GitHub Actions (`.github/workflows/deploy.yml`).

Cara pasang lengkap: lihat `PANDUAN.txt`.

Satu baris yang perlu diisi: `src/config.js` → `API_URL` (URL `/exec` Web App Anda).
