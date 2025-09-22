import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  DATA_DIR,
  ensureDb,
  resolveUser,
} from './utils.js';
import {
  ChromeExtensionYouTubeServiceError,
  getChromeExtensionYouTubeService,
} from '../../../../../src/services/chrome-extension/chrome-extension-youtube-service.js';

export const youtubeRouter = Router();

function sendYouTubeError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ChromeExtensionYouTubeServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][extension][youtube] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

youtubeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = getChromeExtensionYouTubeService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.getTranscript({
      userId: String(user.uid),
      url: req.body?.url,
      saveAsNote: req.body?.saveAsNote ?? false,
      includeTimestamps: req.body?.includeTimestamps ?? false,
      contentNotesPath: process.env.CONTENT_NOTES_PATH,
    });
    res.json(result);
  } catch (error) {
    sendYouTubeError(res, error, 'Failed to extract transcript');
  }
});

youtubeRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = getChromeExtensionYouTubeService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.getTranscript({
      userId: String(user.uid),
      url: req.query.url,
      includeTimestamps: String(req.query.includeTimestamps) === 'true',
      saveAsNote: false,
      contentNotesPath: process.env.CONTENT_NOTES_PATH,
    });
    res.json(result);
  } catch (error) {
    sendYouTubeError(res, error, 'Failed to extract transcript');
  }
});
