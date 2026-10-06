import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

// GET /api/playlist/:playlistId
router.get('/playlist/:playlistId', async (req: Request, res: Response) => {
  const { playlistId } = req.params;
  const continuation = req.query.continuation as string | undefined;

  if (!playlistId) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid playlistId parameter',
      retryable: false,
    });
  }

  const cacheKey = `playlist_${playlistId}_${continuation || 'initial'}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, ...cached });
  }

  try {
    const data = await innertubeService.getPlaylist(playlistId, continuation);
    appCache.set(cacheKey, data, 15 * 60 * 1000); // 15 mins
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error(`[ERROR] /api/playlist/${playlistId} failed:`, err?.message || err);
    return res.status(404).json({
      success: false,
      code: 'CONTENT_UNAVAILABLE',
      error: 'Playlist not found or unavailable',
      retryable: false,
    });
  }
});

export default router;
