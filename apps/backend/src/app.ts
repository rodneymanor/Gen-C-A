import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { middleware as openapiValidator } from 'express-openapi-validator';

import { notesRouter } from './routes/notes';
import { scriptsRouter } from './routes/scripts';
import { collectionsRouter, collectionVideosRouter } from './routes/collections';
import { authRouter } from './routes/auth';
import { videoRouter } from './routes/video';
import { tiktokRouter } from './routes/tiktok';
import { instagramRouter } from './routes/instagram';
import { voiceRouter } from './routes/voice';
import { creatorRouter } from './routes/creator';
import { creatorLookupRouter } from './routes/creator-lookup';
import { brandRouter } from './routes/brand';
import { brandVoicesRouter } from './routes/brand-voices';
import { extensionRouter } from './routes/extension/index.js';
import { keysRouter } from './routes/keys.js';
import { viralContentRouter } from './routes/viral-content';

const scriptsApiSpecPath = path.resolve(process.cwd(), 'openapi/openapi.yaml');

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Identify responses as coming from the canonical backend
  app.use((req, res, next) => {
    res.setHeader('x-served-by', 'backend');
    next();
  });

  // Health endpoint (not part of OpenAPI; keep before validator)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Serve OpenAPI spec and Swagger UI from backend
  app.get('/openapi', async (_req: Request, res: Response) => {
    try {
      const spec = await fs.readFile(scriptsApiSpecPath, 'utf8');
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(spec);
    } catch (error) {
      console.error('[backend][openapi] failed to read spec:', error);
      res.status(500).json({ success: false, error: 'Failed to load OpenAPI spec' });
    }
  });

  app.get('/docs', (_req: Request, res: Response) => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Gen C API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f7f7f7; }
      #swagger-ui { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/openapi',
          dom_id: '#swagger-ui',
          deepLinking: true,
          docExpansion: 'none',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'BaseLayout'
        });
      };
    </script>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(html);
  });

  // Install OpenAPI validator for documented routes (request/response)
  app.use(
    ...openapiValidator({
      apiSpec: scriptsApiSpecPath,
      validateRequests: true,
      validateResponses: true,
      // Allow routes not yet described in the spec (Instagram/TikTok/Viral Content, etc.)
      ignoreUndocumented: true,
    }),
  );

  app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    const requestId = Math.random().toString(36).slice(2, 8);
    console.log(`[api:${requestId}] ➡️  ${method} ${originalUrl}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[api:${requestId}] ⬅️  ${res.statusCode} ${method} ${originalUrl} (${duration}ms)`
      );
    });

    next();
  });

  app.use('/api/notes', notesRouter);
  app.use('/api/scripts', scriptsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/keys', keysRouter);
  app.use('/api/collections', collectionsRouter);
  app.use('/api/videos', collectionVideosRouter);
  app.use('/api/video', videoRouter);
  app.use('/api/tiktok', tiktokRouter);
  app.use('/api/instagram', instagramRouter);
  app.use('/api/voice', voiceRouter);
  app.use('/api/creator', creatorRouter);
  app.use('/api/creator', creatorLookupRouter);
  app.use('/api/brand', brandRouter);
  app.use('/api/brand-voices', brandVoicesRouter);
  app.use('/api/chrome-extension', extensionRouter);
  app.use('/api/viral-content', viralContentRouter);

  return app;
}

export type AppInstance = ReturnType<typeof createApp>;
