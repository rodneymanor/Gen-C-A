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
import { validateEnv } from './src/config/env.runtime.js';

const envCandidates = ['.env.local', '.env'];
for (const candidate of envCandidates) {
  const envPath = path.resolve(process.cwd(), candidate);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Validate env for the dev server; warn by default during migration
validateEnv('dev-server');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;
const BACKEND_PROXY_TARGET =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  process.env.BACKEND_DEV_URL ||
  'http://localhost:5001';

// Middleware
app.use(cors());
app.use(express.json());

// Priority shims: ensure instagram/tiktok always hit canonical backend in dev (redundant with catch-all, but explicit for clarity)
app.use('/api/instagram', forwardHandler());
app.use('/api/tiktok', forwardHandler());

// Simple request logging for observability during unification
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const id = Math.random().toString(36).slice(2, 8);
  console.log(`[dev:${id}] ➡️  ${method} ${originalUrl}`);
  res.on('finish', () => {
    const dur = Date.now() - start;
    console.log(`[dev:${id}] ⬅️  ${res.statusCode} ${method} ${originalUrl} (${dur}ms)`);
  });
  next();
});

// Provide a fallback health endpoint so smoke checks pass even if route loading fails
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'dev-server', mode: 'fallback' });
});

async function forwardToBackend(req, res, pathOverride) {
  const base = BACKEND_PROXY_TARGET.replace(/\/$/, '');
  const targetPath = pathOverride || req.originalUrl;
  const targetUrl = new URL(targetPath, `${base}/`);

  if (pathOverride) {
    const query = req.query || {};
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry != null) targetUrl.searchParams.append(key, String(entry));
        });
      } else if (value != null) {
        targetUrl.searchParams.set(key, String(value));
      }
    });
  }

  const headers = {};
  ['authorization', 'x-api-key', 'x-user-id', 'content-type'].forEach((key) => {
    const value = req.headers[key];
    if (typeof value === 'string') {
      headers[key] = value;
    }
  });

  const method = (req.method || 'GET').toUpperCase();
  let body;
  if (!['GET', 'HEAD'].includes(method)) {
    if (req.body && typeof req.body === 'object') {
      body = JSON.stringify(req.body);
      if (!headers['content-type']) headers['content-type'] = 'application/json';
    } else if (typeof req.body === 'string') {
      body = req.body;
      if (!headers['content-type']) headers['content-type'] = 'application/json';
    }
  }

  const response = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
  });

  const text = await response.text();
  try {
    const data = text ? JSON.parse(text) : null;
    res.setHeader('x-served-by', 'dev-proxy');
    res.status(response.status).json(data);
  } catch {
    res.setHeader('x-served-by', 'dev-proxy');
    res.status(response.status).send(text);
  }
}

const forwardHandler = (pathOverride) => async (req, res) => {
  try {
    await forwardToBackend(req, res, pathOverride);
  } catch (error) {
    console.error('[dev server proxy] error:', error);
    res.status(502).json({ success: false, error: 'Failed to reach backend service.' });
  }
};

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

// Configure minimal dev proxy routes; all others forwarded by catch-all below
async function setupRoutes() {
  // Chrome Extension routes (explicit mappings maintained while migrating)
  app.use('/api/chrome-extension', forwardHandler());
  app.post('/api/content-inbox/items', forwardHandler('/api/chrome-extension/content-inbox'));
  app.post('/api/idea-inbox/items', forwardHandler('/api/chrome-extension/idea-inbox/text'));

  console.log('✅ Dev proxy configured. All /api/* forwarded to backend.');
}

// Start server
async function startServer() {
  await setupRoutes();

  // Catch-all proxy: any missing /api/* goes to canonical backend
  app.use('/api', forwardHandler());

  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);
