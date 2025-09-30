import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb, verifyBearer } from '../lib/firebase-admin.js';
import { getNotesService, NotesServiceError } from '../services/notes-service-bridge.js';

interface AuthResult {
  uid: string;
}

function sendServiceError(res: Response, error: unknown, fallback: string) {
  if (error instanceof NotesServiceError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][notes] unexpected error:', message);
  return res.status(500).json({ success: false, error: fallback });
}

async function requireAuth(req: Request, res: Response): Promise<AuthResult | null> {
  const auth = await verifyBearer(req);
  if (!auth) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return null;
  }
  return auth as AuthResult;
}

function requireDb(res: Response) {
  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return null;
  }
  return db;
}

export const notesRouter = Router();

notesRouter.get('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getNotesService(db);
    const notes = await service.listNotes(auth.uid);
    res.json({ success: true, notes });
  } catch (error) {
    sendServiceError(res, error, 'Failed to load notes.');
  }
});

notesRouter.post('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getNotesService(db);
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const note = await service.createNote(auth.uid, payload);
    res.json({ success: true, note });
  } catch (error) {
    sendServiceError(res, error, 'Failed to save note.');
  }
});

notesRouter.get('/:id', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getNotesService(db);
    const note = await service.getNoteById(auth.uid, req.params.id);
    res.json({ success: true, note });
  } catch (error) {
    sendServiceError(res, error, 'Failed to load note.');
  }
});

notesRouter.put('/:id', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getNotesService(db);
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const note = await service.updateNote(auth.uid, req.params.id, payload);
    res.json({ success: true, note });
  } catch (error) {
    sendServiceError(res, error, 'Failed to update note.');
  }
});

notesRouter.delete('/:id', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getNotesService(db);
    await service.deleteNote(auth.uid, req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendServiceError(res, error, 'Failed to delete note.');
  }
});
