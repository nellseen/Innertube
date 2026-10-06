import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

// GET /api/album/:albumId
router.get('/album/:albumId', async (req: Request, res: Response) => {
  const { albumId } = req.params;
  if (!albumId) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Invalid albumId parameter',
      retryable: false,
    });
  }

  const cacheKey = `album_${albumId}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, ...cached });
  }

  try {
    const data = await innertubeService.getAlbum(albumId);
    appCache.set(cacheKey, data, 60 * 60 * 1000); // 1 hour
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error(`[ERROR] /api/album/${albumId} failed:`, err?.message || err);
    return res.status(404).json({
      success: false,
      code: 'CONTENT_UNAVAILABLE',
      error: 'Album not found or unavailable',
      retryable: false,
    });
  }
});

export default router;
