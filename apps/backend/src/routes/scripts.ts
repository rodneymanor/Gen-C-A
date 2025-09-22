import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb, verifyBearer } from '../lib/firebase-admin.js';
import {
  getScriptsService,
  ScriptsServiceError,
} from '../../../../src/services/scripts/scripts-service.js';

interface AuthResult {
  uid: string;
}

function sendServiceError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ScriptsServiceError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][scripts] unexpected error:', message);
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

export const scriptsRouter = Router();

scriptsRouter.get('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getScriptsService(db);
    const scripts = await service.listScripts(auth.uid);
    res.json({ success: true, scripts });
  } catch (error) {
    sendServiceError(res, error, 'Failed to load scripts.');
  }
});

scriptsRouter.post('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getScriptsService(db);
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const script = await service.createScript(auth.uid, payload);
    res.json({ success: true, script });
  } catch (error) {
    sendServiceError(res, error, 'Failed to save script.');
  }
});

scriptsRouter.get('/:id', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getScriptsService(db);
    const script = await service.getScriptById(auth.uid, req.params.id);
    res.json({ success: true, script });
  } catch (error) {
    sendServiceError(res, error, 'Failed to load script.');
  }
});

scriptsRouter.put('/:id', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getScriptsService(db);
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const script = await service.updateScript(auth.uid, req.params.id, payload);
    res.json({ success: true, script });
  } catch (error) {
    sendServiceError(res, error, 'Failed to update script.');
  }
});

scriptsRouter.delete('/:id', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = requireDb(res);
  if (!db) return;

  try {
    const service = getScriptsService(db);
    await service.deleteScript(auth.uid, req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendServiceError(res, error, 'Failed to delete script.');
  }
});
