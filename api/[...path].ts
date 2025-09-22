import type { VercelRequest, VercelResponse } from '@vercel/node';
import url from 'url';

// Import handlers from existing Express-style modules
import { handleCreatorTranscription, handleHealthCheck } from '../src/api-routes/creators.js';
import { handleInstagramReels } from '../src/api-routes/videos/instagram-reels.js';
import { handleInstagramUserId } from '../src/api-routes/videos/instagram-user-id.js';
import { handleTikTokUserFeed } from '../src/api-routes/videos/tiktok-user-feed.js';
import { handleVideoTranscribe } from '../src/api-routes/videos/transcribe.js';
import { handleVoiceAnalyzePatterns } from '../src/api-routes/voice.js';
import {
  handleCENotesGet,
  handleCENotesPost,
  handleCENotesPut,
  handleCENotesDelete,
} from '../src/api-routes/chrome-extension.js';
import { handleDeleteVideo } from '../src/api-routes/collections.js';
import creatorSaveAnalysisHandler from './creator/save-analysis';
import creatorAnalyzedVideoIdsHandler from './creator/analyzed-video-ids';
import brandVoicesListHandler from './brand-voices/list';
import brandVoicesTemplatesHandler from './brand-voices/templates';
import brandVoicesDeleteHandler from './brand-voices/delete';
import brandVoicesUpdateMetaHandler from './brand-voices/update-meta';
import scriptsIndexHandler from './scripts/index';
import scriptsIdHandler from './scripts/[id]';
import notesIndexHandler from './notes/index';
import notesIdHandler from './notes/[id]';
import collectionsIndexHandler from './collections/index';
import collectionsUserCollectionsHandler from './collections/user-collections';
import collectionsMoveVideoHandler from './collections/move-video';
import collectionsCopyVideoHandler from './collections/copy-video';
import collectionsDeleteHandler from './collections/delete';
import collectionsUpdateHandler from './collections/update';
import videosCollectionHandler from './videos/collection';
import videosAddToCollectionHandler from './videos/add-to-collection';

function aiAction(text: string, actionType: string, option?: string) {
  const extractTheme = (t: string) => {
    const words = t.toLowerCase().split(/\s+/);
    const common = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','this','that','you','your','is','are','was','were','will','would','could','should']);
    const meaningful = words.filter(w => w.length > 3 && !common.has(w) && /^[a-z]+$/.test(w));
    return meaningful[0] || 'this topic';
  };
  const simplify = (t: string) => t.replace(/\b(essentially|fundamentally|systematically)\b/gi, '').replace(/\b(utilize|implement|facilitate)\b/gi, (m) => m.toLowerCase() === 'utilize' ? 'use' : m.toLowerCase() === 'implement' ? 'do' : m.toLowerCase() === 'facilitate' ? 'help' : m).replace(/\b(in order to|for the purpose of)\b/gi, 'to').replace(/[.!?]+/g, '. ').replace(/\s+/g, ' ').trim();
  const theme = extractTheme(text);
  switch (actionType) {
    case 'simplify': return simplify(text);
    case 'generate_variations':
      return [
        `🔥 Stop everything! This ${theme} secret will change your perspective forever!`,
        `Did you know there's a hidden truth about ${theme} that 95% of people miss?`,
      ].map((v, i) => `${i + 1}. ${v}`).join('\n\n');
    case 'convert_hook_type':
      return option === 'benefit' ? `Imagine mastering ${theme} and seeing incredible results in days. Here's how...` : `What if I told you everything you think you know about ${theme} is incomplete?`;
    default:
      return `${text}\n\n[Enhanced with ${actionType}]`;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = url.parse(req.url || '/', true);
  const path = pathname || '/';

  try {
    // Health
    if (path === '/api/health' && req.method === 'GET') return handleHealthCheck(req as any, res as any);

    // Creators/Instagram/TikTok/Video
    if (path === '/api/creators/follow' && req.method === 'POST') return handleCreatorTranscription(req as any, res as any);
    if (path === '/api/creators/transcribe' && req.method === 'POST') return handleCreatorTranscription(req as any, res as any);
    if (path === '/api/instagram/user-id' && (req.method === 'GET' || req.method === 'POST')) {
      return handleInstagramUserId(req as any, res as any);
    }
    if (path === '/api/instagram/user-reels' && (req.method === 'GET' || req.method === 'POST')) {
      return handleInstagramReels(req as any, res as any);
    }
    if (path === '/api/tiktok/user-feed' && req.method === 'POST') return handleTikTokUserFeed(req as any, res as any);
    if (path === '/api/video/transcribe-from-url' && req.method === 'POST') return handleVideoTranscribe(req as any, res as any);

    // Voice + Creator analysis
    if (path === '/api/voice/analyze-patterns' && req.method === 'POST') return handleVoiceAnalyzePatterns(req as any, res as any);
    if (path === '/api/creator/save-analysis' && req.method === 'POST') return creatorSaveAnalysisHandler(req, res);
    if (path === '/api/creator/analyzed-video-ids' && (req.method === 'GET' || req.method === 'POST')) {
      return creatorAnalyzedVideoIdsHandler(req, res);
    }

    // Brand voices
    if (path === '/api/brand-voices/list' && req.method === 'GET') return brandVoicesListHandler(req, res);
    if (path === '/api/brand-voices/templates' && (req.method === 'GET' || req.method === 'POST')) {
      return brandVoicesTemplatesHandler(req, res);
    }
    if (path === '/api/brand-voices/delete' && req.method === 'POST') return brandVoicesDeleteHandler(req, res);
    if (path === '/api/brand-voices/update-meta' && req.method === 'POST') return brandVoicesUpdateMetaHandler(req, res);

    // Scripts
    if (path === '/api/scripts') {
      return scriptsIndexHandler(req, res);
    }
    const scriptsIdMatch = path.match(/^\/api\/scripts\/([^/]+)$/);
    if (scriptsIdMatch) {
      const id = scriptsIdMatch[1];
      (req as any).params = { id };
      const query = ({ ...(req.query as Record<string, unknown>), id } as Record<string, unknown>);
      (req as any).query = query;
      return scriptsIdHandler(req, res);
    }

    // Notes
    if (path === '/api/notes') {
      return notesIndexHandler(req, res);
    }
    const notesIdMatch = path.match(/^\/api\/notes\/([^/]+)$/);
    if (notesIdMatch) {
      const id = notesIdMatch[1];
      (req as any).params = { id };
      const query = ({ ...(req.query as Record<string, unknown>), id } as Record<string, unknown>);
      (req as any).query = query;
      return notesIdHandler(req, res);
    }

    // Chrome extension notes
    if (path === '/api/chrome-extension/notes' && req.method === 'GET') {
      return handleCENotesGet(req as any, res as any);
    }
    if (path === '/api/chrome-extension/notes' && req.method === 'POST') {
      return handleCENotesPost(req as any, res as any);
    }
    if (path === '/api/chrome-extension/notes' && req.method === 'PUT') {
      return handleCENotesPut(req as any, res as any);
    }
    if (path === '/api/chrome-extension/notes' && req.method === 'DELETE') {
      return handleCENotesDelete(req as any, res as any);
    }

    // Collections + Videos
    if (path === '/api/collections') {
      return collectionsIndexHandler(req, res);
    }
    if (path === '/api/collections/user-collections') {
      return collectionsUserCollectionsHandler(req, res);
    }
    if (path === '/api/videos/collection' && req.method === 'POST') {
      return videosCollectionHandler(req, res);
    }
    if (path === '/api/collections/move-video' && req.method === 'POST') {
      return collectionsMoveVideoHandler(req, res);
    }
    if (path === '/api/collections/copy-video' && req.method === 'POST') {
      return collectionsCopyVideoHandler(req, res);
    }
    if (path === '/api/collections/delete' && req.method === 'DELETE') {
      return collectionsDeleteHandler(req, res);
    }
    if (path === '/api/collections/update' && req.method === 'PATCH') {
      return collectionsUpdateHandler(req, res);
    }
    if (path === '/api/videos/add-to-collection' && req.method === 'POST') {
      return videosAddToCollectionHandler(req, res);
    }
    if (path === '/api/videos/delete' && req.method === 'POST') return handleDeleteVideo(req as any, res as any);

    // AI action mock
    if (path === '/api/ai-action' && req.method === 'POST') {
      const body = (req.body || {}) as any;
      if (!body.actionType || !body.text) return res.status(400).json({ success: false, error: 'Missing fields' });
      const modifiedText = aiAction(String(body.text), String(body.actionType), body.option ? String(body.option) : undefined);
      return res.json({ success: true, modifiedText });
    }

    return res.status(404).send('Not Found');
  } catch (err: any) {
    console.error('[api/[...path]] error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
  }
}
