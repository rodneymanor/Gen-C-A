import fs from 'fs';
import path from 'path';

import { getCollectionRefByPath } from '../../api-routes/utils/firebase-admin.js';

function ensureFile(filePath, initialPayload = { items: [] }) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialPayload, null, 2));
  }
}

function readArray(filePath) {
  ensureFile(filePath, { items: [] });
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    const key = Object.keys(parsed || {}).find((k) => Array.isArray(parsed[k]));
    return key ? parsed[key] : [];
  } catch {
    return [];
  }
}

function writeArray(filePath, arr) {
  ensureFile(filePath, { items: [] });
  try {
    const payload = { items: arr };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  } catch {}
}

function generateIdeaTitle(incomingTitle, resolvedContent) {
  const trimmedTitle = String(incomingTitle || '').trim();
  if (trimmedTitle) return trimmedTitle;

  const content = String(resolvedContent || '').trim();
  if (!content) return 'Saved from Extension';

  const firstMeaningfulLine = content
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) || content;

  const words = firstMeaningfulLine.split(/\s+/).filter(Boolean).slice(0, 16);
  if (!words.length) return 'Saved from Extension';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

function decodeIdeaUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function validateIdeaVideoUrl(url) {
  if (!url) return { valid: false, message: 'url is required' };
  const trimmed = String(url).trim();
  if (!trimmed) return { valid: false, message: 'url is required' };
  try {
    new URL(trimmed);
  } catch {
    return { valid: false, message: 'Please enter a valid URL' };
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    if (lower.includes('/reel') || lower.includes('/reels/') || lower.includes('/share/')) {
      return { valid: true, platform: 'instagram' };
    }
    if (lower.includes('/p/')) {
      return {
        valid: false,
        message: 'Instagram post URLs are not supported yet. Please use Instagram reel URLs instead.',
      };
    }
    return { valid: true, platform: 'instagram' };
  }

  if (lower.includes('vm.tiktok.com') || lower.includes('tiktok.com') || lower.includes('tiktokv.com')) {
    return { valid: true, platform: 'tiktok' };
  }

  if (lower.includes('cdninstagram.com') || lower.includes('scontent-')) {
    return { valid: true, platform: 'instagram_cdn' };
  }
  if (lower.includes('tiktokcdn') || lower.includes('muscdn.com')) {
    return { valid: true, platform: 'tiktok_cdn' };
  }

  return { valid: false, message: 'Only TikTok and Instagram video URLs are supported' };
}

function deriveNoteTypeFromPlatform(platform, provided) {
  if (provided) return provided;
  if (!platform) return 'note';
  const normalized = platform.toLowerCase();
  if (normalized.includes('tiktok')) return 'tiktok';
  if (normalized.includes('instagram')) return 'instagram';
  return 'note';
}

class ChromeExtensionInboxServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ChromeExtensionInboxServiceError';
    this.statusCode = statusCode;
  }
}

export class ChromeExtensionInboxService {
  constructor({ firestore, dataDir = path.join(process.cwd(), 'data') }) {
    this.firestore = firestore || null;
    this.dataDir = dataDir;
  }

  get contentInboxFile() {
    return path.join(this.dataDir, 'content_inbox.json');
  }

  get notesFallbackFile() {
    return path.join(this.dataDir, 'notes.json');
  }

  async addContentItem(userId, payload) {
    const {
      url,
      platform = 'manual',
      category = 'inspiration',
      tags = [],
      title,
      content,
      description,
      notes,
    } = payload || {};

    if (!url && !(notes && notes.content)) {
      throw new ChromeExtensionInboxServiceError('Either url or notes.content is required', 400);
    }

    const now = new Date();
    const item = {
      url: url || null,
      title: title || null,
      content: content || null,
      description: description || null,
      platform,
      category,
      tags: Array.isArray(tags) ? tags : [],
      savedAt: now,
      transcription: url ? { status: 'pending' } : undefined,
      notes: notes
        ? {
            content: notes.content,
            format: notes.format || 'text',
            createdAt: now,
            updatedAt: now,
          }
        : undefined,
      userId,
    };

    if (this.firestore) {
      const ref = await this.firestore
        .collection('users')
        .doc(userId)
        .collection('contentInbox')
        .add(item);
      return { id: ref.id, ...item };
    }

    const file = this.contentInboxFile;
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...item, savedAt: now.toISOString() });
    writeArray(file, arr);
    return { id, ...item, savedAt: now.toISOString() };
  }

  async addIdeaText({
    userId,
    payload,
    contentNotesPath,
  }) {
    const { title = '', content = '', url = '', noteType = 'note' } = payload || {};
    const incomingTitle = String(title || '').trim();
    const resolvedContent = String(content || url || '').trim();

    if (!incomingTitle && !resolvedContent) {
      throw new ChromeExtensionInboxServiceError(
        'At least one of title or content/url is required',
        400,
      );
    }

    const now = new Date();
    const finalTitle = generateIdeaTitle(incomingTitle, resolvedContent);
    const data = {
      title: finalTitle || 'Saved from Extension',
      content: resolvedContent,
      type: 'idea_inbox',
      noteType,
      source: 'inbox',
      starred: false,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    if (this.firestore) {
      const configuredPath = contentNotesPath;
      const collectionRef = configuredPath
        ? getCollectionRefByPath(this.firestore, configuredPath, userId)
        : null;
      let ref;
      if (collectionRef) {
        ref = await collectionRef.add(data);
      } else {
        try {
          ref = await this.firestore.collection('users').doc(userId).collection('notes').add(data);
        } catch {
          ref = await this.firestore.collection('notes').add(data);
        }
      }

      return {
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      };
    }

    const file = this.notesFallbackFile;
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    return { success: true, note: saved };
  }

  async addIdeaVideo({
    userId,
    payload,
    contentNotesPath,
  }) {
    const { url, title, noteType } = payload || {};
    if (!url) {
      throw new ChromeExtensionInboxServiceError('url is required', 400);
    }

    const decodedUrl = decodeIdeaUrl(String(url));
    const validation = validateIdeaVideoUrl(decodedUrl);
    if (!validation.valid) {
      throw new ChromeExtensionInboxServiceError(
        validation.message || 'Invalid video URL',
        400,
      );
    }

    const platform = validation.platform;
    const derivedType = deriveNoteTypeFromPlatform(platform || '', noteType);
    const platformLabel = platform?.includes('tiktok')
      ? 'TikTok'
      : platform?.includes('instagram')
        ? 'Instagram'
        : 'Video';
    const resolvedTitle = String(title || '').trim() || `Idea from ${platformLabel}`;
    const now = new Date();

    const metadata = {
      videoUrl: decodedUrl,
      platform,
    };

    const data = {
      title: resolvedTitle,
      content: decodedUrl,
      type: 'idea_inbox',
      noteType: derivedType,
      source: 'inbox',
      starred: false,
      userId,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    if (this.firestore) {
      let ref;
      try {
        ref = await this.firestore.collection('users').doc(userId).collection('notes').add(data);
      } catch {
        ref = await this.firestore.collection('notes').add(data);
      }
      return {
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      };
    }

    const file = this.notesFallbackFile;
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    return { success: true, note: saved };
  }
}

export function getChromeExtensionInboxService(options) {
  return new ChromeExtensionInboxService(options || {});
}

export { ChromeExtensionInboxServiceError };
