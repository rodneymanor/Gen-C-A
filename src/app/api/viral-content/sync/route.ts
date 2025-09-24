import { NextRequest, NextResponse } from 'next/server';
import { runViralContentSync } from '@/services/viral-content/sync-service';

function authorize(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow if not configured

  const headerSecret = request.headers.get('x-cron-secret') ?? request.headers.get('authorization');
  if (!headerSecret) return false;
  return headerSecret.replace(/^Bearer\s+/i, '') === secret;
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await runViralContentSync();
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run viral content sync';
    console.error('[viral-content][sync] unexpected error', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

