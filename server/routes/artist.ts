import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

// GET /api/artists/popular or /api/artist/popular
const handlePopularArtists = async (req: Request, res: Response) => {
  const cacheKey = 'popular_artists_list';
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, artists: cached });
  }

  try {
    const artists = await innertubeService.getPopularArtists();
    appCache.set(cacheKey, artists, 60 * 60 * 1000); // 1 hour cache
    return res.json({ success: true, artists });
  } catch (err: any) {
    console.error('[ERROR] /api/artists/popular failed:', err?.message || err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      error: 'Failed to fetch popular artists',
    });
  }
};

router.get('/artists/popular', handlePopularArtists);
router.get('/artist/popular', handlePopularArtists);

// GET /api/artist/:artistId
router.get('/artist/:artistId', async (req: Request, res: Response) => {
  const { artistId } = req.params;
  if (!artistId || artistId.length < 3) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid artistId parameter',
      retryable: false,
    });
  }

  const cacheKey = `artist_${artistId}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, ...cached });
  }

  try {
    const data = await innertubeService.getArtist(artistId);
    appCache.set(cacheKey, data, 30 * 60 * 1000); // 30 mins
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error(`[ERROR] /api/artist/${artistId} failed:`, err?.message || err);
    return res.status(404).json({
      success: false,
      code: 'CONTENT_UNAVAILABLE',
      error: 'Artist not found or unavailable',
      retryable: false,
    });
  }
});

// GET /api/artist/:artistId/songs (NO ARTIFICIAL LIMIT, continuation support)
router.get('/artist/:artistId/songs', async (req: Request, res: Response) => {
  const { artistId } = req.params;
  const continuation = req.query.continuation as string | undefined;

  if (!artistId) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid artistId parameter',
      retryable: false,
    });
  }

  const cacheKey = `artist_songs_${artistId}_${continuation || 'initial'}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, ...cached });
  }

  try {
    const data = await innertubeService.getArtistSongs(artistId, continuation);
    appCache.set(cacheKey, data, 15 * 60 * 1000); // 15 mins
    return res.json({
      success: true,
      items: data.items,
      continuation: data.continuation,
      hasMore: data.hasMore,
    });
  } catch (err: any) {
    console.error(`[ERROR] /api/artist/${artistId}/songs failed:`, err?.message || err);
    return res.status(502).json({
      success: false,
      code: 'UPSTREAM_UNAVAILABLE',
      error: 'Failed to retrieve artist songs',
      retryable: true,
    });
  }
});

// GET /api/artist/:artistId/albums
router.get('/artist/:artistId/albums', async (req: Request, res: Response) => {
  const { artistId } = req.params;
  const cacheKey = `artist_albums_${artistId}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, albums: cached });
  }

  try {
    const albums = await innertubeService.getArtistAlbums(artistId);
    appCache.set(cacheKey, albums, 30 * 60 * 1000);
    return res.json({ success: true, albums });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      code: 'UPSTREAM_UNAVAILABLE',
      error: 'Failed to retrieve artist albums',
      retryable: true,
    });
  }
});

export default router;
