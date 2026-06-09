# GeoGuessr Realtime Tracker & Relay

A production-ready real-time map tracking system designed for GeoGuessr monitoring. Features a robust Cloudflare Worker relay and a high-performance React frontend.

---

## 🚀 Key Features

### Frontend (React + TS + Leaflet)
- **Real-time Visualization**: Live polyline and markers update.
- **Auto-Follow**: Intelligent camera tracking with manual override.
- **Connection Diagnostics**: Visual heartbeat and exponential backoff retry.
- **State Management**: LocalStorage persistence for history and settings.
- **Data Portability**: Export and Import history as JSON.
- **Premium UI**: Dark mode support, responsive mobile layout, and custom toast notifications.

### Backend (Cloudflare Worker)
- **High Availability**: Powered by Cloudflare Edge & Durable Objects.
- **WebSocket Relay**: Low-latency broadcast from `GeoGuessr.js` to frontend viewers.
- **Room Support**: Multiple independent tracking sessions.

---

## 🛠 Panduan Setup (0% to 100%)

Ikuti panduan berikut untuk menyambungkan `GeoGuessr.js` Anda dengan aplikasi peta Realtime ini.

### 1. Setup Cloudflare Worker (WebSocket Server)
Worker bertugas sebagai "jembatan" atau server yang merelai koordinat dari Userscript menuju Aplikasi Web (Frontend).
1. Pastikan Anda sudah membuat akun [Cloudflare](https://dash.cloudflare.com/) dan menginstall `npm`.
2. Buka terminal di dalam folder `workers/`:
```bash
cd workers
npm install
npm run deploy
```
*Atau jalankan lokal dengan `npx wrangler dev`.*
3. Catat URL WebSocket yang dihasilkan (Misal: `wss://xxxxx.workers.dev/ws`). URL ini akan kita gunakan di tahap selanjutnya.

### 2. Setup Aplikasi Peta (Frontend)
Aplikasi ini adalah dashboard peta Leaflet tempat di mana marker akan bergerak secara live menyesuaikan dengan in-game GeoGuessr.
1. Di direktori utama proyek, install package frontend:
```bash
npm install
```
2. Anda bebas melakukan deploy Frontend ini ke **GitHub Pages**, **Vercel**, atau **Cloudflare Pages**.
3. Pastikan mengarahkan environment variable `VITE_WS_URL` ke alamat server Cloudflare Worker Anda (Contoh: `VITE_WS_URL=wss://xxxxx.workers.dev/ws?room=main&role=viewer`). Anda dapat men-setting ini di file `.env.production`.
4. Build dan deploy:
```bash
npm run build
```
5. Catat **URL Aplikasi Frontend** Anda setelah berhasil online.

### 3. Konfigurasi `GeoGuessr.js` Userscript
Userscript Anda (`GeoGuessr.js`) **sudah memiliki fungsionalitas WebSocket secara default**! 
Anda hanya perlu mengkonfigurasi file script sebelum Anda deploy ke GreasyFork agar dapat "berkomunikasi" dengan server yang sudah Anda baut.
 
1. Buka file `GeoGuessr.js` Anda.
2. Cari bagian **[SECTION 1] CONSTANTS & CONFIGURATION**.
3. Temukan object `REALTIME_CONFIG` dan ganti nilainya dengan server Anda sendiri!

```javascript
        REALTIME_CONFIG: Object.freeze({
            // 🔹 Ganti dengan alamat WebSocket Server Cloudflare milik Anda:
            WS_URL: "wss://my-worker-server.workers.dev/ws?room=main&role=sender",
            
            // 🔹 Ganti dengan URL Aplikasi Peta (Frontend) milik Anda:
            MAP_URL: "https://your-domain.com/MapsAppGeoGuessr/",
            
            // Anda dapat mengubah nama Room untuk session tracking terpisah:
            ROOM: "main",
            HEARTBEAT_INTERVAL: 30000,
            RECONNECT_MIN_DELAY: 1000,
            RECONNECT_MAX_DELAY: 30000,
            QUEUE_SIZE_LIMIT: 50,
            RATE_LIMIT_MS: 500,
            DEBUG: true
        })
```
4. Simpan script. Dan install/load ulang userscript di Tampermonkey.

### 4. Mari Bermain!
Kini kedua script Anda sudah terhubung 100%!
1. Buka *Frontend Aplikasi Peta* Anda dan pastikan status koneksinya terhubung (Connected).
2. Buka *GeoGuessr* dan mainkan sebuah game.
3. Buka menu UI dari userscript dengan tombol `Home` atau logo panel, lalu perhatikan indikator **Real-time Tracking** akan menyala **hijau**!
4. Secara *seamless* koordinat akan langsung terikirim ke Map dan bergerak sesuai lokasi game Anda!

---

## 📂 Project Structure

```text
.
├── workers/               # Cloudflare Worker Backend (WebSocket Server)
│   ├── src/
│   │   ├── index.ts      
│   │   ├── relay.ts      # Logika Durable Object
│   │   └── types.ts      
│   ├── package.json
│   └── wrangler.toml
├── src/                   # React Frontend (App Peta/Viewer)
│   ├── components/
│   ├── hooks/
│   ├── App.tsx           
│   └── types.ts          
└── README.md
```

## 🔒 Best Practices & Troubleshooting
- **Strict Configuration**: Pastikan parameter query `role=sender` selalu disisipkan di URL bagi `GeoGuessr.js` (contoh: `WS_URL="...&role=sender"`) dan `role=viewer` bagi Frontend (`VITE_WS_URL="...&role=viewer"`).
- **Integrity Checks**: Perubahan ini aman dan 100% kompatibel dengan fitur Anti-Tamper / `IntegrityManager` dari Bintang Toba. Modifikasi saja variabel `CONFIG`-nya.
- **Monitoring**: Gunakan browser dev-tools (Console) untuk melihat logs debug komunikasi socket dari frontend maupun *userscript*-nya langsung (bisa disetel lewat `CONFIG.DEBUG`).

---

*Dirancang dengan ❤️ untuk komunitas GeoGuessr.*
