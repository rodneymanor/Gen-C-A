#!/usr/bin/env node

/**
 * Simple API Server for Development
 *
 * This server handles API routes for the Vite React application.
 * It imports and executes the Next.js-style API routes.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const envCandidates = ['.env.local', '.env'];
for (const candidate of envCandidates) {
  const envPath = path.resolve(process.cwd(), candidate);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock NextRequest/NextResponse for compatibility
class MockNextRequest {
  constructor(req) {
    this.req = req;
    this.url = `http://localhost:${PORT}${req.url}`;
    this.method = req.method;
    this.headers = new Map(Object.entries(req.headers));
  }

  async json() {
    return this.req.body;
  }

  get(headerName) {
    return this.headers.get(headerName.toLowerCase());
  }
}

class MockNextResponse {
  static json(data, options = {}) {
    return {
      data,
      status: options.status || 200,
      headers: options.headers || {}
    };
  }
}

// Create a mock module for next/server
const nextServerModule = {
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse
};

// Helper to handle Next.js style route handlers
async function handleApiRoute(routeHandler, req, res) {
  try {
    // Create mock Next.js request/response
    const mockRequest = new MockNextRequest(req);

    // Set up global mocks for Next.js compatibility
    global.NextRequest = MockNextRequest;
    global.NextResponse = MockNextResponse;

    const result = await routeHandler(mockRequest);

    if (result && result.data !== undefined) {
      res.status(result.status || 200);
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      res.json(result.data);
    } else {
      res.status(500).json({ error: 'Invalid response from route handler' });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Import API routes
async function setupRoutes() {
  try {
    // Import simplified creator API routes
    const { handleCreatorTranscription, handleHealthCheck } = await import('./src/api-routes/creators.js');
    const { handleInstagramReels } = await import('./src/api-routes/videos/instagram-reels.js');
    const { handleInstagramUserId } = await import('./src/api-routes/videos/instagram-user-id.js');

    // Import other API route handlers
    const { handleTikTokUserFeed } = await import('./src/api-routes/videos/tiktok-user-feed.js');
    const { handleVideoTranscribe } = await import('./src/api-routes/videos/transcribe.js');
    const { handleVideoScrape } = await import('./src/api-routes/videos/scrape-url.js');
    const { handleVideoWorkflow } = await import('./src/api-routes/videos/orchestrate.js');
    const { handleVoiceAnalyzePatterns } = await import('./src/api-routes/voice.js');
    const { handleSaveCreatorAnalysis } = await import('./src/api-routes/creator-analysis.js');
    const { handleListAnalyzedVideoIds } = await import('./src/api-routes/creator-lookup.js');
    const { handleListBrandVoices, handleGetBrandVoiceTemplates, handleUpdateBrandVoiceMeta } = await import('./src/api-routes/brand-voices.js');
    const { handleGetNotes, handleCreateNote, handleGetNoteById, handleUpdateNote, handleDeleteNote } = await import('./src/api-routes/notes.js');
    const {
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
    } = await import('./src/api-routes/chrome-extension.js');

    // Main transcription endpoint (replaces the complex follow workflow)
    app.post('/api/creators/follow', handleCreatorTranscription);
    app.post('/api/creators/transcribe', handleCreatorTranscription);

    // Instagram specific endpoints
    app.get('/api/instagram/user-id', handleInstagramUserId);
    app.get('/api/instagram/user-reels', handleInstagramReels);
    app.post('/api/instagram/user-reels', handleInstagramReels);

    // TikTok API routes
    app.post('/api/tiktok/user-feed', handleTikTokUserFeed);

    app.post('/api/video/transcribe-from-url', handleVideoTranscribe);
    app.post('/api/video/scrape-url', handleVideoScrape);
    app.post('/api/video/orchestrate', handleVideoWorkflow);

    app.post('/api/voice/analyze-patterns', handleVoiceAnalyzePatterns);
    app.post('/api/creator/save-analysis', handleSaveCreatorAnalysis);
    app.get('/api/creator/analyzed-video-ids', handleListAnalyzedVideoIds);
    app.get('/api/brand-voices/list', handleListBrandVoices);
    app.get('/api/brand-voices/templates', handleGetBrandVoiceTemplates);
    app.post('/api/brand-voices/update-meta', handleUpdateBrandVoiceMeta);

    // Notes API (used by iOS Shortcuts and app)
    app.get('/api/notes', handleGetNotes);
    app.post('/api/notes', handleCreateNote);
    app.get('/api/notes/:id', handleGetNoteById);
    app.put('/api/notes/:id', handleUpdateNote);
    app.delete('/api/notes/:id', handleDeleteNote);

    // Chrome Extension routes
    app.get('/api/chrome-extension/notes', handleCENotesGet);
    app.post('/api/chrome-extension/notes', handleCENotesPost);
    app.put('/api/chrome-extension/notes', handleCENotesPut);
    app.delete('/api/chrome-extension/notes', handleCENotesDelete);

    app.get('/api/chrome-extension/collections', handleCECollectionsGet);
    app.post('/api/chrome-extension/collections', handleCECollectionsPost);
    app.post('/api/chrome-extension/collections/add-video', handleCECollectionsAddVideo);

    app.post('/api/content-inbox/items', handleContentInboxPost);
    app.post('/api/idea-inbox/items', handleContentInboxPost);

    app.post('/api/chrome-extension/idea-inbox/text', handleIdeaInboxTextPost);
    app.post('/api/chrome-extension/idea-inbox/video', handleIdeaInboxVideoPost);

    app.get('/api/chrome-extension/youtube-transcript', handleYouTubeTranscriptGet);
    app.post('/api/chrome-extension/youtube-transcript', handleYouTubeTranscriptPost);

    // Persona routes - TODO: Convert from Next.js format if needed
    // app.post('/api/personas/generate-metadata', handlePersonaMetadata);
    // app.post('/api/personas/create', handlePersonaCreate);

    // Health check with API info
    app.get('/api/health', handleHealthCheck);

    console.log('✅ API routes loaded successfully (including TikTok routes)');
  } catch (error) {
    console.error('❌ Failed to load API routes:', error);

    // Fallback routes for development
    app.post('/api/creators/follow', (req, res) => {
      res.json({
        success: true,
        userId: req.body.username,
        message: 'Fallback transcription route',
        creator: {
          username: req.body.username,
          platform: req.body.platform || 'instagram'
        },
        videos: [
          {
            id: '1',
            title: 'Test Video',
            url: 'https://example.com/video.mp4',
            status: 'pending'
          }
        ],
        totalCount: 1
      });
    });

    app.get('/api/instagram/user-id', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Instagram user-id route unavailable in fallback mode'
      });
    });

    const fallbackReels = (req, res) => {
      res.json({
        success: true,
        videos: [
          {
            id: 'reel_1',
            videoUrl: 'https://example.com/reel1.mp4',
            thumbnailUrl: 'https://example.com/thumb1.jpg',
            title: 'Test Reel 1'
          }
        ],
        totalCount: 1
      });
    };

    app.get('/api/instagram/user-reels', fallbackReels);
    app.post('/api/instagram/user-reels', fallbackReels);
  }
}

// Start server
async function startServer() {
  await setupRoutes();

  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);
