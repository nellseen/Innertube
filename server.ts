import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoute from './server/routes/health.js';
import homeRoute from './server/routes/home.js';
import searchRoute from './server/routes/search.js';
import songRoute from './server/routes/song.js';
import artistRoute from './server/routes/artist.js';
import albumRoute from './server/routes/album.js';
import playlistRoute from './server/routes/playlist.js';
import chordRoute from './server/routes/chord.js';
import { innertubeService } from './server/innertube.js';
import { appCache } from './server/cache.js';
import { deepSanitizeResponse } from './server/sanitizer.js';
import { createRateLimiter } from './server/rate-limit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Only trust explicitly configured proxy hops. Without this, clients cannot
// spoof their rate-limit identity through X-Forwarded-For.
const proxyHops = process.env.TRUST_PROXY_HOPS;
if (proxyHops && /^\d+$/.test(proxyHops)) {
  app.set('trust proxy', Number(proxyHops));
}

const allowedOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS configuration (Security Section 38)
app.use(
  cors({
    origin: (origin, callback) => {
      // The API is public; wildcard CORS is safe here because credentials are
      // disabled. Deployments can restrict browser origins with CORS_ORIGINS.
      callback(null, !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin));
    },
    credentials: false,
  })
);

app.use(express.json({ limit: '32kb' }));

// Bound request volume globally and more tightly on routes that make costly
// upstream requests. The limiter uses req.ip and a bounded in-memory map.
app.use('/api', createRateLimiter({ windowMs: 60_000, maxRequests: 120 }));
app.use('/api/search', createRateLimiter({ windowMs: 60_000, maxRequests: 30 }));
app.use('/api/chord', createRateLimiter({ windowMs: 60_000, maxRequests: 10 }));

// Universal JSON response sanitizer middleware (prevents any { rtl: ... } from leaking)
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function (body: any) {
    return originalJson.call(this, deepSanitizeResponse(body));
  };
  next();
});

// API Routes
app.use('/api', healthRoute);
app.use('/api', homeRoute);
app.use('/api', searchRoute);
app.use('/api', songRoute);
app.use('/api', artistRoute);
app.use('/api', albumRoute);
app.use('/api', playlistRoute);
app.use('/api', chordRoute);

// Standard JSON Error handler
app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] Unhandled API error:', err?.message || err);
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    error: err?.message || 'Internal server error occurred',
    retryable: true,
  });
});

async function startServer() {
  // Initialize Innertube background service
  try {
    await innertubeService.init();
  } catch (err: any) {
    console.error('[WARN] Non-blocking Innertube initial error (will retry on demand):', err?.message);
  }

  // Dev vs Prod Vite Integration
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFO] API server ready on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown (Section 44)
  const shutdown = () => {
    console.log('[INFO] Stopping server and cleaning up resources...');
    appCache.destroy();
    server.close(() => {
      console.log('[INFO] Server stopped gracefully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Fatal asynchronous/process errors leave server state uncertain; exit so a
  // process manager can restart a clean instance.
  const fatalError = (label: string, err: any) => {
    console.error(`[FATAL] ${label}; shutting down so the process manager can restart safely:`, err?.stack || err);
    appCache.destroy();
    server.close(() => process.exit(1));
    // Do not wait forever for stuck connections after a fatal process error.
    setTimeout(() => process.exit(1), 5_000).unref();
  };

  process.on('unhandledRejection', (reason: any) => fatalError('Unhandled rejection', reason));
  process.on('uncaughtException', (err: any) => fatalError('Uncaught exception', err));
}

startServer().catch((err) => {
  console.error('[ERROR] Failed to start server:', err);
  process.exit(1);
});
