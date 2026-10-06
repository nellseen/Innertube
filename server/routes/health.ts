import { Router, Request, Response } from 'express';
import { innertubeService } from '../innertube.js';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const isInnertubeOnline = innertubeService.isOnline();
  res.json({
    success: true,
    backend: 'online',
    innertube: isInnertubeOnline ? 'online' : 'degraded',
  });
});

export default router;
