import { Innertube, UniversalCache, Parser } from 'youtubei.js';
import type {
  SongItem,
  ArtistItem,
  AlbumItem,
  PlaylistItem,
  SearchResults,
  HomeSection,
  LyricsResponse,
  StreamResponse,
} from './types.js';

// Suppress unhandled parser warnings from upstream dynamic elements like TextBadge (Error 1 fix)
try {
  Parser.setParserErrorHandler((data: any) => {
    if (data.classname === 'TextBadge' || data.error_type === 'class_not_found') {
      return;
    }
  });
} catch {
  // safe fallback
}

let innertubeInstance: Innertube | null = null;
let isInitializing = false;
let initPromise: Promise<Innertube> | null = null;

// Helper: parse duration string "3:45" or "1:23:45" to seconds
function parseDuration(durationStr?: string | number): number {
  if (typeof durationStr === 'number') return durationStr;
  if (!durationStr || typeof durationStr !== 'string') return 0;

  const parts = durationStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Helper: get best thumbnail URL
function getBestThumbnail(thumbnails?: any): string {
  if (!thumbnails) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
  }
  let list = thumbnails;
  if (thumbnails.contents && Array.isArray(thumbnails.contents)) {
    list = thumbnails.contents;
  } else if (!Array.isArray(thumbnails)) {
    list = [thumbnails];
  }
  if (!Array.isArray(list) || list.length === 0) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
  }
  const sorted = [...list].sort((a, b) => (b.width || 0) - (a.width || 0));
  const url = sorted[0]?.url || list[0]?.url || '';
  if (url.startsWith('//')) return `https:${url}`;
  return url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
}

function isValidVideoId(id?: any): boolean {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{11}$/.test(id) && !id.startsWith('PL') && !id.startsWith('VL') && !id.startsWith('UC') && !id.startsWith('MP');
}

// Normalizer: Song
export function normalizeSong(item: any): SongItem | null {
  if (!item) return null;

  // Real YouTube video IDs are strictly 11 characters
  let id = item.video_id || item.videoId || item.endpoint?.payload?.videoId;
  if (!id && isValidVideoId(item.id)) {
    id = item.id;
  }

  if (!id) return null;

  const title = item.title?.text || item.title || 'Unknown Title';

  const artists: { id?: string; name: string }[] = [];
  if (Array.isArray(item.artists)) {
    for (const a of item.artists) {
      if (typeof a === 'string') {
        artists.push({ name: a });
      } else if (a && (a.name || a.text)) {
        artists.push({ id: a.id || a.channel_id, name: a.name || a.text });
      }
    }
  } else if (item.author) {
    const authorName = typeof item.author === 'string' ? item.author : item.author.name || item.author.text;
    if (authorName) artists.push({ id: item.author.id, name: authorName });
  }

  let albumInfo: { id?: string; name: string } | undefined;
  if (item.album) {
    if (typeof item.album === 'string') {
      albumInfo = { name: item.album };
    } else if (item.album.name || item.album.text || item.album.title) {
      albumInfo = {
        id: item.album.id || item.album.browse_id,
        name: item.album.name || item.album.text || item.album.title,
      };
    }
  }

  const durationSec =
    typeof item.duration?.seconds === 'number'
      ? item.duration.seconds
      : parseDuration(item.duration?.text || item.duration);

  const thumbnail = getBestThumbnail(item.thumbnails || item.thumbnail);
  const isExplicit = Array.isArray(item.badges)
    ? item.badges.some((b: any) => b.label?.toLowerCase().includes('explicit') || b.is_explicit)
    : false;

  return {
    id,
    title,
    artists: artists.length > 0 ? artists : [{ name: 'Unknown Artist' }],
    album: albumInfo,
    duration: durationSec,
    durationFormatted: formatDuration(durationSec),
    thumbnail,
    isExplicit,
  };
}

// Normalizer: Artist
export function normalizeArtist(item: any): ArtistItem | null {
  if (!item) return null;
  const id = item.id || item.channel_id || item.browse_id || item.endpoint?.payload?.browseId;
  if (!id || isValidVideoId(id)) return null;

  const name = item.name?.text || item.name || item.title?.text || item.title || 'Unknown Artist';
  const thumbnail = getBestThumbnail(item.thumbnails || item.thumbnail);
  const subscribers = item.subscribers?.text || item.subscribers || item.subtitle?.text;
  const description = item.description?.text || item.description;

  return {
    id,
    name,
    thumbnail,
    subscribers,
    description,
  };
}

// Normalizer: Album
export function normalizeAlbum(item: any): AlbumItem | null {
  if (!item) return null;
  const id = item.id || item.browse_id || item.album_id || item.endpoint?.payload?.browseId;
  if (!id || isValidVideoId(id) || id.startsWith('UC')) return null;

  const title = item.title?.text || item.title || 'Unknown Album';
  const artists: { id?: string; name: string }[] = [];
  if (Array.isArray(item.artists)) {
    for (const a of item.artists) {
      artists.push({ id: a.id, name: a.name || a.text });
    }
  } else if (item.author) {
    const authorName = typeof item.author === 'string' ? item.author : item.author.name || item.author.text;
    if (authorName) artists.push({ id: item.author.id, name: authorName });
  }

  const year = item.year?.text || item.year || item.subtitle?.text;
  const thumbnail = getBestThumbnail(item.thumbnails || item.thumbnail);
  const trackCount = item.track_count || item.song_count;

  return {
    id,
    title,
    artists: artists.length > 0 ? artists : [{ name: 'Various Artists' }],
    year,
    thumbnail,
    trackCount,
  };
}

// Normalizer: Playlist
export function normalizePlaylist(item: any): PlaylistItem | null {
  if (!item) return null;
  const id = item.id || item.playlist_id || item.browse_id || item.endpoint?.payload?.browseId;
  if (!id || isValidVideoId(id) || id.startsWith('UC')) return null;

  const title = item.title?.text || item.title || 'Unknown Playlist';
  const author = item.author?.name || item.author?.text || item.author;
  const thumbnail = getBestThumbnail(item.thumbnails || item.thumbnail);
  const trackCount = item.track_count || item.song_count;
  const description = item.description?.text || item.description;

  return {
    id,
    title,
    author,
    thumbnail,
    trackCount,
    description,
  };
}

export class InnertubeService {
  private static instance: InnertubeService | null = null;
  private yt: Innertube | null = null;
  private isReady = false;

  private constructor() {}

  static getInstance(): InnertubeService {
    if (!InnertubeService.instance) {
      InnertubeService.instance = new InnertubeService();
    }
    return InnertubeService.instance;
  }

  async init(maxRetries = 3): Promise<Innertube> {
    if (this.yt && this.isReady) return this.yt;
    if (initPromise) return initPromise;

    console.log('[INFO] Initializing Innertube');
    isInitializing = true;

    initPromise = (async () => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          attempt++;
          // UniversalCache prevents excessive network requests and optimizes session cache
          const yt = await Innertube.create({
            cache: new UniversalCache(true),
            generate_session_locally: true,
          });

          this.yt = yt;
          innertubeInstance = yt;
          this.isReady = true;
          isInitializing = false;

          console.log('[INFO] Innertube initialized');
          console.log('[INFO] Music service ready');
          return yt;
        } catch (err: any) {
          console.error(`[RETRY] Attempt ${attempt}/${maxRetries} failed to initialize Innertube:`, err?.message || err);
          if (attempt >= maxRetries) {
            isInitializing = false;
            initPromise = null;
            throw new Error(`[ERROR] Upstream unavailable after ${maxRetries} attempts`);
          }
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
      throw new Error('[ERROR] Upstream unavailable');
    })();

    return initPromise;
  }

  async getClient(): Promise<Innertube> {
    if (!this.yt || !this.isReady) {
      return await this.init();
    }
    return this.yt;
  }

  isOnline(): boolean {
    return this.isReady && !!this.yt;
  }

  // --- SEARCH ---
  async search(query: string, filter?: string, continuationToken?: string): Promise<{
    results: SearchResults;
    continuation?: string;
    hasMore: boolean;
  }> {
    const yt = await this.getClient();
    console.log(`[SEARCH] query="${query}" filter="${filter || 'all'}" continuation="${!!continuationToken}"`);

    const results: SearchResults = {
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
    };

    let nextContinuation: string | undefined;

    try {
      if (continuationToken) {
        // Continue previous search
        // In youtubei.js, music.search returns continuation or we can call actions
        const continued: any = await yt.actions.execute('/search', {
          continuation: continuationToken,
          parse: true,
        });

        if (continued?.contents?.contents) {
          for (const item of continued.contents.contents) {
            const song = normalizeSong(item);
            if (song) results.songs.push(song);
          }
          nextContinuation = continued.contents.continuation;
        }
      } else if (filter) {
        const typeMap: Record<string, string> = {
          songs: 'song',
          song: 'song',
          artists: 'artist',
          artist: 'artist',
          albums: 'album',
          album: 'album',
          playlists: 'playlist',
          playlist: 'playlist',
        };
        const searchType = typeMap[filter.toLowerCase()] || filter;
        const searchRes: any = await yt.music.search(query, { type: searchType as any });

        if (searchRes.contents) {
          for (const section of searchRes.contents) {
            const items = section.contents || [];
            for (const raw of items) {
              if (searchType === 'song') {
                const s = normalizeSong(raw);
                if (s) results.songs.push(s);
              } else if (searchType === 'artist') {
                const a = normalizeArtist(raw);
                if (a) results.artists.push(a);
              } else if (searchType === 'album') {
                const al = normalizeAlbum(raw);
                if (al) results.albums.push(al);
              } else if (searchType === 'playlist') {
                const p = normalizePlaylist(raw);
                if (p) results.playlists.push(p);
              }
            }
            if (section.continuation) {
              nextContinuation = section.continuation;
            }
          }
        }
      } else {
        // Multi-category search
        const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.allSettled([
          yt.music.search(query, { type: 'song' }),
          yt.music.search(query, { type: 'artist' }),
          yt.music.search(query, { type: 'album' }),
          yt.music.search(query, { type: 'playlist' }),
        ]);

        if (songsRes.status === 'fulfilled' && (songsRes.value as any)?.contents) {
          for (const s of (songsRes.value as any).contents) {
            for (const item of s.contents || []) {
              const song = normalizeSong(item);
              if (song) results.songs.push(song);
            }
          }
        }
        if (artistsRes.status === 'fulfilled' && (artistsRes.value as any)?.contents) {
          for (const s of (artistsRes.value as any).contents) {
            for (const item of s.contents || []) {
              const artist = normalizeArtist(item);
              if (artist) results.artists.push(artist);
            }
          }
        }
        if (albumsRes.status === 'fulfilled' && (albumsRes.value as any)?.contents) {
          for (const s of (albumsRes.value as any).contents) {
            for (const item of s.contents || []) {
              const album = normalizeAlbum(item);
              if (album) results.albums.push(album);
            }
          }
        }
        if (playlistsRes.status === 'fulfilled' && (playlistsRes.value as any)?.contents) {
          for (const s of (playlistsRes.value as any).contents) {
            for (const item of s.contents || []) {
              const playlist = normalizePlaylist(item);
              if (playlist) results.playlists.push(playlist);
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`[ERROR] Search failed for query "${query}":`, err?.message || err);
      throw err;
    }

    return {
      results,
      continuation: nextContinuation,
      hasMore: !!nextContinuation,
    };
  }

  // --- HOME FEED ---
  async getHomeFeed(): Promise<HomeSection[]> {
    const yt = await this.getClient();
    console.log('[INNERTUBE] Fetching Home feed');

    const home: any = await yt.music.getHomeFeed();
    const sections: HomeSection[] = [];

    if (home?.sections && Array.isArray(home.sections)) {
      for (const rawSec of home.sections) {
        const title =
          rawSec.header?.title?.text ||
          rawSec.header?.title ||
          rawSec.title?.text ||
          rawSec.title ||
          'Featured Releases';
        const rawItems = rawSec.contents || [];
        const items: any[] = [];

        for (const item of rawItems) {
          const type = (item.type || '').toLowerCase();
          const rawId = String(
            item.id || item.video_id || item.videoId || item.endpoint?.payload?.videoId || ''
          );

          if (
            type.includes('playlist') ||
            rawId.startsWith('VL') ||
            rawId.startsWith('PL') ||
            rawId.startsWith('RD')
          ) {
            const playlist = normalizePlaylist(item);
            if (playlist) {
              items.push(playlist);
              continue;
            }
          }

          if (type.includes('album') || rawId.startsWith('MPREb') || rawId.startsWith('MPED')) {
            const album = normalizeAlbum(item);
            if (album) {
              items.push(album);
              continue;
            }
          }

          if (type.includes('artist') || rawId.startsWith('UC')) {
            const artist = normalizeArtist(item);
            if (artist) {
              items.push(artist);
              continue;
            }
          }

          const song = normalizeSong(item);
          if (song) {
            items.push(song);
            continue;
          }

          const pl = normalizePlaylist(item);
          if (pl) {
            items.push(pl);
            continue;
          }

          const alb = normalizeAlbum(item);
          if (alb) {
            items.push(alb);
            continue;
          }
        }

        if (items.length > 0) {
          sections.push({
            title,
            type: 'mixed',
            items,
          });
        }
      }
    }

    return sections;
  }

  // --- TRENDING / EXPLORE ---
  async getTrending(): Promise<HomeSection[]> {
    const yt = await this.getClient();
    console.log('[INNERTUBE] Fetching Explore / Trending');

    const explore: any = await yt.music.getExplore();
    const sections: HomeSection[] = [];

    if (explore?.sections && Array.isArray(explore.sections)) {
      for (const rawSec of explore.sections) {
        const title =
          rawSec.header?.title?.text ||
          rawSec.header?.title ||
          rawSec.title?.text ||
          rawSec.title ||
          'Trending';
        const rawItems = rawSec.contents || [];
        const items: any[] = [];

        for (const item of rawItems) {
          const type = (item.type || '').toLowerCase();
          const rawId = String(
            item.id || item.video_id || item.videoId || item.endpoint?.payload?.videoId || ''
          );

          if (
            type.includes('playlist') ||
            rawId.startsWith('VL') ||
            rawId.startsWith('PL') ||
            rawId.startsWith('RD')
          ) {
            const playlist = normalizePlaylist(item);
            if (playlist) {
              items.push(playlist);
              continue;
            }
          }

          if (type.includes('album') || rawId.startsWith('MPREb') || rawId.startsWith('MPED')) {
            const album = normalizeAlbum(item);
            if (album) {
              items.push(album);
              continue;
            }
          }

          if (type.includes('artist') || rawId.startsWith('UC')) {
            const artist = normalizeArtist(item);
            if (artist) {
              items.push(artist);
              continue;
            }
          }

          const song = normalizeSong(item);
          if (song) {
            items.push(song);
            continue;
          }

          const pl = normalizePlaylist(item);
          if (pl) {
            items.push(pl);
            continue;
          }

          const alb = normalizeAlbum(item);
          if (alb) {
            items.push(alb);
            continue;
          }
        }

        if (items.length > 0) {
          sections.push({
            title,
            type: 'mixed',
            items,
          });
        }
      }
    }

    // If explore.top_songs exists
    if (explore?.top_songs?.contents) {
      const topSongs: SongItem[] = [];
      for (const item of explore.top_songs.contents) {
        const song = normalizeSong(item);
        if (song) topSongs.push(song);
      }
      if (topSongs.length > 0) {
        sections.unshift({
          title: 'Top Charts & Songs',
          type: 'songs',
          items: topSongs,
        });
      }
    }

    return sections;
  }

  // --- SONG DETAIL ---
  async getSong(videoId: string): Promise<any> {
    const yt = await this.getClient();
    console.log(`[INNERTUBE] Fetching Song details for videoId=${videoId}`);

    try {
      let info: any = null;
      try {
        info = await yt.getInfo(videoId);
      } catch {
        info = await yt.music.getInfo(videoId).catch(() => null);
      }

      const title =
        info?.primary_info?.title?.text ||
        info?.basic_info?.title ||
        info?.title ||
        'Unknown Title';
      const author =
        info?.secondary_info?.owner?.author?.name ||
        info?.basic_info?.author ||
        info?.author ||
        'Unknown Artist';
      const duration = info?.basic_info?.duration || 0;
      const thumbnails =
        info?.basic_info?.thumbnail ||
        info?.basic_info?.thumbnails ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      const description =
        info?.basic_info?.short_description ||
        info?.secondary_info?.description?.text;

      const rawThumb = getBestThumbnail(thumbnails);
      const thumbnail =
        !rawThumb || rawThumb.includes('unsplash')
          ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          : rawThumb;

      return {
        id: videoId,
        title,
        artists: [{ name: author }],
        duration,
        durationFormatted: formatDuration(duration),
        thumbnail,
        description,
        isExplicit: false,
      };
    } catch (err: any) {
      console.error(`[ERROR] Failed to fetch song details for ${videoId}:`, err?.message || err);
      throw err;
    }
  }

  // --- STREAMING URL ---
  async getStreamUrl(videoId: string): Promise<StreamResponse> {
    const yt = await this.getClient();
    console.log(`[STREAM] Extracting audio format for videoId=${videoId}`);

    try {
      // 1. Try Innertube getStreamingData or getBasicInfo
      const info: any = await yt.getBasicInfo(videoId).catch(() => null);

      if (info && info.streaming_data) {
        const format = info.chooseFormat({ type: 'audio', quality: 'best' });
        if (format) {
          const decipheredUrl = format.decipher(yt.session.player);
          if (decipheredUrl) {
            console.log(`[STREAM] Audio URL ready for videoId=${videoId}`);
            return {
              success: true,
              videoId,
              url: decipheredUrl,
              mimeType: format.mime_type || 'audio/mp4',
              bitrate: format.bitrate || 128000,
              quality: 'High Quality Audio',
              expiresIn: 3600 * 6,
              isDirect: true,
            };
          }
        }
      }

      // If streaming_data not available due to datacenter IP restrictions
      console.log(`[STREAM] Server-side direct stream URL unavailable from datacenter IP for ${videoId}`);
      return {
        success: false,
        code: 'UPSTREAM_UNAVAILABLE',
        error: 'Direct streaming URL restricted by upstream bot protection. Native client player will handle playback.',
        retryable: true,
      };
    } catch (err: any) {
      console.error(`[ERROR] Stream resolution error for ${videoId}:`, err?.message || err);
      return {
        success: false,
        code: 'UPSTREAM_UNAVAILABLE',
        error: err?.message || 'Failed to extract streaming format',
        retryable: true,
      };
    }
  }

  // --- LYRICS ---
  async getLyrics(videoId: string): Promise<LyricsResponse> {
    const yt = await this.getClient();
    console.log(`[LYRICS] Fetching lyrics for videoId=${videoId}`);

    try {
      const lyricsInfo: any = await yt.music.getLyrics(videoId);

      if (lyricsInfo && lyricsInfo.description?.text) {
        const plainText = lyricsInfo.description.text;
        const lines: { text: string }[] = plainText
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean)
          .map((text: string) => ({ text }));

        console.log(`[LYRICS] Found lyrics (${lines.length} lines)`);
        return {
          success: true,
          type: 'plain',
          lines,
          syncAvailable: false,
        };
      }

      return {
        success: false,
        code: 'LYRICS_UNAVAILABLE',
        error: 'Lyrics not available for this song',
      };
    } catch (err: any) {
      console.log(`[LYRICS] Unavailable for ${videoId}: ${err?.message}`);
      return {
        success: false,
        code: 'LYRICS_UNAVAILABLE',
        error: 'Lyrics not available for this song',
      };
    }
  }

  // --- RELATED SONGS ---
  async getRelated(videoId: string): Promise<SongItem[]> {
    const yt = await this.getClient();
    console.log(`[INNERTUBE] Fetching related songs for videoId=${videoId}`);

    try {
      const related: any = await yt.music.getRelated(videoId).catch(() => null);
      const songs: SongItem[] = [];

      if (related?.sections) {
        for (const section of related.sections) {
          for (const item of section.contents || []) {
            const song = normalizeSong(item);
            if (song && song.id !== videoId) songs.push(song);
          }
        }
      }

      // If related sections had no items, use up-next
      if (songs.length === 0) {
        const upNext: any = await yt.music.getUpNext(videoId).catch(() => null);
        if (upNext?.contents) {
          for (const item of upNext.contents) {
            const song = normalizeSong(item);
            if (song && song.id !== videoId) songs.push(song);
          }
        }
      }

      return songs;
    } catch (err: any) {
      console.error(`[ERROR] Failed to fetch related for ${videoId}:`, err?.message || err);
      return [];
    }
  }

  // --- ARTIST ---
  async getArtist(artistId: string): Promise<{
    artist: ArtistItem;
    topSongs: SongItem[];
    albums: AlbumItem[];
    singles: AlbumItem[];
    relatedArtists: ArtistItem[];
  }> {
    const yt = await this.getClient();
    console.log(`[INNERTUBE] Fetching artist data for ${artistId}`);

    const artistData: any = await yt.music.getArtist(artistId);

    const name =
      artistData.header?.title?.text || artistData.header?.title || 'Unknown Artist';
    const thumbnail = getBestThumbnail(artistData.header?.thumbnails || artistData.header?.thumbnail);
    const description = artistData.header?.description?.text || artistData.header?.description;
    const subscribers = artistData.header?.subscribers?.text || artistData.header?.subscribers;

    const artist: ArtistItem = {
      id: artistId,
      name,
      thumbnail,
      description,
      subscribers,
    };

    const topSongs: SongItem[] = [];
    const albums: AlbumItem[] = [];
    const singles: AlbumItem[] = [];
    const relatedArtists: ArtistItem[] = [];

    if (artistData.sections) {
      for (const section of artistData.sections) {
        const sectionTitle = (
          section.title?.text ||
          section.title ||
          section.header?.title?.text ||
          section.header?.title ||
          ''
        ).toLowerCase();
        const items = section.contents || [];

        if (sectionTitle.includes('songs') || sectionTitle.includes('top songs')) {
          for (const item of items) {
            const s = normalizeSong(item);
            if (s) topSongs.push(s);
          }
        } else if (sectionTitle.includes('album')) {
          for (const item of items) {
            const al = normalizeAlbum(item);
            if (al) albums.push(al);
          }
        } else if (sectionTitle.includes('single') || sectionTitle.includes('ep')) {
          for (const item of items) {
            const si = normalizeAlbum(item);
            if (si) singles.push(si);
          }
        } else if (sectionTitle.includes('fans also like') || sectionTitle.includes('similar')) {
          for (const item of items) {
            const ra = normalizeArtist(item);
            if (ra) relatedArtists.push(ra);
          }
        }
      }
    }

    return {
      artist,
      topSongs,
      albums,
      singles,
      relatedArtists,
    };
  }

  // --- ARTIST SONGS (NO ARTIFICIAL LIMIT) ---
  async getArtistSongs(
    artistId: string,
    continuationToken?: string
  ): Promise<{
    items: SongItem[];
    continuation?: string;
    hasMore: boolean;
  }> {
    const yt = await this.getClient();
    console.log(`[INNERTUBE] Fetching artist songs for ${artistId}, continuation=${!!continuationToken}`);

    const items: SongItem[] = [];
    let nextContinuation: string | undefined;

    try {
      if (continuationToken) {
        const continued: any = await yt.actions.execute('/browse', {
          continuation: continuationToken,
          parse: true,
        });

        if (continued?.contents) {
          const contentsList = Array.isArray(continued.contents)
            ? continued.contents
            : continued.contents.contents || [];

          for (const item of contentsList) {
            const song = normalizeSong(item);
            if (song) items.push(song);
          }
          nextContinuation = continued.continuation || continued.contents?.continuation;
        }
      } else {
        // Fetch artist details and locate the songs shelf endpoint or top songs
        const artistData: any = await yt.music.getArtist(artistId);
        const songsSection = artistData.sections?.find((s: any) => {
          const t = (s.title?.text || s.title || '').toLowerCase();
          return t.includes('songs') || t.includes('top songs');
        });

        if (songsSection?.endpoint) {
          // Follow navigation endpoint to browse all songs
          const allSongsBrowse: any = await songsSection.endpoint.call(yt.actions, { parse: true });
          const rawItems =
            allSongsBrowse.contents?.contents ||
            allSongsBrowse.contents?.items ||
            (allSongsBrowse.contents?.item && allSongsBrowse.contents.item()?.contents) ||
            [];

          for (const item of rawItems) {
            const song = normalizeSong(item);
            if (song) items.push(song);
          }

          nextContinuation =
            allSongsBrowse.continuation ||
            allSongsBrowse.contents?.continuation ||
            (allSongsBrowse.contents?.item && allSongsBrowse.contents.item()?.continuation);
        } else if (songsSection?.contents) {
          for (const item of songsSection.contents) {
            const song = normalizeSong(item);
            if (song) items.push(song);
          }
          nextContinuation = songsSection.continuation;
        }

        // If artist had few songs in section, also query songs by artist name to populate comprehensive catalog
        if (items.length < 10) {
          const artistName = artistData.header?.title?.text || artistData.header?.title;
          if (artistName) {
            const searchSongs = await yt.music.search(artistName, { type: 'song' });
            for (const sec of (searchSongs as any).contents || []) {
              for (const it of sec.contents || []) {
                const s = normalizeSong(it);
                if (s && !items.some((existing) => existing.id === s.id)) {
                  items.push(s);
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`[ERROR] Failed to fetch artist songs for ${artistId}:`, err?.message || err);
    }

    return {
      items,
      continuation: nextContinuation,
      hasMore: !!nextContinuation,
    };
  }

  // --- ARTIST ALBUMS ---
  async getArtistAlbums(artistId: string): Promise<AlbumItem[]> {
    const artistData = await this.getArtist(artistId);
    return [...artistData.albums, ...artistData.singles];
  }

  // --- ALBUM ---
  async getAlbum(albumId: string): Promise<{
    album: AlbumItem;
    tracks: SongItem[];
  }> {
    const yt = await this.getClient();
    console.log(`[INNERTUBE] Fetching album details for ${albumId}`);

    const rawAlbum: any = await yt.music.getAlbum(albumId);

    const title =
      rawAlbum.header?.title?.text ||
      rawAlbum.header?.title ||
      rawAlbum.title?.text ||
      rawAlbum.title ||
      'Unknown Album';
    const thumbnail = getBestThumbnail(
      rawAlbum.header?.thumbnails ||
      rawAlbum.header?.thumbnail ||
      rawAlbum.thumbnails ||
      rawAlbum.thumbnail
    );
    const artists: { id?: string; name: string }[] = [];

    if (Array.isArray(rawAlbum.artists)) {
      for (const a of rawAlbum.artists) {
        artists.push({ id: a.id, name: a.name || a.text });
      }
    } else if (rawAlbum.author) {
      artists.push({
        id: rawAlbum.author.id,
        name: rawAlbum.author.name || rawAlbum.author.text || rawAlbum.author,
      });
    }

    const year = rawAlbum.year?.text || rawAlbum.year;
    const trackCount = rawAlbum.contents?.length || rawAlbum.track_count;

    const album: AlbumItem = {
      id: albumId,
      title,
      artists: artists.length > 0 ? artists : [{ name: 'Unknown Artist' }],
      year,
      thumbnail,
      trackCount,
    };

    const tracks: SongItem[] = [];
    if (rawAlbum.contents && Array.isArray(rawAlbum.contents)) {
      for (const rawTrack of rawAlbum.contents) {
        const track = normalizeSong(rawTrack);
        if (track) {
          // Ensure album info is attached
          track.album = { id: albumId, name: title };
          if (track.thumbnail.includes('unsplash') && thumbnail) {
            track.thumbnail = thumbnail;
          }
          tracks.push(track);
        }
      }
    }

    return { album, tracks };
  }

  // --- PLAYLIST ---
  async getPlaylist(
    playlistId: string,
    continuationToken?: string
  ): Promise<{
    playlist: PlaylistItem;
    tracks: SongItem[];
    continuation?: string;
    hasMore: boolean;
  }> {
    const yt = await this.getClient();
    console.log(`[INNERTUBE] Fetching playlist ${playlistId}, continuation=${!!continuationToken}`);

    let rawPlaylist: any;
    let nextContinuation: string | undefined;

    if (continuationToken) {
      rawPlaylist = await yt.actions.execute('/browse', {
        continuation: continuationToken,
        parse: true,
      });
    } else {
      rawPlaylist = await yt.music.getPlaylist(playlistId);
    }

    const title = rawPlaylist.title?.text || rawPlaylist.title || 'Playlist';
    const author =
      rawPlaylist.author?.name ||
      rawPlaylist.author?.text ||
      rawPlaylist.header?.author?.name ||
      'YouTube Music';
    const thumbnail = getBestThumbnail(rawPlaylist.thumbnails || rawPlaylist.thumbnail);
    const description = rawPlaylist.description?.text || rawPlaylist.description;

    const tracks: SongItem[] = [];
    const contents = rawPlaylist.contents || rawPlaylist.items || [];

    for (const item of contents) {
      const song = normalizeSong(item);
      if (song) tracks.push(song);
    }

    nextContinuation = rawPlaylist.continuation;

    const playlist: PlaylistItem = {
      id: playlistId,
      title,
      author,
      thumbnail,
      trackCount: tracks.length,
      description,
    };

    return {
      playlist,
      tracks,
      continuation: nextContinuation,
      hasMore: !!nextContinuation,
    };
  }
}

export const innertubeService = InnertubeService.getInstance();
