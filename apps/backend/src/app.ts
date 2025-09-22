import express, { type Request, type Response } from 'express';
import cors from 'cors';

import { notesRouter } from './routes/notes';
import { scriptsRouter } from './routes/scripts';
import { collectionsRouter, collectionVideosRouter } from './routes/collections';
import { authRouter } from './routes/auth';
import { videoRouter } from './routes/video';
import { tiktokRouter } from './routes/tiktok';
import { instagramRouter } from './routes/instagram';
import { voiceRouter } from './routes/voice';
import { extensionRouter } from './routes/extension/index.js';
import { keysRouter } from './routes/keys.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

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
  app.use('/api/chrome-extension', extensionRouter);

  return app;
}

export type AppInstance = ReturnType<typeof createApp>;
