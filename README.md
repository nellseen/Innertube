# Aetheria Music

A premium full-stack dark iOS Glassmorphism music streaming and discovery web application powered by **youtubei.js / Innertube** as the core data engine.

---

## 🌟 Highlights & Features

- **Apple Music + Spotify + YouTube Music Experience** with custom Dark iOS-style Glassmorphism UI.
- **Innertube / youtubei.js Core Engine**: Pure InnerTube API integration without YouTube Data API keys or Gemini APIs.
- **Full Discovery**:
  - Home curated feeds and dynamic carousels.
  - Trending charts and global releases.
  - Search songs, artists, albums, and playlists with debounce and request cancellation (`AbortController`).
  - Search pagination with continuation support.
- **Artist Catalogs with No Artificial Limits**:
  - Unlimited artist song browsing using continuation tokens.
  - Artist albums, singles, EPs, and fan recommendations.
- **Albums & Playlists**:
  - Full tracklists with duration and rich metadata.
  - Play Album, Shuffle Album, Play Track.
- **Audio Playback Engine**:
  - Single `HTMLAudioElement` lifecycle.
  - Resilient audio playback with MediaSession synchronization (lockscreen controls, notifications, artwork).
  - Proper shuffle permutation order (never random duplicates on Next).
  - Repeat modes: `off`, `repeat-all`, `repeat-one`.
  - Live scrubbable progress bar with hover time preview.
  - Queue management: reorder, add to queue, play next, remove, clear.
  - Race condition prevention with unique playback request IDs.
- **Lyrics Engine**:
  - Real lyrics extracted directly via YouTube Music Innertube API.
  - Desktop lyrics side-drawer & fullscreen synced/plain lyrics views.
- **Local Library**:
  - Favorites, recently played history, and custom playlist creation stored securely in local browser storage (`localStorage`).

---

## 🛠️ Architecture

```
Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
  ↓
Express API Server (TypeScript + tsx)
  ↓
Innertube Singleton Service (youtubei.js v18)
  ↓
YouTube & YouTube Music Internal Endpoints
```

### Endpoints Implemented

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and Innertube status healthcheck |
| `GET` | `/api/home` | Curated Home feed sections with auto-fallback |
| `GET` | `/api/trending` | Top charts and trending releases |
| `GET` | `/api/search?q=&continuation=` | Multi-category search with continuation tokens |
| `GET` | `/api/search/songs?q=` | Filtered songs search |
| `GET` | `/api/search/artists?q=` | Filtered artists search |
| `GET` | `/api/search/albums?q=` | Filtered albums search |
| `GET` | `/api/search/playlists?q=` | Filtered playlists search |
| `GET` | `/api/song/:videoId` | Song detailed metadata |
| `GET` | `/api/song/:videoId/stream` | Audio stream URL extraction |
| `GET` | `/api/stream/:videoId/refresh`| Refreshes expired audio stream URLs |
| `GET` | `/api/song/:videoId/lyrics` | Lyrics retrieval via Innertube |
| `GET` | `/api/song/:videoId/related`| Related recommendations and up-next songs |
| `GET` | `/api/artist/:artistId` | Artist profile and top releases |
| `GET` | `/api/artist/:artistId/songs` | Artist songs catalog with continuation |
| `GET` | `/api/artist/:artistId/albums`| Artist albums & singles catalog |
| `GET` | `/api/album/:albumId` | Album tracks and metadata |
| `GET` | `/api/playlist/:playlistId` | Playlist tracks with continuation |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or later, Node 20+ recommended)
- **npm** or **pnpm**

### Development

```bash
# 1. Install dependencies
npm install

# 2. Start Full-Stack Dev Server (Express backend + Vite frontend on port 3000)
npm run dev
```

Open your browser at `http://localhost:3000`.

### Production Build

```bash
# 1. Build the frontend
npm run build

# 2. Run the production server
npm start
```

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
npm install
npm run dev
```

Open `http://localhost:3000` in Chrome / Firefox on your Android device.

---

## 🛡️ Network Resilience & Caching

- **Innertube Singleton**: Initialized once on startup with controlled exponential backoff retry.
- **Memory Caching (`server/cache.ts`)**:
  - Search, Home, Trending, Song, Album, Artist metadata cached in-memory with automatic TTL cleanup to prevent memory leaks.
  - Stream URLs cached with short TTL (2 hours) to avoid expired link issues.
- **API Error Contract**: Standardized JSON responses with error code, message, and `retryable` status flags.
