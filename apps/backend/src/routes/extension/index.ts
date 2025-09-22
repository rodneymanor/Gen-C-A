import { Router } from 'express';

import { notesRouter } from './notes.js';
import { collectionsRouter } from './collections.js';
import { inboxRouter } from './inbox.js';
import { youtubeRouter } from './youtube.js';

export const extensionRouter = Router();

extensionRouter.use('/notes', notesRouter);
extensionRouter.use('/collections', collectionsRouter);
extensionRouter.use('/', inboxRouter);
extensionRouter.use('/youtube-transcript', youtubeRouter);
