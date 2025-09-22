import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getScriptsRequestContext, sendScriptsError } from '../_utils/scripts-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = (req.query as any)?.id;
  const scriptId = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!scriptId) {
    return res.status(400).json({ success: false, error: 'Script id is required' });
  }

  const context = await getScriptsRequestContext(req, res);
  if (!context) {
    return;
  }

  const { auth, service } = context;

  try {
    if (req.method === 'GET') {
      const script = await service.getScriptById(auth.uid, String(scriptId));
      return res.status(200).json({ success: true, script });
    }

    if (req.method === 'PUT') {
      const script = await service.updateScript(auth.uid, String(scriptId), (req.body as any) || {});
      return res.status(200).json({ success: true, script });
    }

    if (req.method === 'DELETE') {
      await service.deleteScript(auth.uid, String(scriptId));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return sendScriptsError(res, error, 'Failed to process script request', '[api/scripts/[id]] error:');
  }
}
