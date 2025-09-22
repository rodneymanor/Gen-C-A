import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getScriptsRequestContext, sendScriptsError } from '../_utils/scripts-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getScriptsRequestContext(req, res);
  if (!context) {
    return;
  }

  const { auth, service } = context;

  try {
    if (req.method === 'GET') {
      const scripts = await service.listScripts(auth.uid);
      return res.status(200).json({ success: true, scripts });
    }

    if (req.method === 'POST') {
      const script = await service.createScript(auth.uid, (req.body as any) || {});
      return res.status(201).json({ success: true, script });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return sendScriptsError(res, error, 'Failed to process scripts request', '[api/scripts] error:');
  }
}
