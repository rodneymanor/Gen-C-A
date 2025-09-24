import { NextResponse } from 'next/server';

import { TRACKED_CREATORS } from '@/services/viral-content/config';

export async function GET() {
  const creators = TRACKED_CREATORS.map((creator) => ({
    platform: creator.platform,
    slug: creator.slug,
    displayName: creator.displayName,
    platformId: creator.platformId,
    secondaryId: creator.secondaryId,
  }));

  return NextResponse.json({ success: true, creators });
}
