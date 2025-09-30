import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';

const app = createApp();

export const config = {
  runtime: 'nodejs20.x',
  regions: ['iad1'],
  includeFiles: [
    'openapi/openapi.yaml',
    '../src/**/*',
    '../lib/**/*',
    '../routes/**/*',
    '../../src/**/*'
  ],
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
