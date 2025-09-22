import { createUnifiedVideoScraper } from '@/lib/unified-video-scraper';

class VideoScraperServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'VideoScraperServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

class VideoScraperService {
  constructor(scraper) {
    this.scraper = scraper || createUnifiedVideoScraper();
  }

  async scrapeUrl(url, options = {}) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new VideoScraperServiceError('Video URL is required', 400);
    }

    try {
      const result = await this.scraper.scrapeUrl(url.trim(), options);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scrape video';
      throw new VideoScraperServiceError(message, 500);
    }
  }
}

const SERVICE_INSTANCE_KEY = '__videoScraperService__';

function getVideoScraperService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new VideoScraperService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { VideoScraperService, VideoScraperServiceError, getVideoScraperService };
