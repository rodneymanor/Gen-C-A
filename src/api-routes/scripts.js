import { getDb, verifyBearer } from './utils/firebase-admin.js';
import { getScriptsService, ScriptsServiceError } from '../services/scripts/scripts-service.js';

export async function handleGetScripts(req, res) {
  try {
    console.log('[scripts] GET headers', {
      hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
      xClient: req.headers['x-client'] || req.headers['X-Client'],
    });
  } catch {}
  const authResult = await verifyBearer(req);

  if (!authResult) {
    console.warn('[scripts] Missing or invalid auth token for library fetch');
    return res.status(401).json({
      success: false,
      error: 'Authentication required to load scripts.'
    });
  }

  const db = getDb();
  if (!db) {
    console.error('[scripts] Firestore unavailable while fetching scripts');
    return res.status(503).json({
      success: false,
      error: 'Content service is unavailable. Please try again later.'
    });
  }

  try {
    console.log('[scripts] Using Firestore with auth uid:', authResult.uid);
    const service = getScriptsService(db);
    const scripts = await service.listScripts(authResult.uid);
    return res.json({ success: true, scripts });
  } catch (e) {
    if (e instanceof ScriptsServiceError) {
      console.warn('[scripts] Service error while fetching scripts:', e.message);
      return res.status(e.statusCode).json({ success: false, error: e.message });
    }
    console.error('[scripts] Failed to fetch scripts from Firestore:', e?.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to load scripts from Firestore.'
    });
  }
}

export async function handleCreateScript(req, res) {
  try {
    try {
      console.log('[scripts] POST headers', {
        hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
        xClient: req.headers['x-client'] || req.headers['X-Client'],
      });
    } catch {}

    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to save scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while creating script');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getScriptsService(db);
      const saved = await service.createScript(auth.uid, req.body || {});
      return res.json({ success: true, script: saved });
    } catch (error) {
      if (error instanceof ScriptsServiceError) {
        console.warn('[scripts] Service error while creating script:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('[scripts] Failed to save script to Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to save script to Firestore.' });
    }
  } catch (e) {
    return res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleGetScriptById(req, res) {
  const { id } = req.params;
  // Try Firestore first
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to load scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while fetching by id');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getScriptsService(db);
      const script = await service.getScriptById(auth.uid, id);
      return res.json({ success: true, script });
    } catch (error) {
      if (error instanceof ScriptsServiceError) {
        console.warn('[scripts] Service error while fetching script by id:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      throw error;
    }
  } catch (e) {
    console.error('[scripts] Failed to fetch script by id:', e?.message);
    return res.status(500).json({ success: false, error: 'Failed to load script.' });
  }
}

export async function handleUpdateScript(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to update scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while updating script');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getScriptsService(db);
      const updated = await service.updateScript(auth.uid, id, updates);
      return res.json({ success: true, script: updated });
    } catch (error) {
      if (error instanceof ScriptsServiceError) {
        console.warn('[scripts] Service error while updating script:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('[scripts] Failed to update script in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to update script.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleDeleteScript(req, res) {
  const { id } = req.params;
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to delete scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while deleting script');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getScriptsService(db);
      await service.deleteScript(auth.uid, id);
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof ScriptsServiceError) {
        console.warn('[scripts] Service error while deleting script:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('[scripts] Failed to delete script in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to delete script.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}
