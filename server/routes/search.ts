import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';
import { appCache } from '../cache.js';

const router = Router();

async function handleSearch(
  req: Request,
  res: Response,
  filter?: string
) {
  const rawQuery = req.query.q;
  const rawContinuation = req.query.continuation;
  if ((rawQuery !== undefined && typeof rawQuery !== 'string') ||
      (rawContinuation !== undefined && typeof rawContinuation !== 'string')) {
    return res.status(400).json({ success: false, code: 'INVALID_REQUEST', error: 'Query parameters must be single strings', retryable: false });
  }
  const query = (rawQuery || '').trim();
  const continuation = rawContinuation as string | undefined;

  if (query.length > 200 || (continuation?.length || 0) > 16_000) {
    return res.status(400).json({ success: false, code: 'INVALID_REQUEST', error: 'Search query or continuation is too long', retryable: false });
  }

  if (!query && !continuation) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_REQUEST',
      error: 'Query parameter "q" or "continuation" is required',
      retryable: false,
    });
  }

  const cacheKey = `search_${filter || 'all'}_${query}_${continuation || ''}`;
  const cached = appCache.get<any>(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      query,
      results: cached.results,
      continuation: cached.continuation,
      hasMore: cached.hasMore,
    });
  }

  try {
    const data = await innertubeService.search(query, filter, continuation);
    appCache.set(cacheKey, data, 5 * 60 * 1000); // 5 mins cache
    return res.json({
      success: true,
      query,
      results: data.results,
      continuation: data.continuation,
      hasMore: data.hasMore,
    });
  } catch (err: any) {
    console.error(`[ERROR] Search failed for "${query}":`, err?.message || err);
    return res.status(502).json({
      success: false,
      code: 'UPSTREAM_UNAVAILABLE',
      error: 'Upstream search service unavailable',
      retryable: true,
    });
  }
}

// General Search
router.get('/search', (req, res) => handleSearch(req, res));

// Filtered Searches
router.get('/search/songs', (req, res) => handleSearch(req, res, 'songs'));
router.get('/search/artists', (req, res) => handleSearch(req, res, 'artists'));
router.get('/search/albums', (req, res) => handleSearch(req, res, 'albums'));
router.get('/search/playlists', (req, res) => handleSearch(req, res, 'playlists'));

export default router;
