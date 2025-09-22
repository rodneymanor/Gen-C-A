import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getInstagramService,
  InstagramServiceError,
} from '../../src/services/video/instagram-service.js';

export function resolveInstagramService() {
  return getInstagramService();
}

export function parseUserIdRequest(req: VercelRequest) {
  if (req.method === 'GET') {
    return req.query?.username || req.query?.handle || req.query?.user || req.query?.id;
  }
  const body = req.body || {};
  return body.username || body.handle || body.user || body.id;
}

export function parseReelsRequest(req: VercelRequest) {
  const source = req.method === 'GET' ? req.query || {} : req.body || {};
  return {
    userId: source.user_id || source.userId || source.id || source.username || source.handle,
    count: source.count || source.limit,
    includeFeedVideo:
      source.include_feed_video !== undefined || source.includeFeedVideo !== undefined
        ? String(source.include_feed_video ?? source.includeFeedVideo).toLowerCase() !== 'false'
        : undefined,
    username: source.username,
  };
}

export function sendInstagramError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof InstagramServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
