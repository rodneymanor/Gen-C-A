import { createUnifiedVideoScraper } from '@/lib/unified-video-scraper';

export async function handleVideoScrape(req, res) {
  try {
    const body = req.body ?? {};
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const options = body.options || {};

    if (!url) {
      return res.status(400).json({ success: false, error: 'Video URL is required' });
    }

    const scraper = createUnifiedVideoScraper();
    const result = await scraper.scrapeUrl(url, options);

    return res.json({ success: true, result });
  } catch (error) {
    console.error('❌ [video/scrape-url] Failed to scrape video:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape video' });
  }
}
