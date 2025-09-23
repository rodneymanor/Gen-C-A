import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  getVideoScraperService,
  VideoScraperServiceError,
} from '../../../../src/services/video/video-scraper-service.js';
import {
  getVideoTranscriptionService,
  VideoTranscriptionServiceError,
} from '../../../../src/services/video/video-transcription-service.js';
import {
  getVideoOrchestratorService,
  VideoOrchestratorServiceError,
} from '../../../../src/services/video/video-orchestrator-service.js';
import {
  getYouTubeTranscriptService,
  YouTubeTranscriptServiceError,
} from '../../../../src/services/video/youtube-transcript-service.js';

function handleScrapeError(res: Response, error: unknown) {
  if (error instanceof VideoScraperServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Failed to scrape video';
  console.error('[backend][video][scrape] unexpected error:', message);
  res.status(500).json({ success: false, error: message });
}

function handleTranscriptionError(res: Response, error: unknown) {
  if (error instanceof VideoTranscriptionServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Failed to transcribe video';
  console.error('[backend][video][transcribe] unexpected error:', message);
  res.status(500).json({ success: false, error: message });
}

function handleOrchestratorError(res: Response, error: unknown) {
  if (error instanceof VideoOrchestratorServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Failed to orchestrate video workflow';
  console.error('[backend][video][orchestrate] unexpected error:', message);
  res.status(500).json({ success: false, error: message });
}

function handleYouTubeTranscriptError(res: Response, error: unknown) {
  if (error instanceof YouTubeTranscriptServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Failed to fetch YouTube transcript';
  console.error('[backend][video][youtube-transcript] unexpected error:', message);
  res.status(500).json({ success: false, error: message });
}

export const videoRouter = Router();

videoRouter.post('/scrape-url', async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { url?: string; options?: Record<string, unknown> };

  if (!body.url) {
    res.status(400).json({ success: false, error: 'url is required' });
    return;
  }

  try {
    const service = getVideoScraperService();
    const result = await service.scrapeUrl(body.url, body.options || {});
    res.json({ success: true, result });
  } catch (error) {
    handleScrapeError(res, error);
  }
});

videoRouter.post('/transcribe-from-url', async (req: Request, res: Response) => {
  try {
    const service = getVideoTranscriptionService();
    const result = await service.transcribeFromUrl((req.body ?? {}) as Record<string, unknown>);
    res.json(result);
  } catch (error) {
    handleTranscriptionError(res, error);
  }
});

videoRouter.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const service = getVideoOrchestratorService();
    const result = await service.orchestrateWorkflow((req.body ?? {}) as Record<string, unknown>);
    res.json(result);
  } catch (error) {
    handleOrchestratorError(res, error);
  }
});

videoRouter.get('/youtube-transcript', async (req: Request, res: Response) => {
  try {
    const { url, lang } = req.query as { url?: string; lang?: string };
    const service = getYouTubeTranscriptService();
    const transcript = await service.fetchTranscript({ url, lang });
    res.status(200).json({ success: true, transcript });
  } catch (error) {
    handleYouTubeTranscriptError(res, error);
  }
});

videoRouter.post('/youtube-transcript', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as { url?: string; lang?: string };
    const service = getYouTubeTranscriptService();
    const transcript = await service.fetchTranscript({ url: body.url, lang: body.lang });
    res.status(200).json({ success: true, transcript });
  } catch (error) {
    handleYouTubeTranscriptError(res, error);
  }
});
