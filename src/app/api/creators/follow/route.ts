import { NextRequest, NextResponse } from 'next/server';
import { getInstagramUserId } from './instagram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, platform } = body;

    if (!username || !platform) {
      return NextResponse.json(
        { error: 'Username and platform are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 [CREATOR-FOLLOW] Following ${platform} user: ${username}`);

    let userId: string;

    switch (platform.toLowerCase()) {
      case 'instagram':
        userId = await getInstagramUserId(username);
        break;

      default:
        return NextResponse.json(
          { error: `Platform ${platform} is not supported` },
          { status: 400 }
        );
    }

    console.log(`✅ [CREATOR-FOLLOW] Successfully resolved user ID: ${userId}`);

    return NextResponse.json({
      success: true,
      platform,
      username,
      userId,
      message: `Successfully followed ${username} on ${platform}`
    });

  } catch (error: any) {
    console.error('❌ [CREATOR-FOLLOW] Error following creator:', error);

    return NextResponse.json(
      {
        error: 'Failed to follow creator',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}