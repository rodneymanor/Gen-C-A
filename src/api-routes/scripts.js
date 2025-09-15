import fs from 'fs';
import path from 'path';
import { getDb, verifyBearer, getCollectionRefByPath } from './utils/firebase-admin.js';

function tsToIso(v, fallbackIso) {
  try {
    if (v?.toDate) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
  } catch {}
  return fallbackIso || new Date().toISOString();
}

function formatScriptDoc(d) {
  const data = d.data();
  const createdFields = (process.env.CONTENT_CREATED_AT_FIELDS || 'createdAt,created,timestamp').split(',').map((s) => s.trim());
  const updatedFields = (process.env.CONTENT_UPDATED_AT_FIELDS || 'updatedAt,updated,modifiedAt').split(',').map((s) => s.trim());
  const createdRaw = createdFields.map((k) => data[k]).find((v) => v != null);
  const updatedRaw = updatedFields.map((k) => data[k]).find((v) => v != null);
  return {
    id: d.id,
    ...data,
    createdAt: tsToIso(createdRaw),
    updatedAt: tsToIso(updatedRaw, tsToIso(createdRaw)),
  };
}

async function fetchUserScripts(db, uid) {
  // Prefer env-configured path if present
  const configuredPath = process.env.CONTENT_SCRIPTS_PATH; // e.g., "users/{uid}/scripts" or "scripts"
  if (configuredPath) {
    try {
      const cref = getCollectionRefByPath(db, configuredPath, uid);
      if (cref) {
        console.log('[scripts] Query via configured path:', configuredPath);
        let q = cref;
        // If path doesn't include {uid}, filter by user field
        if (!configuredPath.includes('{uid}')) {
          const userField = process.env.CONTENT_USER_FIELD || 'userId';
          console.log('[scripts] Filtering on field:', userField);
          q = q.where(userField, '==', uid);
        }
        try { q = q.orderBy('createdAt', 'desc'); } catch {}
        const snap = await q.limit(200).get();
        if (!snap.empty) return snap.docs.map((d) => formatScriptDoc(d));
      }
    } catch (e) {
      console.warn('[scripts] configured path query failed:', e?.message);
    }
  }

  // Try subcollection: users/{uid}/scripts
  try {
    const subSnap = await db
      .collection('users')
      .doc(uid)
      .collection('scripts')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    if (!subSnap.empty) {
      return subSnap.docs.map((d) => formatScriptDoc(d));
    }
  } catch (e) {}

  // Try root collection with different user field keys
  for (const userField of ['userId', 'uid', 'owner']) {
    try {
      const qSnap = await db
        .collection('scripts')
        .where(userField, '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      if (!qSnap.empty) {
        return qSnap.docs.map((d) => formatScriptDoc(d));
      }
    } catch (e) {}
  }

  return [];
}

const SCRIPTS_FILE = path.join(process.cwd(), 'data', 'scripts.json');

function ensureStore() {
  const dir = path.dirname(SCRIPTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SCRIPTS_FILE)) fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts: [] }, null, 2));
}

function readScripts() {
  ensureStore();
  try {
    const raw = fs.readFileSync(SCRIPTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.scripts) ? parsed.scripts : [];
  } catch {
    return [];
  }
}

function writeScripts(scripts) {
  ensureStore();
  fs.writeFileSync(SCRIPTS_FILE, JSON.stringify({ scripts }, null, 2));
}

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function handleGetScripts(req, res) {
  try {
    console.log('[scripts] GET headers', {
      hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
      xClient: req.headers['x-client'] || req.headers['X-Client'],
    });
  } catch {}
  // If authenticated and Firestore available, read user scripts from Firestore
  try {
    const auth = await verifyBearer(req);
    const db = getDb();
    if (auth && db) {
      console.log('[scripts] Using Firestore with auth uid:', auth.uid);
      const scripts = await fetchUserScripts(db, auth.uid);
      return res.json({ success: true, scripts });
    }
  } catch (e) {
    console.warn('[scripts] Firestore GET failed, falling back to JSON:', e?.message);
  }

  console.log('[scripts] Using JSON store fallback');
  const scripts = readScripts();
  res.json({ success: true, scripts });
}

export async function handleCreateScript(req, res) {
  try {
    try {
      console.log('[scripts] POST headers', {
        hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
        xClient: req.headers['x-client'] || req.headers['X-Client'],
      });
    } catch {}
    const body = req.body || {};
    const now = new Date().toISOString();
    const wordCount = (body.content || '').trim() ? body.content.trim().split(/\s+/).length : 0;
    const script = {
      id: genId(),
      title: body.title || 'Untitled Script',
      content: body.content || '',
      authors: 'You',
      status: body.status || 'draft',
      performance: { views: 0, engagement: 0 },
      category: body.category || 'General',
      createdAt: now,
      updatedAt: now,
      viewedAt: now,
      duration: '0:30',
      tags: Array.isArray(body.tags) ? body.tags : [],
      fileType: 'Script',
      summary: body.summary || (body.content || '').slice(0, 160),
      userId: 'local',
      approach: body.approach || 'educational',
      voice: body.voice,
      originalIdea: body.originalIdea,
      targetLength: body.targetLength,
      source: body.source,
      scheduledDate: body.scheduledDate,
      platform: body.platform,
      isThread: body.isThread,
      threadParts: body.threadParts,
      wordCount,
      characterCount: (body.content || '').length,
    };
    // Try to write to Firestore if authenticated
    try {
      const auth = await verifyBearer(req);
      const db = getDb();
      if (auth && db) {
        const toSave = { ...script, id: undefined, userId: auth.uid };
        // Use configured path if provided, else default to users/{uid}/scripts then root
        const configuredPath = process.env.CONTENT_SCRIPTS_PATH;
        const cref = configuredPath ? getCollectionRefByPath(db, configuredPath, auth.uid) : null;
        if (cref) {
          console.log('[scripts] Write via configured path:', process.env.CONTENT_SCRIPTS_PATH);
          const ref = await cref.add({ ...toSave, createdAt: new Date(), updatedAt: new Date() });
          const saved = { ...script, id: ref.id, userId: auth.uid };
          return res.json({ success: true, script: saved });
        } else {
          try {
            const subRef = await db
              .collection('users')
              .doc(auth.uid)
              .collection('scripts')
              .add({ ...toSave, createdAt: new Date(), updatedAt: new Date() });
            const saved = { ...script, id: subRef.id, userId: auth.uid };
            return res.json({ success: true, script: saved });
          } catch (subErr) {
            const ref = await db.collection('scripts').add({
              ...toSave,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            const saved = { ...script, id: ref.id, userId: auth.uid };
            return res.json({ success: true, script: saved });
          }
        }
      }
    } catch (e) {
      console.warn('[scripts] Firestore POST failed, using JSON store:', e?.message);
    }

    const scripts = readScripts();
    scripts.unshift(script);
    writeScripts(scripts);
    res.json({ success: true, script });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleGetScriptById(req, res) {
  const { id } = req.params;
  // Try Firestore first
  try {
    const auth = await verifyBearer(req);
    const db = getDb();
    if (auth && db) {
      let doc = await db.collection('users').doc(auth.uid).collection('scripts').doc(id).get();
      if (!doc.exists) {
        doc = await db.collection('scripts').doc(id).get();
      }
      if (doc.exists) {
        const script = formatScriptDoc(doc);
        if (script.userId && script.userId !== auth.uid) return res.status(403).json({ success: false, error: 'Forbidden' });
        return res.json({ success: true, script });
      }
    }
  } catch (e) {
    console.warn('[scripts] Firestore GET by id failed, fallback:', e?.message);
  }

  const scripts = readScripts();
  const script = scripts.find((s) => s.id === id);
  if (!script) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, script });
}

export async function handleUpdateScript(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    // Try Firestore
    try {
      const auth = await verifyBearer(req);
      const db = getDb();
      if (auth && db) {
        let doc = db.collection('users').doc(auth.uid).collection('scripts').doc(id);
        let current = await doc.get();
        if (!current.exists) {
          doc = db.collection('scripts').doc(id);
          current = await doc.get();
        }
        if (!current.exists) return res.status(404).json({ success: false, error: 'Not found' });
        const data = current.data();
        if (data.userId && data.userId !== auth.uid) return res.status(403).json({ success: false, error: 'Forbidden' });
        await doc.set({ ...data, ...updates, updatedAt: new Date() }, { merge: true });
        const updated = { id, ...data, ...updates, updatedAt: new Date().toISOString() };
        return res.json({ success: true, script: updated });
      }
    } catch (e) {
      console.warn('[scripts] Firestore PUT failed, fallback JSON:', e?.message);
    }

    const scripts = readScripts();
    const idx = scripts.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
    const updated = { ...scripts[idx], ...updates, updatedAt: new Date().toISOString() };
    scripts[idx] = updated;
    writeScripts(scripts);
    res.json({ success: true, script: updated });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleDeleteScript(req, res) {
  const { id } = req.params;
  // Try Firestore
  try {
    const auth = await verifyBearer(req);
    const db = getDb();
    if (auth && db) {
      let doc = db.collection('users').doc(auth.uid).collection('scripts').doc(id);
      let current = await doc.get();
      if (!current.exists) {
        doc = db.collection('scripts').doc(id);
        current = await doc.get();
      }
      if (!current.exists) return res.status(404).json({ success: false, error: 'Not found' });
      const data = current.data();
      if (data.userId && data.userId !== auth.uid) return res.status(403).json({ success: false, error: 'Forbidden' });
      await doc.delete();
      return res.json({ success: true });
    }
  } catch (e) {
    console.warn('[scripts] Firestore DELETE failed, fallback JSON:', e?.message);
  }

  const scripts = readScripts();
  const idx = scripts.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  scripts.splice(idx, 1);
  writeScripts(scripts);
  res.json({ success: true });
}
