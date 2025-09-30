import type { Request, Response } from 'express';
import { Router } from 'express';
import path from 'path';

import { getCollectionRefByPath } from '../../lib/firebase-admin.js';
import {
  DATA_DIR,
  ensureDb,
  resolveUser,
} from './utils.js';
import { loadSharedModule } from '../../services/shared-service-proxy.js';

type ChromeInboxError = Error & { statusCode: number };

const inboxModule = loadSharedModule<any>(
  '../../../../../src/services/chrome-extension/chrome-extension-inbox-service.js',
);
const ChromeExtensionInboxServiceError = inboxModule?.ChromeExtensionInboxServiceError as
  | (new (message?: string, statusCode?: number) => ChromeInboxError)
  | undefined;
const getChromeExtensionInboxService = inboxModule?.getChromeExtensionInboxService as
  | ((options: { firestore: ReturnType<typeof ensureDb>; dataDir: string }) => any)
  | undefined;

const isChromeInboxError = (error: unknown): error is ChromeInboxError =>
  typeof ChromeExtensionInboxServiceError === 'function' && error instanceof ChromeExtensionInboxServiceError;

export const inboxRouter = Router();

function sendInboxError(res: Response, error: unknown, fallback: string) {
  if (isChromeInboxError(error)) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][extension][inbox] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

inboxRouter.post('/content-inbox', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    if (!getChromeExtensionInboxService) {
      throw new Error('Chrome extension inbox service unavailable');
    }
    const service = getChromeExtensionInboxService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.addContentItem(String(user.uid), req.body || {});
    res.status(201).json(result);
  } catch (error) {
    sendInboxError(res, error, 'Failed to add content item');
  }
});

inboxRouter.post('/idea-inbox/text', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    if (!getChromeExtensionInboxService) {
      throw new Error('Chrome extension inbox service unavailable');
    }
    const service = getChromeExtensionInboxService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.addIdeaText({
      userId: String(user.uid),
      payload: req.body || {},
      contentNotesPath: process.env.CONTENT_NOTES_PATH,
    });
    res.status(201).json(result);
  } catch (error) {
    sendInboxError(res, error, 'Failed to create idea note');
  }
});

inboxRouter.post('/idea-inbox/video', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    if (!getChromeExtensionInboxService) {
      throw new Error('Chrome extension inbox service unavailable');
    }
    const service = getChromeExtensionInboxService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.addIdeaVideo({
      userId: String(user.uid),
      payload: req.body || {},
      contentNotesPath: process.env.CONTENT_NOTES_PATH,
    });
    res.status(201).json(result);
  } catch (error) {
    sendInboxError(res, error, 'Failed to save video idea');
  }
});
