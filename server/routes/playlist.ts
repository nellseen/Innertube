import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

// GET /api/playlist/:playlistId/import (complete public playlist)
router.get('/playlist/:playlistId/import', async (req: Request, res: Response) => {
  const { playlistId } = req.params;
  if (!playlistId || !/^[A-Za-z0-9_-]{10,}$/.test(playlistId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid playlist ID',
      retryable: false,
    });
  }

  try {
    const data = await innertubeService.importPlaylist(playlistId);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error(`[ERROR] /api/playlist/${playlistId}/import failed:`, err?.message || err);
    return res.status(404).json({
      success: false,
      code: 'CONTENT_UNAVAILABLE',
      error: 'Playlist could not be imported. It may be private or unavailable.',
      retryable: false,
    });
  }
});

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
