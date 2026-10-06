import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

// Validate alphanumeric / dash / underscore YouTube ID
function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{10,14}$/.test(id);
}

// GET /api/song/:videoId
router.get('/song/:videoId', async (req: Request, res: Response) => {
  const { videoId } = req.params;
  if (!isValidVideoId(videoId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid videoId parameter',
      retryable: false,
    });
  }

  const cacheKey = `song_meta_${videoId}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, song: cached });
  }

  try {
    const song = await innertubeService.getSong(videoId);
    appCache.set(cacheKey, song, 60 * 60 * 1000); // 1 hour
    return res.json({ success: true, song });
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      code: 'VIDEO_UNAVAILABLE',
      error: 'Song not found or unavailable',
      retryable: false,
    });
  }
});

// GET /api/song/:videoId/stream & GET /api/stream/:videoId
const handleStream = async (req: Request, res: Response, forceRefresh = false) => {
  const { videoId } = req.params;
  if (!isValidVideoId(videoId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid videoId parameter',
      retryable: false,
    });
  }

  const cacheKey = `stream_url_${videoId}`;
  if (!forceRefresh) {
    const cached = appCache.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  try {
    const streamData = await innertubeService.getStreamUrl(videoId);
    if (streamData.success && streamData.url) {
      // Cache stream URL for 2 hours (less than YouTube expiry)
      appCache.set(cacheKey, streamData, 2 * 60 * 60 * 1000);
      return res.json(streamData);
    } else {
      return res.json(streamData);
    }
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      code: 'UPSTREAM_UNAVAILABLE',
      error: 'Failed to retrieve stream URL',
      retryable: true,
    });
  }
};

router.get('/song/:videoId/stream', (req, res) => handleStream(req, res, false));
router.get('/stream/:videoId', (req, res) => handleStream(req, res, false));
router.get('/stream/:videoId/refresh', (req, res) => handleStream(req, res, true));

// GET /api/song/:videoId/lyrics
router.get('/song/:videoId/lyrics', async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const title = (req.query.title as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  const duration = req.query.duration ? parseInt(req.query.duration as string, 10) : undefined;

  if (!isValidVideoId(videoId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid videoId parameter',
      retryable: false,
    });
  }

  const cacheKey = `lyrics_${videoId}_${title || ''}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const lyrics = await innertubeService.getLyrics(videoId, title, artist, duration);
    if (lyrics.success) {
      appCache.set(cacheKey, lyrics, 24 * 60 * 60 * 1000); // 24 hours
    }
    return res.json(lyrics);
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      code: 'LYRICS_UNAVAILABLE',
      error: 'Lyrics not available for this song',
      retryable: false,
    });
  }
});

// GET /api/song/:videoId/related
router.get('/song/:videoId/related', async (req: Request, res: Response) => {
  const { videoId } = req.params;
  if (!isValidVideoId(videoId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid videoId parameter',
      retryable: false,
    });
  }

  const cacheKey = `related_${videoId}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, items: cached });
  }

  try {
    const items = await innertubeService.getRelated(videoId);
    appCache.set(cacheKey, items, 30 * 60 * 1000); // 30 mins
    return res.json({ success: true, items });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      code: 'UPSTREAM_UNAVAILABLE',
      error: 'Failed to retrieve related songs',
      retryable: true,
    });
  }
});

export default router;
