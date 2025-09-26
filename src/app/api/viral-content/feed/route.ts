import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../../_utils/backend-proxy';

// TEMP SHIM: Delegate to canonical backend implementation.
export async function GET(request: NextRequest) {
  return forwardToBackend(request, '/api/viral-content/feed');
}
