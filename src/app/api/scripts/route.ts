import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../_utils/backend-proxy';

export async function GET(request: NextRequest) {
  return forwardToBackend(request, '/api/scripts');
}

export async function POST(request: NextRequest) {
  return forwardToBackend(request, '/api/scripts');
}
