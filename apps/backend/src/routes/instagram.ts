import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  getInstagramService,
  InstagramServiceError,
} from '../../../../src/services/video/instagram-service.js';

function handleInstagramError(res: Response, error: unknown, fallback: string) {
  if (error instanceof InstagramServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
    return;
  }

  const message = error instanceof Error ? error.message : fallback;
  console.error('[backend][instagram] unexpected error:', message);
  res.status(500).json({ success: false, error: message });
}

async function resolveUserId(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const username = body.username ?? body.handle ?? body.user ?? body.id;
    const service = getInstagramService();
    const result = await service.getUserId(username);
    res.json(result);
  } catch (error) {
    handleInstagramError(res, error, 'Failed to resolve Instagram user ID');
  }
}

async function fetchUserReels(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as {
      userId?: string;
      count?: number;
      includeFeedVideo?: boolean;
      username?: string;
    };
    const service = getInstagramService();
    const result = await service.getUserReels(body);
    res.json(result);
  } catch (error) {
    handleInstagramError(res, error, 'Failed to fetch Instagram reels');
  }
}

export const instagramRouter = Router();

instagramRouter.post('/user-id', resolveUserId);
instagramRouter.post('/user-reels', fetchUserReels);
