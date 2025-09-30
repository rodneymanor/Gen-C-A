import type { Request, Response } from 'express';
import { Router } from 'express';

import { loadSharedModule } from '../services/shared-service-proxy.js';

type InstagramServiceErrorInstance = Error & { statusCode: number; debug?: unknown };

const instagramModule = loadSharedModule<any>(
  '../../../../src/services/video/instagram-service.js',
);
const getInstagramService = instagramModule?.getInstagramService as (() => any) | undefined;
const InstagramServiceError = instagramModule?.InstagramServiceError as
  | (new (message?: string, statusCode?: number, debug?: unknown) => InstagramServiceErrorInstance)
  | undefined;

const isInstagramError = (error: unknown): error is InstagramServiceErrorInstance =>
  typeof InstagramServiceError === 'function' && error instanceof InstagramServiceError;
import { registerAllMethods } from './utils/register-all-methods';

function handleInstagramError(res: Response, error: unknown, fallback: string) {
  if (isInstagramError(error)) {
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

function extractUsername(req: Request) {
  if (req.method.toUpperCase() === 'GET') {
    return (
      req.query.username ??
      req.query.handle ??
      req.query.user ??
      req.query.id ??
      null
    );
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  return body.username ?? body.handle ?? body.user ?? body.id ?? null;
}

function parseCount(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return undefined;
}

function extractReelsPayload(req: Request) {
  if (req.method.toUpperCase() === 'GET') {
    return {
      userId: req.query.userId ?? req.query.user_id ?? req.query.id ?? undefined,
      username: req.query.username ?? req.query.handle ?? undefined,
      count: parseCount(req.query.count ?? req.query.limit ?? req.query.max ?? undefined),
      includeFeedVideo: parseBoolean(
        req.query.includeFeedVideo ??
          req.query.include_feed_video ??
          req.query.feed ??
          req.query.includeFeed ??
          undefined,
      ),
    };
  }

  const body = (req.body ?? {}) as {
    userId?: string;
    count?: number | string;
    includeFeedVideo?: boolean | string;
    username?: string;
    user_id?: string;
    include_feed_video?: boolean | string;
    includeFeed?: boolean | string;
    include_feed?: boolean | string;
  };

  return {
    userId: body.userId ?? body.user_id,
    username: body.username,
    count: parseCount(body.count),
    includeFeedVideo: parseBoolean(
      body.includeFeedVideo ??
        body.include_feed_video ??
        body.includeFeed ??
        body.include_feed ??
        undefined,
    ),
  };
}

async function resolveUserId(req: Request, res: Response) {
  try {
    const rawUsername = extractUsername(req);
    if (!rawUsername) {
      res.status(400).json({ success: false, error: 'Username is required' });
      return;
    }

    const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;
    if (!getInstagramService) {
      throw new Error('Instagram service unavailable');
    }
    const service = getInstagramService();
    const result = await service.getUserId(username);
    res.json(result);
  } catch (error) {
    handleInstagramError(res, error, 'Failed to resolve Instagram user ID');
  }
}

async function fetchUserReels(req: Request, res: Response) {
  try {
    const payload = extractReelsPayload(req);
    if (!getInstagramService) {
      throw new Error('Instagram service unavailable');
    }
    const service = getInstagramService();
    const result = await service.getUserReels(payload);
    res.json(result);
  } catch (error) {
    handleInstagramError(res, error, 'Failed to fetch Instagram reels');
  }
}

export const instagramRouter = Router();

registerAllMethods(instagramRouter, '/user-id', resolveUserId);
registerAllMethods(instagramRouter, '/user-reels', fetchUserReels);
