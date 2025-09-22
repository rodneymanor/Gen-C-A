import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  parseTranscriptionRequest,
  resolveVideoTranscriptionService,
  sendTranscriptionError,
} from '../_utils/video-transcription-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const service = resolveVideoTranscriptionService();
    const result = await service.transcribeFromUrl(parseTranscriptionRequest(req));
    return res.status(200).json(result);
  } catch (error) {
    return sendTranscriptionError(
      res,
      error,
      'Failed to transcribe video from URL',
      '[api/video/transcribe-from-url] error:',
    );
  }
}
