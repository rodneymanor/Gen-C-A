import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  DATA_DIR,
  ensureDb,
  resolveUser,
} from './utils.js';
import { loadSharedModule } from '../../services/shared-service-proxy.js';

type ChromeYouTubeError = Error & { statusCode: number };

const youtubeModule = loadSharedModule<any>(
  '../../../../../src/services/chrome-extension/chrome-extension-youtube-service.js',
);
const ChromeExtensionYouTubeServiceError = youtubeModule?.ChromeExtensionYouTubeServiceError as
  | (new (message?: string, statusCode?: number) => ChromeYouTubeError)
  | undefined;
const getChromeExtensionYouTubeService = youtubeModule?.getChromeExtensionYouTubeService as
  | ((options: { firestore: ReturnType<typeof ensureDb>; dataDir: string }) => any)
  | undefined;

const isChromeYouTubeError = (error: unknown): error is ChromeYouTubeError =>
  typeof ChromeExtensionYouTubeServiceError === 'function' && error instanceof ChromeExtensionYouTubeServiceError;

export const youtubeRouter = Router();

function sendYouTubeError(res: Response, error: unknown, fallback: string) {
  if (isChromeYouTubeError(error)) {
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
    if (!getChromeExtensionYouTubeService) {
      throw new Error('Chrome extension YouTube service unavailable');
    }
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
