import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTikTokFeedService, TikTokFeedServiceError } from '../../src/services/video/tiktok-feed-service.js';

export function resolveTikTokFeedService() {
  return getTikTokFeedService();
}

export function parseTikTokFeedRequest(req: VercelRequest) {
  return (req.method === 'GET' ? req.query : req.body) as { username?: string; count?: number };
}

export function sendTikTokFeedError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof TikTokFeedServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message, ...(error.debug || {}) });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
