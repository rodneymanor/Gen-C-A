import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  getChromeExtensionNotesService,
  ChromeExtensionNotesServiceError,
} from '../../../../../src/services/chrome-extension/chrome-extension-notes-service.js';
import {
  ensureDb,
  resolveUser,
} from './utils.js';

function createNotesService(db: ReturnType<typeof ensureDb>) {
  return getChromeExtensionNotesService({ firestore: db });
}

function sendNotesError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ChromeExtensionNotesServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][extension][notes] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

export const notesRouter = Router();

notesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await service.listNotes(user.uid, {
      noteId: req.query.noteId ? String(req.query.noteId) : undefined,
      limit,
      type: req.query.type ? String(req.query.type) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      tags: req.query.tags ? String(req.query.tags) : undefined,
    });

    res.json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to load notes');
  }
});

notesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const result = await service.createNote(user.uid, req.body ?? {});
    res.status(201).json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to create note');
  }
});

notesRouter.put('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const result = await service.updateNote(user.uid, req.body ?? {});
    res.json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to update note');
  }
});

notesRouter.delete('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const noteId = (req.query.noteId as string) || (body.noteId as string | undefined);
    const result = await service.deleteNote(user.uid, noteId ? String(noteId) : undefined);
    res.json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to delete note');
  }
});
