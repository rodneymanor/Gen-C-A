#!/usr/bin/env node

/**
 * Vite-Express Integrated Server
 * Handles both the Vite dev server and API routes in a single process
 */

import dotenv from 'dotenv';
import express from 'express';
import ViteExpress from 'vite-express';
import cors from 'cors';
import path from 'path';

// Load environment variables from .env.local and .env files
dotenv.config({ path: '.env.local' });
dotenv.config(); // Load .env as fallback

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Serve documentation markdown files at /docs/*
app.use('/docs', express.static(path.join(process.cwd(), 'docs')));

// Import existing creator routes
import { handleCreatorTranscription, handleInstagramReels, handleHealthCheck } from './src/api-routes/creators.js';

// Import converted TikTok routes
import { handleTikTokUserFeed } from './src/api-routes/tiktok.js';
import { handleVideoTranscribe } from './src/api-routes/video.js';
import { handleVoiceAnalyzePatterns } from './src/api-routes/voice.js';
import { handleSaveCreatorAnalysis } from './src/api-routes/creator-analysis.js';
import { handleListAnalyzedVideoIds } from './src/api-routes/creator-lookup.js';
import { handleListBrandVoices, handleGetBrandVoiceTemplates, handleDeleteBrandVoice, handleUpdateBrandVoiceMeta } from './src/api-routes/brand-voices.js';
import { handleGetScripts, handleCreateScript, handleGetScriptById, handleUpdateScript, handleDeleteScript } from './src/api-routes/scripts.js';
import { handleGetNotes, handleCreateNote, handleGetNoteById, handleUpdateNote, handleDeleteNote } from './src/api-routes/notes.js';
import {
  handleCENotesGet,
  handleCENotesPost,
  handleCENotesPut,
  handleCENotesDelete,
  handleCECollectionsGet,
  handleCECollectionsPost,
  handleCECollectionsAddVideo,
  handleContentInboxPost,
  handleIdeaInboxTextPost,
  handleIdeaInboxVideoPost,
  handleYouTubeTranscriptGet,
  handleYouTubeTranscriptPost,
} from './src/api-routes/chrome-extension.js';
import {
  handleGetCollections,
  handleCreateCollection,
  handleGetUserCollections,
  handleGetCollectionVideos,
  handleMoveVideo,
  handleCopyVideo,
  handleDeleteCollection,
  handleUpdateCollection,
  handleAddVideoToCollection,
} from './src/api-routes/collections.js';

// Existing API routes
app.post('/api/creators/follow', handleCreatorTranscription);
app.post('/api/creators/transcribe', handleCreatorTranscription);
app.post('/api/instagram/user-reels', handleInstagramReels);
app.get('/api/health', handleHealthCheck);

// TikTok API Routes
app.post('/api/tiktok/user-feed', handleTikTokUserFeed);
app.post('/api/video/transcribe-from-url', handleVideoTranscribe);

// Voice analysis route
app.post('/api/voice/analyze-patterns', handleVoiceAnalyzePatterns);
app.post('/api/creator/save-analysis', handleSaveCreatorAnalysis);
app.get('/api/creator/analyzed-video-ids', handleListAnalyzedVideoIds);
app.get('/api/brand-voices/list', handleListBrandVoices);
app.get('/api/brand-voices/templates', handleGetBrandVoiceTemplates);
app.post('/api/brand-voices/delete', handleDeleteBrandVoice);
app.post('/api/brand-voices/update-meta', handleUpdateBrandVoiceMeta);

// Scripts API routes
app.get('/api/scripts', handleGetScripts);
app.post('/api/scripts', handleCreateScript);
app.get('/api/scripts/:id', handleGetScriptById);
app.put('/api/scripts/:id', handleUpdateScript);
app.delete('/api/scripts/:id', handleDeleteScript);

// Notes API routes
app.get('/api/notes', handleGetNotes);
app.post('/api/notes', handleCreateNote);
app.get('/api/notes/:id', handleGetNoteById);
app.put('/api/notes/:id', handleUpdateNote);
app.delete('/api/notes/:id', handleDeleteNote);

// Collections API routes (migrated)
app.get('/api/collections', handleGetCollections);
app.post('/api/collections', handleCreateCollection);
app.get('/api/collections/user-collections', handleGetUserCollections);
app.post('/api/videos/collection', handleGetCollectionVideos);
app.post('/api/collections/move-video', handleMoveVideo);
app.post('/api/collections/copy-video', handleCopyVideo);
app.delete('/api/collections/delete', handleDeleteCollection);
app.patch('/api/collections/update', handleUpdateCollection);
app.post('/api/videos/add-to-collection', handleAddVideoToCollection);

// Chrome Extension: Notes CRUD
app.get('/api/chrome-extension/notes', handleCENotesGet);
app.post('/api/chrome-extension/notes', handleCENotesPost);
app.put('/api/chrome-extension/notes', handleCENotesPut);
app.delete('/api/chrome-extension/notes', handleCENotesDelete);

// Chrome Extension: Collections proxy and add-video
app.get('/api/chrome-extension/collections', handleCECollectionsGet);
app.post('/api/chrome-extension/collections', handleCECollectionsPost);
app.post('/api/chrome-extension/collections/add-video', handleCECollectionsAddVideo);

// Content Inbox + Idea Inbox
app.post('/api/content-inbox/items', handleContentInboxPost);
// Alias routes for compatibility
app.post('/api/idea-inbox/items', handleContentInboxPost);
app.post('/api/chrome-extension/idea-inbox/text', handleIdeaInboxTextPost);
app.post('/api/chrome-extension/idea-inbox/video', handleIdeaInboxVideoPost);

// YouTube transcript for extension
app.get('/api/chrome-extension/youtube-transcript', handleYouTubeTranscriptGet);
app.post('/api/chrome-extension/youtube-transcript', handleYouTubeTranscriptPost);

// Compatibility routes (legacy)
// POST /api/collections/user — legacy endpoint expecting { userId } in body
app.post('/api/collections/user', async (req, res) => {
  // Delegate to GET /api/collections behavior using provided userId
  try {
    if (!req.body || !req.body.userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    // Reuse handler via a shallow wrapper
    req.headers['x-user-id'] = String(req.body.userId);
    await handleGetCollections(req, res);
  } catch (e) {
    console.error('[compat /api/collections/user] error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch user collections' });
  }
});

app.post('/api/personas/generate-metadata', async (req, res) => {
  try {
    // Placeholder - will be replaced with actual implementation
    res.json({
      success: false,
      error: 'Persona metadata route not yet implemented',
      message: 'Please wait for route conversion'
    });
  } catch (error) {
    console.error('Persona Metadata Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

app.post('/api/personas/create', async (req, res) => {
  try {
    // Placeholder - will be replaced with actual implementation
    res.json({
      success: false,
      error: 'Persona create route not yet implemented',
      message: 'Please wait for route conversion'
    });
  } catch (error) {
    console.error('Persona Create Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the integrated server
const PORT = process.env.PORT || 3000;

ViteExpress.listen(app, PORT, () => {
  console.log(`🚀 Vite-Express server running on http://localhost:${PORT}`);
  console.log(`📋 API routes available at http://localhost:${PORT}/api/*`);
  console.log(`🎨 Frontend served by Vite at http://localhost:${PORT}`);
});
