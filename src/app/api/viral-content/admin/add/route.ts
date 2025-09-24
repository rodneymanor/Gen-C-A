import { NextRequest, NextResponse } from "next/server";

import { ViralContentSyncService } from "@/services/viral-content/sync-service";
import type { ViralPlatform } from "@/services/viral-content/types";

function authorize(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return true;

  const provided = request.headers.get("x-internal-secret") ?? request.headers.get("authorization");
  if (!provided) return false;

  const normalized = provided.replace(/^Bearer\s+/i, "");
  return normalized === secret;
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normalizePlatform(value: unknown): ViralPlatform | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === "youtube" || normalized === "instagram" || normalized === "tiktok") {
    return normalized;
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const platform = normalizePlatform(body.platform);
    const creatorSlug = typeof body.creatorSlug === "string" && body.creatorSlug.trim().length > 0
      ? body.creatorSlug.trim()
      : null;
    const creatorName = typeof body.creatorName === "string" && body.creatorName.trim().length > 0
      ? body.creatorName.trim()
      : creatorSlug;
    const platformVideoId = typeof body.platformVideoId === "string" && body.platformVideoId.trim().length > 0
      ? body.platformVideoId.trim()
      : null;
    const url = typeof body.url === "string" && body.url.trim().length > 0 ? body.url.trim() : null;
    const title = typeof body.title === "string" && body.title.trim().length > 0 ? body.title.trim() : null;
    const thumbnailUrl = typeof body.thumbnailUrl === "string" && body.thumbnailUrl.trim().length > 0
      ? body.thumbnailUrl.trim()
      : null;

    if (!platform || !creatorSlug || !creatorName || !platformVideoId || !url || !title || !thumbnailUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "platform, creatorSlug, creatorName, platformVideoId, url, title, and thumbnailUrl are required",
        },
        { status: 400 },
      );
    }

    const description = typeof body.description === "string" ? body.description : undefined;
    const publishedAt = typeof body.publishedAt === "string" ? body.publishedAt : undefined;
    const creatorPlatformId = typeof body.creatorPlatformId === "string" ? body.creatorPlatformId : undefined;

    const syncService = new ViralContentSyncService();
    const result = await syncService.addManualVideo({
      platform,
      creatorSlug,
      creatorName,
      platformVideoId,
      url,
      title,
      description,
      thumbnailUrl,
      publishedAt,
      metrics: {
        views: parseNumber(body.views),
        likes: parseNumber(body.likes),
        comments: parseNumber(body.comments),
        shares: parseNumber(body.shares),
        followers: parseNumber(body.followers),
      },
      raw: typeof body.raw === "object" && body.raw !== null ? (body.raw as Record<string, unknown>) : undefined,
      creatorPlatformId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add viral video";
    console.error("[viral-content][admin-add] unexpected error", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

