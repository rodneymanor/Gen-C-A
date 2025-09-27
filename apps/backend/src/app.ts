import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { OpenApiValidator } from 'express-openapi-validator';

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

export const OPENAPI_VALIDATOR_PROMISE = 'openApiValidatorPromise' as const;
const scriptsApiSpecPath = path.resolve(process.cwd(), 'openapi/openapi.yaml');

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Install OpenAPI validator for documented routes (request/response)
  const validatorPromise = new OpenApiValidator({
    apiSpec: scriptsApiSpecPath,
    validateRequests: true,
    validateResponses: true,
  }).install(app);

  // Expose promise so server can await readiness before listening
  (app as any).locals[OPENAPI_VALIDATOR_PROMISE] = validatorPromise;

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

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
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
