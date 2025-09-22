import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { Request } from 'express';

import { getDb, verifyBearer } from '../../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const TEST_MODE_API_KEY = 'test-internal-secret-123';

export interface ResolvedUser {
  uid: string;
  method: 'bearer' | 'api-key';
  testMode: boolean;
  apiKey?: string;
}

let cachedEnvApiKeyMap: Record<string, string> | null = null;

function getEnvApiKeyMap(): Record<string, string> {
  if (cachedEnvApiKeyMap) {
    return cachedEnvApiKeyMap;
  }

  const raw = process.env.EXTENSION_API_KEYS;
  const map: Record<string, string> = {};

  if (raw) {
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const [key, uid] = entry.split(':');
        if (key && uid) {
          map[key.trim()] = uid.trim();
        }
      });
  }

  cachedEnvApiKeyMap = map;
  return map;
}

function normalizeHeaderValue(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getApiKeyFromRequest(req: Request): string | null {
  const headers = req.headers || {};
  const headerKey = normalizeHeaderValue(headers['x-api-key'] ?? headers['X-API-KEY']);
  const query = req.query || {};
  const body = (req.body ?? {}) as Record<string, unknown>;
  return (
    headerKey ||
    (query.apiKey as string) ||
    (query.apikey as string) ||
    (query.key as string) ||
    (body.apiKey as string) ||
    (body.apikey as string) ||
    null
  );
}

export function getUserIdFromRequest(req: Request): string | undefined {
  const headers = req.headers || {};
  const candidates = [
    headers['x-user-id'],
    headers['x-user'],
    headers['x-userid'],
    req.query.userId,
    req.query.uid,
    (req.body as Record<string, unknown> | undefined)?.userId,
    (req.body as Record<string, unknown> | undefined)?.uid,
  ];

  return candidates
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .map((value) => (value !== undefined && value !== null ? String(value).trim() : ''))
    .find((value) => value.length > 0);
}

async function lookupUserByApiKey(apiKey: string) {
  const db = ensureDb();
  if (!db) return null;

  try {
    const hash = createHash('sha256').update(apiKey).digest('hex');
    const keyDoc = await db.collection('user_api_keys').doc(hash).get();
    if (keyDoc.exists) {
      const data = keyDoc.data() as { userId?: string; status?: string } | undefined;
      if (data?.status && data.status !== 'active') {
        return null;
      }
      if (data?.userId) {
        return String(data.userId);
      }
    }

    const snapshot = await db
      .collection('users')
      .where('apiKeys', 'array-contains', apiKey)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    const groupSnapshot = await db
      .collectionGroup('apiKeys')
      .where('apiKey', '==', apiKey)
      .limit(1)
      .get();

    if (!groupSnapshot.empty) {
      const doc = groupSnapshot.docs[0];
      const segments = doc.ref.path.split('/');
      const usersIndex = segments.indexOf('users');
      if (usersIndex >= 0 && segments.length > usersIndex + 1) {
        const candidateUid = segments[usersIndex + 1];
        const data = doc.data() as { status?: string } | undefined;
        if (!data?.status || data.status === 'active') {
          return candidateUid;
        }
        return null;
      }
    }
  } catch (error) {
    console.warn('[chrome-extension] Failed to look up API key in Firestore:', (error as Error).message);
  }

  return null;
}

async function ensureUserExists(uid: string) {
  const db = ensureDb();
  if (!db) return;

  try {
    const docRef = db.collection('users').doc(uid);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      await docRef.set(
        {
          role: 'creator',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  } catch (error) {
    console.warn('[chrome-extension] Failed to ensure default user exists:', (error as Error).message);
  }
}

export async function resolveUser(req: Request): Promise<ResolvedUser | null> {
  const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
  if (auth?.uid) {
    return { uid: auth.uid, method: 'bearer', testMode: false };
  }

  const apiKey = getApiKeyFromRequest(req);
  if (!apiKey) return null;

  const expectedKeys = [
    process.env.API_KEY,
    process.env.NEXT_PUBLIC_API_KEY,
    process.env.INTERNAL_API_SECRET,
    process.env.ADMIN_API_KEY,
  ].filter(Boolean);
  const managedKey = /^genc(beta|live|test)_/i.test(apiKey);
  const isTestKey = apiKey === TEST_MODE_API_KEY;
  const isKnownEnvKey = expectedKeys.some((key) => key === apiKey);

  let uid = getUserIdFromRequest(req);

  if (!uid) {
    uid = (await lookupUserByApiKey(apiKey)) ?? undefined;
  }

  if (!uid) {
    const envMap = getEnvApiKeyMap();
    if (envMap[apiKey]) {
      uid = envMap[apiKey];
    }
  }

  if (!uid) {
    const fallbackUid = isTestKey
      ? 'test-extension-user'
      : process.env.ADMIN_DEFAULT_USER_ID || process.env.DEFAULT_EXTENSION_USER_ID || 'test-extension-user';
    uid = fallbackUid ?? undefined;
  }

  if (!uid) {
    console.warn('[chrome-extension] Rejecting request because user could not be resolved for API key');
    return null;
  }

  if (!(isTestKey || isKnownEnvKey || managedKey)) {
    const allowFallback = process.env.ALLOW_EXTENSION_KEY_FALLBACK !== '0';
    if (!allowFallback) {
      return null;
    }
  }

  await ensureUserExists(String(uid));

  return { uid: String(uid), method: 'api-key', testMode: isTestKey, apiKey };
}

export function ensureDb() {
  if (process.env.FORCE_JSON_FALLBACK === '1') return null;
  return getDb();
}

export function ensureFile(filePath: string, initial: unknown = { items: [] }) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
}

export function readArray(file: string, key = 'items') {
  ensureFile(file, { [key]: [] });
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray((parsed as Record<string, unknown[]>)[key])) return (parsed as Record<string, unknown[]>)[key];
    const altKey = Object.keys(parsed).find((k) => Array.isArray((parsed as Record<string, unknown[]>)[k]));
    return altKey ? (parsed as Record<string, unknown[]>)[altKey] : [];
  } catch {
    return [];
  }
}

export function writeArray(file: string, arr: unknown[], key = 'items') {
  ensureFile(file, { [key]: [] });
  try {
    const data = { [key]: arr };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {
    // ignore
  }
}

export function guessPlatformFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
  } catch {
    // ignore
  }
  return 'unknown';
}

export function generateVideoTitleFromUrl(url: string) {
  const date = new Date().toLocaleDateString();
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return `TikTok Video - ${date}`;
    if (host.includes('instagram')) return `Instagram Video - ${date}`;
  } catch {
    // ignore
  }
  return `Video - ${date}`;
}

export function getDefaultThumbnailForPlatform(platform: string) {
  const lower = platform.toLowerCase();
  if (lower.includes('tiktok')) return '/images/placeholder.svg';
  if (lower.includes('instagram')) return '/images/instagram-placeholder.jpg';
  return '/images/video-placeholder.jpg';
}

export function createJobId() {
  return `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function generateIdeaTitle(incomingTitle: string, content: string) {
  const trimmedTitle = incomingTitle.trim();
  if (trimmedTitle) return trimmedTitle;

  const trimmedContent = content.trim();
  if (!trimmedContent) return 'Saved from Extension';

  const firstLine = trimmedContent
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) || trimmedContent;

  const words = firstLine.split(/\s+/).filter(Boolean).slice(0, 16);
  if (!words.length) return 'Saved from Extension';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

export function decodeIdeaUrl(url: string) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

export function validateIdeaVideoUrl(url: string) {
  if (!url) return { valid: false, message: 'url is required' };
  const trimmed = url.trim();
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

export function deriveNoteTypeFromPlatform(platform: string | undefined, provided?: string) {
  if (provided) return provided;
  if (!platform) return 'note';
  if (platform.includes('tiktok')) return 'tiktok';
  if (platform.includes('instagram')) return 'instagram';
  return 'note';
}

export function extractYouTubeId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1];
    }
  } catch {
    // ignore
  }
  return null;
}

export function formatSegmentsToTranscript(
  segments: Array<{ text: string; start: number }>,
  includeTimestamps: boolean,
) {
  if (!Array.isArray(segments) || !segments.length) return '';
  return segments
    .map((segment) => {
      const text = String(segment.text || '').trim();
      if (!includeTimestamps) return text;
      const start = Number(segment.start || 0);
      const minutes = Math.floor(start / 60);
      const seconds = String(Math.floor(start % 60)).padStart(2, '0');
      return `[${minutes}:${seconds}] ${text}`;
    })
    .join(' ');
}

export async function fetchRapidApiTranscript(videoId: string) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) throw new Error('RapidAPI key not configured');

  const response = await fetch(
    `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
    {
      headers: {
        'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`RapidAPI request failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Transcript fetch failed');
  }

  return (data.transcript || []).map((segment: any) => ({
    text: segment.text || '',
    start: parseFloat(segment.offset || 0),
    duration: parseFloat(segment.duration || 0),
  }));
}

export async function fetchYouTubeMetadata(videoId: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.warn('[backend][extension] Failed to fetch YouTube metadata:', (error as Error).message);
    return {};
  }
}

export function cleanTranscriptText(transcript: string) {
  return transcript
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function generateYouTubeTranscriptTitle(transcript: string, fallback?: string) {
  if (fallback && fallback.trim()) return fallback.trim();
  const clean = cleanTranscriptText(transcript);
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 12);
  if (!words.length) return 'YouTube Transcript';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}
