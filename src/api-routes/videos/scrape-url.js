import { getVideoScraperService, VideoScraperServiceError } from '../../services/video/video-scraper-service.js';

export async function handleVideoScrape(req, res) {
  try {
    const body = req.body ?? {};
    const service = getVideoScraperService();
    const result = await service.scrapeUrl(body.url, body.options || {});

    return res.json({ success: true, result });
  } catch (error) {
    if (error instanceof VideoScraperServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(error.debug ? { debug: error.debug } : {}),
      });
    }
    console.error('❌ [video/scrape-url] Failed to scrape video:', error);
    return res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape video' });
  }
}
