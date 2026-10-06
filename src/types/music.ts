export interface Song {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  album?: { id?: string; name: string };
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail: string;
  isExplicit?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
  subscribers?: string;
  description?: string;
}

export interface Album {
  id: string;
  title: string;
  artists: { id?: string; name: string }[];
  year?: string | number;
  thumbnail: string;
  trackCount?: number;
}

export interface Playlist {
  id: string;
  title: string;
  author?: string;
  thumbnail: string;
  trackCount?: number;
  description?: string;
}

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface HomeSection {
  title: string;
  type: 'songs' | 'albums' | 'artists' | 'playlists' | 'mixed';
  items: (Song | Album | Artist | Playlist)[];
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

export type RepeatMode = 'off' | 'all' | 'one' | 'repeat-all' | 'repeat-one';

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: Song[];
  createdAt: number;
}

export type NavigationPage =
  | { name: 'home' }
  | { name: 'trending' }
  | { name: 'search'; initialQuery?: string }
  | { name: 'library'; tab?: 'favorites' | 'history' | 'playlists' }
  | { name: 'artist'; id: string }
  | { name: 'album'; id: string }
  | { name: 'playlist'; id: string };
