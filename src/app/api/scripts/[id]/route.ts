import type { NextRequest } from 'next/server';
import { forwardToBackend } from '../../_utils/backend-proxy';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return forwardToBackend(request, `/api/scripts/${encodeURIComponent(params.id)}`);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return forwardToBackend(request, `/api/scripts/${encodeURIComponent(params.id)}`);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return forwardToBackend(request, `/api/scripts/${encodeURIComponent(params.id)}`);
}
