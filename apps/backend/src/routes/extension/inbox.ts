import type { Request, Response } from 'express';
import { Router } from 'express';
import path from 'path';

import { getCollectionRefByPath } from '../../lib/firebase-admin.js';
import {
  DATA_DIR,
  ensureDb,
  resolveUser,
  readArray,
  writeArray,
  generateIdeaTitle,
  decodeIdeaUrl,
  validateIdeaVideoUrl,
  deriveNoteTypeFromPlatform,
} from './utils.js';

export const inboxRouter = Router();

inboxRouter.post('/content-inbox', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const body = req.body || {};
    const {
      url,
      platform = 'manual',
      category = 'inspiration',
      tags = [],
      title,
      content,
      description,
      notes,
    } = body;

    if (!url && !(notes && notes.content)) {
      res.status(400).json({ success: false, error: 'Either url or notes.content is required' });
      return;
    }

    const item = {
      url: url || null,
      title: title || null,
      content: content || null,
      description: description || null,
      platform,
      category,
      tags: Array.isArray(tags) ? tags : [],
      savedAt: new Date(),
      transcription: url ? { status: 'pending' } : undefined,
      notes: notes
        ? {
            content: notes.content,
            format: notes.format || 'text',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
      userId: user.uid,
    };

    if (db) {
      const ref = await db.collection('users').doc(user.uid).collection('contentInbox').add(item);
      res.status(201).json({ id: ref.id, ...item });
      return;
    }

    const file = path.join(DATA_DIR, 'content_inbox.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...item });
    writeArray(file, arr);
    res.status(201).json({ id, ...item });
  } catch (error) {
    console.error('[backend][extension] content-inbox error:', error);
    res.status(500).json({ error: 'Failed to add content item' });
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
    const { title = '', content = '', url = '', noteType = 'note' } = req.body || {};
    const incomingTitle = String(title || '').trim();
    const resolvedContent = String(content || url || '').trim();

    if (!incomingTitle && !resolvedContent) {
      res.status(400).json({ success: false, error: 'At least one of title or content/url is required' });
      return;
    }

    const now = new Date();
    const data = {
      title: generateIdeaTitle(incomingTitle, resolvedContent),
      content: resolvedContent,
      type: 'idea_inbox',
      noteType,
      source: 'inbox',
      starred: false,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      const configuredPath = process.env.CONTENT_NOTES_PATH;
      const collectionRef = configuredPath ? getCollectionRefByPath(db, configuredPath, user.uid) : null;
      let ref;
      if (collectionRef) {
        ref = await collectionRef.add(data);
      } else {
        try {
          ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
        } catch {
          ref = await db.collection('notes').add(data);
        }
      }
      res.status(201).json({
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
      return;
    }

    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    res.status(201).json({ success: true, note: saved });
  } catch (error) {
    console.error('[backend][extension] idea text error:', error);
    res.status(500).json({ success: false, error: 'Failed to create idea note' });
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
    const { url, title, noteType } = req.body || {};
    if (!url) {
      res.status(400).json({ success: false, error: 'url is required' });
      return;
    }

    const decodedUrl = decodeIdeaUrl(String(url));
    const validation = validateIdeaVideoUrl(decodedUrl);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message || 'Invalid video URL' });
      return;
    }

    const platform = validation.platform as string | undefined;
    const derivedType = deriveNoteTypeFromPlatform(platform, noteType);
    const platformLabel = platform?.includes('tiktok')
      ? 'TikTok'
      : platform?.includes('instagram')
        ? 'Instagram'
        : 'Video';
    const resolvedTitle = String(title || '').trim() || `Idea from ${platformLabel}`;

    const now = new Date();
    const metadata: Record<string, unknown> = {
      videoUrl: decodedUrl,
      platform,
    };
    if (platform?.includes('tiktok')) metadata.thumbnailUrl = '/images/placeholder.svg';
    if (platform?.includes('instagram')) metadata.thumbnailUrl = '/images/instagram-placeholder.jpg';

    const data = {
      title: resolvedTitle,
      content: decodedUrl,
      type: 'idea_inbox',
      noteType: derivedType,
      source: 'inbox',
      starred: false,
      userId: user.uid,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      let ref;
      try {
        ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
      } catch {
        ref = await db.collection('notes').add(data);
      }
      res.status(201).json({
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
      return;
    }

    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    res.status(201).json({ success: true, note: saved });
  } catch (error) {
    console.error('[backend][extension] idea video error:', error);
    res.status(500).json({ success: false, error: 'Failed to save video idea' });
  }
});
