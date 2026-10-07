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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// CORS configuration (Security Section 38)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

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

  // Guard against unhandled rejections or player decipher errors from crashing the server
  process.on('unhandledRejection', (reason: any) => {
    console.warn('[WARN] Process unhandledRejection (non-fatal):', reason?.message || reason);
  });
  process.on('uncaughtException', (err: any) => {
    console.error('[WARN] Process uncaughtException (non-fatal):', err?.message || err);
  });
}

startServer().catch((err) => {
  console.error('[ERROR] Failed to start server:', err);
  process.exit(1);
});
