import type {
  Song,
  Artist,
  Album,
  Playlist,
  SearchResults,
  HomeSection,
  LyricsResponse,
  StreamResponse,
  SponsorBlockResponse,
} from '../types/music.js';

const BASE_URL = '/api';

export class ApiError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable = true) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await res.json().catch(() => ({
      success: false,
      code: 'INTERNAL_ERROR',
      error: `HTTP Error ${res.status}`,
    }));

    if (!res.ok || data.success === false) {
      throw new ApiError(
        data.error || `Request failed with status ${res.status}`,
        data.code || 'UPSTREAM_UNAVAILABLE',
        data.retryable ?? true
      );
    }

    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || 'Network request failed', 'NETWORK_ERROR', true);
  }
}

export const api = {
  // Health
  async getHealth(): Promise<{ success: boolean; backend: string; innertube: string }> {
    return request('/health');
  },

  // Home & Trending
  async getHome(): Promise<{ success: boolean; sections: HomeSection[] }> {
    return request('/home');
  },

  async getTrending(): Promise<{ success: boolean; sections: HomeSection[] }> {
    return request('/trending');
  },

  // Search
  async search(
    query: string,
    filter?: 'songs' | 'artists' | 'albums' | 'playlists',
    continuation?: string,
    signal?: AbortSignal
  ): Promise<{
    success: boolean;
    query: string;
    results: SearchResults;
    continuation?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (continuation) params.set('continuation', continuation);

    const path = filter ? `/search/${filter}?${params.toString()}` : `/search?${params.toString()}`;
    return request(path, { signal });
  },

  // Song
  async getSong(videoId: string): Promise<{ success: boolean; song: Song }> {
    return request(`/song/${videoId}`);
  },

  async getStreamUrl(videoId: string, refresh = false): Promise<StreamResponse> {
    const path = refresh ? `/stream/${videoId}/refresh` : `/song/${videoId}/stream`;
    return request(path);
  },

  async getLyrics(
    videoId: string,
    title?: string,
    artist?: string,
    duration?: number
  ): Promise<LyricsResponse> {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (artist) params.set('artist', artist);
    if (duration && duration > 0) params.set('duration', Math.round(duration).toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/song/${videoId}/lyrics${query}`);
  },

  async getSponsorBlockSegments(videoId: string): Promise<SponsorBlockResponse> {
    return request<SponsorBlockResponse>(`/song/${videoId}/sponsorblock`).catch(() => ({
      success: true,
      segments: [],
    }));
  },

  async getRelated(videoId: string): Promise<{ success: boolean; items: Song[] }> {
    return request(`/song/${videoId}/related`);
  },

  // Artist
  async getArtist(artistId: string): Promise<{
    success: boolean;
    artist: Artist;
    topSongs: Song[];
    albums: Album[];
    singles: Album[];
    relatedArtists: Artist[];
  }> {
    return request(`/artist/${artistId}`);
  },

  async getArtistSongs(
    artistId: string,
    continuation?: string
  ): Promise<{
    success: boolean;
    items: Song[];
    continuation?: string;
    hasMore: boolean;
  }> {
    const params = continuation ? `?continuation=${encodeURIComponent(continuation)}` : '';
    return request(`/artist/${artistId}/songs${params}`);
  },

  async getArtistAlbums(artistId: string): Promise<{ success: boolean; albums: Album[] }> {
    return request(`/artist/${artistId}/albums`);
  },

  async getPopularArtists(): Promise<{ success: boolean; artists: Artist[] }> {
    return request('/artists/popular');
  },

  // Album
  async getAlbum(albumId: string): Promise<{ success: boolean; album: Album; tracks: Song[] }> {
    return request(`/album/${albumId}`);
  },

  // Playlist
  async getPlaylist(
    playlistId: string,
    continuation?: string
  ): Promise<{
    success: boolean;
    playlist: Playlist;
    tracks: Song[];
    continuation?: string;
    hasMore: boolean;
  }> {
    const params = continuation ? `?continuation=${encodeURIComponent(continuation)}` : '';
    return request(`/playlist/${playlistId}${params}`);
  },
};
