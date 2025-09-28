import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../../../_utils/backend-proxy';

const TARGET_PATH = '/api/chrome-extension/collections/add-video';

export async function POST(request: NextRequest) {
  return forwardToBackend(request, TARGET_PATH);
}
