import type { VercelRequest, VercelResponse } from '@vercel/node';
import url from 'url';

// Import handlers from existing Express-style modules
import { handleCreatorTranscription, handleInstagramReels, handleHealthCheck } from '../src/api-routes/creators.js';
import { handleTikTokUserFeed } from '../src/api-routes/tiktok.js';
import { handleVideoTranscribe } from '../src/api-routes/video.js';
import { handleVoiceAnalyzePatterns } from '../src/api-routes/voice.js';
import { handleSaveCreatorAnalysis } from '../src/api-routes/creator-analysis.js';
import { handleListAnalyzedVideoIds } from '../src/api-routes/creator-lookup.js';
import { handleListBrandVoices, handleGetBrandVoiceTemplates, handleDeleteBrandVoice, handleUpdateBrandVoiceMeta } from '../src/api-routes/brand-voices.js';
import { handleGetScripts, handleCreateScript, handleGetScriptById, handleUpdateScript, handleDeleteScript } from '../src/api-routes/scripts.js';
import { handleGetNotes, handleCreateNote, handleGetNoteById, handleUpdateNote, handleDeleteNote } from '../src/api-routes/notes.js';
import { handleGetCollections, handleCreateCollection, handleGetUserCollections, handleGetCollectionVideos, handleMoveVideo, handleCopyVideo, handleDeleteCollection, handleUpdateCollection, handleAddVideoToCollection } from '../src/api-routes/collections.js';

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
    if (path === '/api/instagram/user-reels' && req.method === 'POST') return handleInstagramReels(req as any, res as any);
    if (path === '/api/tiktok/user-feed' && req.method === 'POST') return handleTikTokUserFeed(req as any, res as any);
    if (path === '/api/video/transcribe-from-url' && req.method === 'POST') return handleVideoTranscribe(req as any, res as any);

    // Voice + Creator analysis
    if (path === '/api/voice/analyze-patterns' && req.method === 'POST') return handleVoiceAnalyzePatterns(req as any, res as any);
    if (path === '/api/creator/save-analysis' && req.method === 'POST') return handleSaveCreatorAnalysis(req as any, res as any);
    if (path === '/api/creator/analyzed-video-ids' && req.method === 'GET') return handleListAnalyzedVideoIds(req as any, res as any);

    // Brand voices
    if (path === '/api/brand-voices/list' && req.method === 'GET') return handleListBrandVoices(req as any, res as any);
    if (path === '/api/brand-voices/templates' && (req.method === 'GET' || req.method === 'POST')) return handleGetBrandVoiceTemplates(req as any, res as any);
    if (path === '/api/brand-voices/delete' && req.method === 'POST') return handleDeleteBrandVoice(req as any, res as any);
    if (path === '/api/brand-voices/update-meta' && req.method === 'POST') return handleUpdateBrandVoiceMeta(req as any, res as any);

    // Scripts
    if (path === '/api/scripts' && req.method === 'GET') return handleGetScripts(req as any, res as any);
    if (path === '/api/scripts' && req.method === 'POST') return handleCreateScript(req as any, res as any);
    const scriptsIdMatch = path.match(/^\/api\/scripts\/([^/]+)$/);
    if (scriptsIdMatch) {
      (req as any).params = { id: scriptsIdMatch[1] };
      if (req.method === 'GET') return handleGetScriptById(req as any, res as any);
      if (req.method === 'PUT') return handleUpdateScript(req as any, res as any);
      if (req.method === 'DELETE') return handleDeleteScript(req as any, res as any);
    }

    // Notes
    if (path === '/api/notes' && req.method === 'GET') return handleGetNotes(req as any, res as any);
    if (path === '/api/notes' && req.method === 'POST') return handleCreateNote(req as any, res as any);
    const notesIdMatch = path.match(/^\/api\/notes\/([^/]+)$/);
    if (notesIdMatch) {
      (req as any).params = { id: notesIdMatch[1] };
      if (req.method === 'GET') return handleGetNoteById(req as any, res as any);
      if (req.method === 'PUT') return handleUpdateNote(req as any, res as any);
      if (req.method === 'DELETE') return handleDeleteNote(req as any, res as any);
    }

    // Collections + Videos
    if (path === '/api/collections' && req.method === 'GET') return handleGetCollections(req as any, res as any);
    if (path === '/api/collections' && req.method === 'POST') return handleCreateCollection(req as any, res as any);
    if (path === '/api/collections/user-collections') return handleGetUserCollections(req as any, res as any);
    if (path === '/api/videos/collection' && req.method === 'POST') return handleGetCollectionVideos(req as any, res as any);
    if (path === '/api/collections/move-video' && req.method === 'POST') return handleMoveVideo(req as any, res as any);
    if (path === '/api/collections/copy-video' && req.method === 'POST') return handleCopyVideo(req as any, res as any);
    if (path === '/api/collections/delete' && req.method === 'DELETE') return handleDeleteCollection(req as any, res as any);
    if (path === '/api/collections/update' && req.method === 'PATCH') return handleUpdateCollection(req as any, res as any);
    if (path === '/api/videos/add-to-collection' && req.method === 'POST') return handleAddVideoToCollection(req as any, res as any);

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

