import type { Request, Response } from 'express';
import { Router } from 'express';
import path from 'path';

import {
  DATA_DIR,
  ensureDb,
  resolveUser,
  readArray,
  writeArray,
  extractYouTubeId,
  fetchRapidApiTranscript,
  formatSegmentsToTranscript,
  fetchYouTubeMetadata,
  cleanTranscriptText,
  generateYouTubeTranscriptTitle,
} from './utils.js';

export const youtubeRouter = Router();

youtubeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { url, saveAsNote = false, includeTimestamps = false } = req.body || {};
    if (!url || !String(url).trim()) {
      res.status(400).json({ success: false, error: 'YouTube URL is required' });
      return;
    }

    const videoId = extractYouTubeId(String(url).trim());
    if (!videoId) {
      res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });
      return;
    }

    const segments = await fetchRapidApiTranscript(videoId);
    if (!segments.length) {
      res.status(404).json({
        success: false,
        error:
          'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
      });
      return;
    }

    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = await fetchYouTubeMetadata(videoId);

    const response: Record<string, unknown> = {
      success: true,
      transcript,
      segments,
      metadata: {
        videoId,
        title: metadata.title,
        channelName: metadata.author_name,
        thumbnailUrl: metadata.thumbnail_url,
      },
    };

    if (saveAsNote) {
      const db = ensureDb();
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
          videoId,
          title: metadata.title,
          channelName: metadata.author_name,
          thumbnailUrl: metadata.thumbnail_url,
          videoUrl: String(url).trim(),
          domain: 'youtube.com',
          transcriptLength: clean.length,
          segmentCount: segments.length,
        },
        createdAt: now,
        updatedAt: now,
        userId: user.uid,
      };

      if (db) {
        const ref = await db.collection('notes').add(noteData);
        response.note = {
          id: ref.id,
          ...noteData,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      } else {
        const file = path.join(DATA_DIR, 'notes.json');
        const arr = readArray(file);
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const saved = {
          id,
          ...noteData,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        arr.unshift(saved);
        writeArray(file, arr);
        response.note = saved;
      }

      if (response.note && process.env.NEXT_PUBLIC_APP_URL) {
        response.editUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/capture/notes/new?noteId=${
          (response.note as { id: string }).id
        }`;
      }
    }

    res.json(response);
  } catch (error) {
    console.error('[backend][extension] youtube transcript error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
});

youtubeRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const url = req.query.url as string | undefined;
    const includeTimestamps = String(req.query.includeTimestamps) === 'true';
    if (!url) {
      res.status(400).json({ success: false, error: 'YouTube URL is required' });
      return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });
      return;
    }

    const segments = await fetchRapidApiTranscript(videoId);
    if (!segments.length) {
      res.status(404).json({
        success: false,
        error:
          'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
      });
      return;
    }

    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = await fetchYouTubeMetadata(videoId);

    res.json({
      success: true,
      transcript,
      segments,
      metadata: {
        videoId,
        title: metadata.title,
        channelName: metadata.author_name,
        thumbnailUrl: metadata.thumbnail_url,
      },
    });
  } catch (error) {
    console.error('[backend][extension] youtube transcript GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
});
