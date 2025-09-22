import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getVideoScraperService, VideoScraperServiceError } from '../../src/services/video/video-scraper-service.js';

export function resolveVideoScraperService() {
  return getVideoScraperService();
}

export function parseScrapeRequest(req: VercelRequest) {
  return (req.body || {}) as { url?: string; options?: Record<string, unknown> };
}

export function sendScrapeError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof VideoScraperServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
