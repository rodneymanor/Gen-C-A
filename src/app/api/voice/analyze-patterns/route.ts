import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../../_utils/backend-proxy';

export async function POST(request: NextRequest) {
  return forwardToBackend(request, '/api/voice/analyze-patterns');
}
