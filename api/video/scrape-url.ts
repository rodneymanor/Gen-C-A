import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  parseScrapeRequest,
  resolveVideoScraperService,
  sendScrapeError,
} from '../_utils/video-scraper-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const service = resolveVideoScraperService();
    const { url, options } = parseScrapeRequest(req);
    const result = await service.scrapeUrl(url, options);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return sendScrapeError(res, error, 'Failed to scrape video', '[api/video/scrape-url] error:');
  }
}
