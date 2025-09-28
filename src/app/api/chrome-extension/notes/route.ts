import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../../_utils/backend-proxy';

const TARGET_PATH = '/api/chrome-extension/notes';

export async function GET(request: NextRequest) {
  return forwardToBackend(request, TARGET_PATH);
}

export async function POST(request: NextRequest) {
  return forwardToBackend(request, TARGET_PATH);
}

export async function PUT(request: NextRequest) {
  return forwardToBackend(request, TARGET_PATH);
}

export async function DELETE(request: NextRequest) {
  return forwardToBackend(request, TARGET_PATH);
}
