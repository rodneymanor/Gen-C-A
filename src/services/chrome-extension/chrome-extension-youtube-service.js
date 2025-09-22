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

function extractYouTubeId(u) {
  try {
    const url = new URL(u);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1];
    return null;
  } catch {
    return null;
  }
}

function formatSegmentsToTranscript(segments, includeTimestamps) {
  if (!Array.isArray(segments) || !segments.length) return '';
  return segments
    .map((seg) => {
      const text = String(seg.text || '').trim();
      if (!includeTimestamps) return text;
      const start = Number(seg.start || 0);
      const mm = Math.floor(start / 60);
      const ss = String(Math.floor(start % 60)).padStart(2, '0');
      return `[${mm}:${ss}] ${text}`;
    })
    .join(' ');
}

function cleanTranscriptText(transcript) {
  return String(transcript || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function generateYouTubeTranscriptTitle(transcript, fallbackTitle) {
  if (fallbackTitle && String(fallbackTitle).trim()) return String(fallbackTitle).trim();
  const clean = cleanTranscriptText(transcript);
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 12);
  if (!words.length) return 'YouTube Transcript';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

class ChromeExtensionYouTubeServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ChromeExtensionYouTubeServiceError';
    this.statusCode = statusCode;
  }
}

export class ChromeExtensionYouTubeService {
  constructor({ firestore, dataDir = path.join(process.cwd(), 'data') }) {
    this.firestore = firestore || null;
    this.dataDir = dataDir;
  }

  get notesFallbackFile() {
    return path.join(this.dataDir, 'notes.json');
  }

  async fetchTranscript(videoId) {
    const rapidKey = process.env.RAPIDAPI_KEY;
    if (!rapidKey) {
      throw new ChromeExtensionYouTubeServiceError('RapidAPI key not configured', 500);
    }

    const url = `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        'x-rapidapi-key': rapidKey,
      },
    });

    if (!response.ok) {
      throw new ChromeExtensionYouTubeServiceError(
        `RapidAPI request failed: ${response.status}`,
        502,
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new ChromeExtensionYouTubeServiceError(
        data.error || 'Transcript fetch failed',
        502,
      );
    }

    const segments = data.transcript || [];
    return segments.map((seg) => ({
      text: seg.text || '',
      start: parseFloat(seg.offset || 0),
      duration: parseFloat(seg.duration || 0),
    }));
  }

  async fetchMetadata(videoId) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      if (!response.ok) return {};
      const data = await response.json();
      return {
        videoId,
        title: data.title,
        channelName: data.author_name,
        thumbnailUrl: data.thumbnail_url,
      };
    } catch (error) {
      console.warn('[chrome-ext youtube-transcript] metadata fetch failed:', error?.message || error);
      return { videoId };
    }
  }

  async saveNote({ userId, metadata, transcript, segments, videoUrl, includeTimestamps, contentNotesPath }) {
    const clean = cleanTranscriptText(transcript);
    const now = new Date();
    const noteData = {
      title: generateYouTubeTranscriptTitle(clean, metadata.title),
      content: clean,
      type: 'text',
      tags: ['youtube', 'transcript', 'video'],
      source: 'import',
      starred: false,
      metadata: {
        ...metadata,
        videoUrl,
        domain: 'youtube.com',
        transcriptLength: clean.length,
        segmentCount: segments.length,
      },
      createdAt: now,
      updatedAt: now,
      userId,
    };

    if (this.firestore) {
      const configuredPath = contentNotesPath;
      const collectionRef = configuredPath
        ? getCollectionRefByPath(this.firestore, configuredPath, userId)
        : null;
      let ref;
      if (collectionRef) {
        ref = await collectionRef.add(noteData);
      } else {
        try {
          ref = await this.firestore.collection('notes').add(noteData);
        } catch {
          ref = await this.firestore.collection('notes').add(noteData);
        }
      }

      return {
        id: ref.id,
        ...noteData,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    }

    const file = this.notesFallbackFile;
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...noteData, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    return saved;
  }

  async getTranscript({ userId, url, saveAsNote = false, includeTimestamps = false, contentNotesPath }) {
    if (!url || !String(url).trim()) {
      throw new ChromeExtensionYouTubeServiceError('YouTube URL is required', 400);
    }

    const videoId = extractYouTubeId(String(url).trim());
    if (!videoId) {
      throw new ChromeExtensionYouTubeServiceError('Invalid YouTube URL format', 400);
    }

    const segments = await this.fetchTranscript(videoId);
    if (!segments.length) {
      throw new ChromeExtensionYouTubeServiceError(
        'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
        404,
      );
    }

    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = await this.fetchMetadata(videoId);

    const response = {
      success: true,
      transcript,
      segments,
      metadata,
    };

    if (saveAsNote) {
      const note = await this.saveNote({
        userId,
        metadata,
        transcript,
        segments,
        videoUrl: String(url).trim(),
        includeTimestamps,
        contentNotesPath,
      });
      response.note = note;
    }

    return response;
  }
}

export function getChromeExtensionYouTubeService(options) {
  return new ChromeExtensionYouTubeService(options || {});
}

export { ChromeExtensionYouTubeServiceError };
