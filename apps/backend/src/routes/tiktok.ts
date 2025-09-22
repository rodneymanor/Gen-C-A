import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  getTikTokFeedService,
  TikTokFeedServiceError,
} from '../../../../src/services/video/tiktok-feed-service.js';

function extractTikTokParams(req: Request) {
  if (req.method.toUpperCase() === 'GET') {
    return {
      username: req.query.username ?? req.query.handle ?? req.query.user ?? req.query.id,
      count: req.query.count ?? req.query.limit,
    };
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  return {
    username: body.username ?? body.handle ?? body.user ?? body.id,
    count: body.count ?? body.limit,
  };
}

function normaliseCount(raw: unknown) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function handleTikTokError(res: Response, error: unknown) {
  if (error instanceof TikTokFeedServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Failed to fetch TikTok user feed';
  console.error('[backend][tiktok] unexpected error:', message);
  res.status(500).json({ success: false, error: message });
}

async function handleTikTokUserFeed(req: Request, res: Response) {
  const { username, count } = extractTikTokParams(req);
  const parsedCount = normaliseCount(count);

  if (!username) {
    res.status(400).json({ success: false, error: 'Username is required' });
    return;
  }

  try {
    const service = getTikTokFeedService();
    const result = await service.fetchUserFeed({
      username: Array.isArray(username) ? username[0] : String(username),
      count: parsedCount,
    });
    res.json(result);
  } catch (error) {
    handleTikTokError(res, error);
  }
}

export const tiktokRouter = Router();

tiktokRouter.post('/user-feed', handleTikTokUserFeed);
tiktokRouter.get('/user-feed', handleTikTokUserFeed);
