import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveVoiceService, parseVoiceRequest, sendVoiceError } from '../_utils/voice-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const service = resolveVoiceService();
    const options = parseVoiceRequest(req);
    const { creator = {}, ...rest } = options;
    const result = await service.generate(rest);
    return res.status(200).json({ success: true, creator, ...result });
  } catch (error) {
    return sendVoiceError(res, error, 'Failed to analyze voice patterns', '[api/voice/analyze-patterns] error:');
  }
}
