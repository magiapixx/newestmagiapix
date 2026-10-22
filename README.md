# Mondragon 5 — Merged Static Site

Project ini adalah hasil penggabungan **3 file ZIP** hasil download terpisah dari satu website Framer yang sama:

- `mondragon-5-digital-creative-agency-copy-site.zip` → halaman Home, About, dan daftar Cases
- `mondragon-5-digital-creative-agency-copy-site (1).zip` → halaman case Armada dan Montana
- `mondragon-5-digital-creative-agency-copy-site (2).zip` → halaman Contact dan case Pirate Hub

Semua halaman sekarang berada dalam satu struktur folder, memakai satu folder `assets` gabungan, dan saling terhubung.

## Halaman yang tersedia

| URL | Halaman |
| --- | --- |
| `/` | Home |
| `/about/` | About |
| `/cases/` | Daftar semua case |
| `/cases/armada/` | Case Armada |
| `/cases/montana/` | Case Montana |
| `/cases/pirate-hub/` | Case Pirate Hub |
| `/cases/calderone/` | Case Calderone |
| `/cases/oasis/` | Case Oasis |
| `/contact/` | Contact |

> Catatan: halaman **Calderone** dan **Oasis** tidak ada di dalam ketiga ZIP, tetapi tautannya ada di halaman daftar Cases. Kedua halaman ini dilengkapi otomatis dari situs live-nya dan seluruh asetnya sudah diunduh agar tautan tidak rusak.

## Cara menjalankan

### Cara termudah (Windows)

1. Klik dua kali `start.cmd`.
2. Browser akan terbuka otomatis di `http://localhost:4173`.

Script akan memakai Node.js portable yang sudah ada di:

```
..\.setup\node\node-v24.22.1-win-x64\node.exe
```

Jika Node.js tersedia di `PATH`, script juga bisa memakai `node` biasa.

### Manual

```powershell
node serve.js 4173
```

Lalu buka `http://localhost:4173`.

> **Penting:** jangan membuka `index.html` langsung lewat `file://`. Website ini memakai ES modules, module imports, dan service worker yang hanya bekerja melalui HTTP server. Selain itu service worker didaftarkan di `/f2c-sw.js`, jadi situs harus dijalankan dari root domain/localhost, bukan dari subfolder acak.

## Struktur folder

```
mondragon-site/
├─ index.html                 # Home
├─ about/index.html
├─ cases/index.html
├─ cases/armada/index.html
├─ cases/montana/index.html
├─ cases/pirate-hub/index.html
├─ cases/calderone/index.html
├─ cases/oasis/index.html
├─ contact/index.html
├─ assets/                    # Gabungan aset ketiga ZIP + aset 2 halaman tambahan
├─ f2c-sw.js                  # Service worker gabungan dari 3 deployment
├─ serve.js                   # Static server tanpa dependency
├─ start.cmd                  # Launcher Windows (klik dua kali)
├─ start.ps1                  # Launcher PowerShell
└─ README.md
```

## Catatan teknis

- Ketiga ZIP berasal dari **deployment/site ID Framer yang berbeda** (`7unOYoPP...`, `5OMdGr8...`, `2n1K4F4...`), walau isinya website yang sama. Karena itu folder modul per-deployment tetap dipertahankan di dalam `assets/framerusercontent.com/sites/`.
- Folder `assets` digabung dari ketiga ZIP. Semua file dengan path sama sudah dicek dan isinya identik, kecuali `f2c-sw.js` yang memang berbeda per deployment.
- `f2c-sw.js` dibuat ulang dengan menggabungkan ketiga peta aset dan service worker, sehingga semua halaman bisa memakai satu service worker.
- Tautan yang tadinya menunjuk ke tiga domain live (`serene-example-...`, `tedious-anything-...`, `flowing-fade-...`) sudah diarahkan ke halaman lokal.
- Metadata `canonical` dan `og:url` masih menunjuk ke domain Framer asli. Ini tidak mengganggu tampilan; ubah jika nanti website dipublikasikan di domain sendiri.
- Sebagian besar aset (gambar, font, modul Framer, dan data CMS) disimpan lokal sehingga tetap tampil tanpa koneksi internet. Pengecualian: video Vimeo dan beberapa layanan eksternal (analytics, social link) tetap membutuhkan internet.
- Jalankan `start.ps1` jika lebih nyaman memakai PowerShell.
