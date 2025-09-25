import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveExtensionUser } from '../_utils/extension-auth';
import {
  resolveCollectionsService,
  sendCollectionsError,
} from '../_utils/collections-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Authenticate via Bearer or API key mapping
  const auth = await resolveExtensionUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const service = resolveCollectionsService();

    if (req.method === 'GET') {
      const result = await service.listCollections(auth.uid);
      return res.status(200).json({ success: true, ...result, user: { id: auth.uid } });
    }

    if (req.method === 'POST') {
      const body = (req.body as any) || {};
      const { title, description = '' } = body;
      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }
      const collection = await service.createCollection(auth.uid, { title: String(title), description: String(description) });
      return res.status(201).json({ success: true, message: 'Collection created successfully', collection });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return sendCollectionsError(res, error, 'Failed to process extension collections request', '[api/chrome-extension/collections] error:');
  }
}

