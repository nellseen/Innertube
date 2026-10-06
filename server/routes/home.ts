import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

// GET /api/home
router.get('/home', async (req: Request, res: Response) => {
  const cacheKey = 'home_feed';
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, sections: cached });
  }

  try {
    const sections = await innertubeService.getHomeFeed();
    appCache.set(cacheKey, sections, 10 * 60 * 1000); // 10 mins TTL
    return res.json({ success: true, sections });
  } catch (err: any) {
    console.error('[ERROR] /api/home failed:', err?.message || err);
    // Partial recovery attempt: try getting trending sections if home feed had an error
    try {
      const fallbackSections = await innertubeService.getTrending();
      return res.json({ success: true, sections: fallbackSections });
    } catch {
      return res.status(503).json({
        success: false,
        code: 'UPSTREAM_UNAVAILABLE',
        error: 'YouTube Music home feed currently unavailable',
        retryable: true,
      });
    }
  }
});

// GET /api/trending
router.get('/trending', async (req: Request, res: Response) => {
  const cacheKey = 'trending_feed';
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({ success: true, sections: cached });
  }

  try {
    const sections = await innertubeService.getTrending();
    appCache.set(cacheKey, sections, 15 * 60 * 1000); // 15 mins TTL
    return res.json({ success: true, sections });
  } catch (err: any) {
    console.error('[ERROR] /api/trending failed:', err?.message || err);
    return res.status(503).json({
      success: false,
      code: 'UPSTREAM_UNAVAILABLE',
      error: 'Trending songs currently unavailable',
      retryable: true,
    });
  }
});

export default router;
