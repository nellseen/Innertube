import type { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  maxTrackedIps?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** Small fixed-window limiter for this single-process API server. */
export function createRateLimiter({
  windowMs,
  maxRequests,
  maxTrackedIps = 10_000,
}: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(ip);
    }
  }, Math.min(windowMs, 60_000));
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = entries.get(ip);

    if (!entry || entry.resetAt <= now) {
      if (entries.size >= maxTrackedIps) {
        for (const [trackedIp, trackedEntry] of entries) {
          if (trackedEntry.resetAt <= now) entries.delete(trackedIp);
        }
      }
      if (entries.size >= maxTrackedIps) {
        res.set('Retry-After', String(Math.ceil(windowMs / 1000)));
        return res.status(503).json({
          success: false,
          code: 'RATE_LIMIT_CAPACITY',
          error: 'Request limiter is at capacity; retry shortly',
          retryable: true,
        });
      }
      entry = { count: 0, resetAt: now + windowMs };
      entries.set(ip, entry);
    }

    entry.count += 1;
    res.set('RateLimit-Limit', String(maxRequests));
    res.set('RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        error: 'Too many requests; retry after the rate-limit window',
        retryable: true,
      });
    }

    return next();
  };
}
