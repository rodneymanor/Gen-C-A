import { getDb, verifyBearer } from './utils/firebase-admin.js';
import { getNotesService, NotesServiceError } from '../services/notes/notes-service.js';

export async function handleGetNotes(req, res) {
  try {
    console.log('[notes] GET headers', {
      hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
      xClient: req.headers['x-client'] || req.headers['X-Client'],
    });
  } catch {}
  const authResult = await verifyBearer(req);

  if (!authResult) {
    console.warn('[notes] Missing or invalid auth token for library fetch');
    return res.status(401).json({
      success: false,
      error: 'Authentication required to load notes.'
    });
  }

  const db = getDb();
  if (!db) {
    console.error('[notes] Firestore unavailable while fetching notes');
    return res.status(503).json({
      success: false,
      error: 'Content service is unavailable. Please try again later.'
    });
  }

  try {
    console.log('[notes] Using Firestore with auth uid:', authResult.uid);
    const service = getNotesService(db);
    const notes = await service.listNotes(authResult.uid);
    return res.json({ success: true, notes });
  } catch (e) {
    if (e instanceof NotesServiceError) {
      console.warn('[notes] Service error while fetching notes:', e.message);
      return res.status(e.statusCode).json({ success: false, error: e.message });
    }
    console.error('[notes] Failed to fetch notes from Firestore:', e?.message);
    return res.status(500).json({ success: false, error: 'Failed to load notes from Firestore.' });
  }
}

export async function handleCreateNote(req, res) {
  try {
    try {
      console.log('[notes] POST headers', {
        hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
        xClient: req.headers['x-client'] || req.headers['X-Client'],
      });
    } catch {}

    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to save notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while creating note');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getNotesService(db);
      const saved = await service.createNote(auth.uid, req.body || {});
      return res.json({ success: true, note: saved });
    } catch (error) {
      if (error instanceof NotesServiceError) {
        console.warn('[notes] Service error while creating note:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('[notes] Failed to save note to Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to save note to Firestore.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleGetNoteById(req, res) {
  const { id } = req.params;
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to load notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while fetching note by id');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getNotesService(db);
      const note = await service.getNoteById(auth.uid, id);
      return res.json({ success: true, note });
    } catch (error) {
      if (error instanceof NotesServiceError) {
        console.warn('[notes] Service error while fetching note by id:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      throw error;
    }
  } catch (e) {
    console.error('[notes] Failed to fetch note by id:', e?.message);
    return res.status(500).json({ success: false, error: 'Failed to load note.' });
  }
}

export async function handleUpdateNote(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to update notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while updating note');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getNotesService(db);
      const updated = await service.updateNote(auth.uid, id, body);
      return res.json({ success: true, note: updated });
    } catch (error) {
      if (error instanceof NotesServiceError) {
        console.warn('[notes] Service error while updating note:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('[notes] Failed to update note in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to update note.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleDeleteNote(req, res) {
  const { id } = req.params;
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to delete notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while deleting note');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const service = getNotesService(db);
      await service.deleteNote(auth.uid, id);
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof NotesServiceError) {
        console.warn('[notes] Service error while deleting note:', error.message);
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('[notes] Failed to delete note in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to delete note.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}
