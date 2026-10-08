# Aetheria Music

A premium full-stack dark iOS Glassmorphism music streaming, lyrics, and interactive chord discovery web application powered by **youtubei.js / Innertube** as the core data engine.

---

## 🌟 Highlights & Features

- **Apple Music + Spotify + YouTube Music Experience** with custom Dark iOS-style Glassmorphism UI.
- **Innertube / youtubei.js Core Engine**: Pure InnerTube API integration without YouTube Data API keys or external quotas.
- **Interactive Chord & Tab Sheet Engine (`Chord & Lirik`)**:
  - **Dynamic Song Search**: Cari lagu apapun untuk melihat chord gitar/piano dan lirik yang selaras secara otomatis (bukan isi manual).
  - **Auto-Sync dengan Lagu Aktif**: Chord otomatis mengikuti lagu yang sedang diputar di aplikasi (Play, Next, Previous) tanpa perlu pencarian ulang.
  - **Auto-Trigger dari Seluruh Tampilan**:
    - Tombol cepat **🎸 Chord** di setiap baris lagu (`SongRow`) pada halaman Discover, Search, Trending, Album, Playlist, dan Library.
    - Tombol Chord di **Bottom Player**, **Fullscreen Player**, **Mobile Mini Player**, dan tab navigasi mobile **MobileNav**.
  - **Auto-Scroll dengan Kecepatan yang Dapat Diatur**:
    - Kontrol kecepatan scroll yang presisi (`-0.25x` hingga `+4.0x`).
    - Pilihan preset kecepatan cepat: `0.5x` (Lambat), `0.75x`, `1.0x` (Normal), `1.5x`, `2.0x` (Cepat), dan `3.0x`.
    - Animasi scroll berbasis `requestAnimationFrame` yang sangat halus (butter-smooth).
    - Floating quick controller di pojok layar saat auto-scroll aktif untuk jeda/lanjut atau ubah kecepatan tanpa perlu menggulir ke atas.
  - **Transpose Nada Real-Time**: Transpose semitone (`-11` hingga `+11`) menggunakan Tonal.js.
  - **Diagram Fret & Teori Nada**: Popover dan modal interaktif dengan diagram fretboard gitar (posisi jari E A D G B e), susunan interval, dan audio synthesizer nada chord Web Audio.
  - **Generator Harmoni AI & Fallback Cepat**: Menggunakan `@google/genai` (`gemini-3.8-flash`), katalog chord curated, dan engine progresi harmonik diatonis otomatis.
- **Full Discovery & Search Engine (Halaman Discover & Pencarian)**:
  - **Riwayat Pencarian Lokal (Search History)**:
    - Menyimpan otomatis kata kunci pencarian yang berhasil ke dalam penyimpanan lokal (`localStorage`).
    - Menampilkan riwayat pencarian dalam bentuk chip interaktif yang dapat langsung diklik untuk mencari ulang secara instan.
    - Dilengkapi tombol hapus per kata kunci (`X`) serta opsi **Hapus Semua** (`Clear All`).
    - **Pencarian Populer & Rekomendasi Genre**: Chip saran cepat (Taylor Swift, Lofi Beats, Bernadya, Pop Indo, Rock Hits, Acoustic Guitar, Jazz & Blues, dll.).
  - **Popular Artists Showcase**: Carousel artis global teratas dengan metadata terverifikasi, jumlah audiens bulanan, dan tombol putar instan.
  - Curated Home feed sections and dynamic release carousels.
  - Trending charts and global releases.
  - Search songs, artists, albums, and playlists with debounce and request cancellation (`AbortController`).
  - Search pagination with continuation support.
- **Universal Text Sanitization & Stabilitas React**:
  - Middleware sanitasi otomatis respons JSON Express (`server/sanitizer.ts`) dan client-side deep sanitizer (`src/services/api.ts` & `src/utils/text.ts`).
  - Menghilangkan sepenuhnya potensi error `Objects are not valid as a React child (found: object with keys {rtl})` yang berasal dari struktur objek teks internal InnerTube / YouTube.js.
  - Sanitasi otomatis data tersimpan di `localStorage` (lagu favorit, riwayat dengar, dan playlist) agar data lama yang korup langsung diperbaiki secara mulus.
- **Artist Catalogs with No Artificial Limits**:
  - Unlimited artist song browsing using continuation tokens.
  - Full discography: artist albums, singles, EPs, and fan recommendations.
- **Albums & Playlists**:
  - Full tracklists with duration and rich metadata.
  - Play Album, Shuffle Album, and individual track playback.
- **Audio Playback Engine**:
  - Single `HTMLAudioElement` lifecycle management.
  - Resilient audio playback with MediaSession synchronization (lockscreen controls, notifications, artwork).
  - Proper shuffle permutation order (never random duplicates on Next).
  - Repeat modes: `off`, `repeat-all`, `repeat-one`.
  - Live scrubbable progress bar with hover time preview.
  - Queue management: reorder, add to queue, play next, remove, clear.
  - Race condition prevention with unique playback request IDs.
- **SponsorBlock Auto-Skip Integration**:
  - Deteksi dan skip otomatis segmen non-musik (intro panjang, sponsor, outro, sketsa) dengan tombol Undo toast notifikasi.
- **Lyrics Engine**:
  - Integrasi lirik multi-sumber (YouTube Music Innertube, NetEase, LRCLIB, LrcGet).
  - Tampilan synced lyrics tersinkronisasi waktu dan lirik polos dengan terjemahan bahasa & transliterasi Romaji.
- **Media Scene Visualizer**:
  - Visualizer audio atmosferik dan pencahayaan dinamis bertema glassmorphism.
- **Local Library**:
  - Favorites, recently played history, and custom playlist creation stored securely in local browser storage (`localStorage`).

---

## 🛠️ Architecture

```
Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
  ↓
Express API Server (TypeScript + tsx)
  ↓
Innertube Singleton Service (youtubei.js v18) + Gemini 3.8 Flash AI
  ↓
YouTube & YouTube Music Internal Endpoints
```

### Endpoints Implemented

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and Innertube status healthcheck |
| `GET` | `/api/home` | Curated Home feed sections with auto-fallback |
| `GET` | `/api/trending` | Top charts and trending releases |
| `GET` | `/api/artists/popular` | Verified popular artists list with audience statistics |
| `GET` | `/api/artist/:artistId` | Artist profile and top releases |
| `GET` | `/api/artist/:artistId/songs` | Artist songs catalog with continuation |
| `GET` | `/api/artist/:artistId/albums`| Artist albums & singles catalog |
| `GET` | `/api/song/:videoId` | Song detailed metadata |
| `GET` | `/api/song/:videoId/stream` | Audio stream URL extraction |
| `GET` | `/api/stream/:videoId/refresh`| Refreshes expired audio stream URLs |
| `GET` | `/api/song/:videoId/lyrics` | Multi-source lyrics retrieval (Innertube / NetEase / LRCLIB) |
| `GET` | `/api/song/:videoId/sponsorblock` | SponsorBlock non-music segments detection |
| `GET` | `/api/song/:videoId/related`| Related recommendations and up-next songs |
| `GET` | `/api/album/:albumId` | Album tracks and metadata |
| `GET` | `/api/playlist/:playlistId` | Playlist tracks with continuation |
| `GET` | `/api/search?q=&continuation=` | Multi-category search with continuation tokens |
| `GET` | `/api/search/songs?q=` | Filtered songs search |
| `GET` | `/api/search/artists?q=` | Filtered artists search |
| `GET` | `/api/search/albums?q=` | Filtered albums search |
| `GET` | `/api/search/playlists?q=` | Filtered playlists search |
| `GET` | `/api/chord?q=&videoId=&title=` | Interactive chord & lyrics generation (Gemini AI + Curated + Algorithmic) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20.0.0 or later, Node 22 recommended)
- **pnpm** (recommended, v9+) or **npm** (v10+)

### Development

#### Using pnpm (Recommended):
```bash
# 1. Install dependencies
pnpm install

# 2. Start Full-Stack Dev Server (Express backend + Vite frontend on port 3000)
pnpm dev
```

#### Using npm:
```bash
# 1. Install dependencies
npm install

# 2. Start Full-Stack Dev Server
npm run dev
```

Open your browser at `http://localhost:3000`.

### Production Build

```bash
# With pnpm
pnpm build
pnpm start

# With npm
npm run build
npm start
```

---

## 📦 pnpm Configuration

The repository includes native `pnpm` configuration:
- `.npmrc`: Optimized for React 19, Vite, and Tailwind with `auto-install-peers=true`, `node-linker=hoisted`, and public hoist patterns.
- `packageManager`: `"pnpm@9.15.4"` configured for Corepack reproducibility.
- `pnpm-lock.yaml`: Deterministic dependency lockfile for fast and consistent installs.

---

## 📱 Termux Setup (Android)

Aetheria runs natively on Android via Termux without Docker, Python, or external databases:

```bash
# 1. Update Termux packages
pkg update && pkg upgrade -y

# 2. Install Node.js & Git
pkg install nodejs-lts git -y

# 3. Clone / Navigate to project directory
cd aetheria-music

# 4. Install & Run
pnpm install # or npm install
pnpm dev     # or npm run dev
```

Open `http://localhost:3000` in Chrome / Firefox on your Android device.

---

## 🛡️ Network Resilience & Caching

- **Innertube Singleton**: Initialized once on startup with controlled exponential backoff retry.
- **Memory Caching (`server/cache.ts`)**:
  - Search, Home, Trending, Popular Artists, Song, Album, Artist metadata cached in-memory with automatic TTL cleanup to prevent memory leaks.
  - Stream URLs cached with short TTL (2 hours) to avoid expired link issues.
- **API Error Contract**: Standardized JSON responses with error code, message, and `retryable` status flags.
