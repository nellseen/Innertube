export interface SongItem {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  album?: { id?: string; name: string };
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail: string;
  isExplicit?: boolean;
}

export interface ArtistItem {
  id: string;
  name: string;
  thumbnail: string;
  subscribers?: string;
  description?: string;
}

export interface AlbumItem {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  year?: string | number;
  thumbnail: string;
  trackCount?: number;
}

export interface PlaylistItem {
  id: string;
  title: string;
  author?: string;
  thumbnail: string;
  trackCount?: number;
  description?: string;
}

export interface SearchResults {
  songs: SongItem[];
  artists: ArtistItem[];
  albums: AlbumItem[];
  playlists: PlaylistItem[];
}

export interface HomeSection {
  title: string;
  type: 'songs' | 'albums' | 'artists' | 'playlists' | 'mixed';
  items: (SongItem | AlbumItem | ArtistItem | PlaylistItem)[];
}

export interface LyricsLine {
  text: string;
  startMs?: number;
}

export interface LyricsResponse {
  success: boolean;
  type?: 'plain' | 'synced';
  lines?: LyricsLine[];
  syncAvailable?: boolean;
  code?: string;
  error?: string;
}

export interface StreamResponse {
  success: boolean;
  url?: string;
  videoId?: string;
  mimeType?: string;
  bitrate?: number;
  quality?: string;
  expiresIn?: number;
  isDirect?: boolean;
  code?: string;
  error?: string;
  retryable?: boolean;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code:
    | 'UPSTREAM_UNAVAILABLE'
    | 'UPSTREAM_TIMEOUT'
    | 'UPSTREAM_RATE_LIMIT'
    | 'UPSTREAM_FORBIDDEN'
    | 'VIDEO_UNAVAILABLE'
    | 'CONTENT_UNAVAILABLE'
    | 'LYRICS_UNAVAILABLE'
    | 'INVALID_REQUEST'
    | 'NOT_FOUND'
    | 'INTERNAL_ERROR';
  retryable: boolean;
}
