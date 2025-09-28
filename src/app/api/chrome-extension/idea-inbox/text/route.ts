import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../../../_utils/backend-proxy';

const TARGET_PATH = '/api/chrome-extension/idea-inbox/text';

export async function POST(request: NextRequest) {
  return forwardToBackend(request, TARGET_PATH);
}
