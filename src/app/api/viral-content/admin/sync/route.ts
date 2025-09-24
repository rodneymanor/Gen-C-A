import { NextRequest, NextResponse } from "next/server";

import { runViralContentSync } from "@/services/viral-content/sync-service";
import type { ViralPlatform } from "@/services/viral-content/types";

function authorize(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return true;

  const provided = request.headers.get("x-internal-secret") ?? request.headers.get("authorization");
  if (!provided) return false;

  const normalized = provided.replace(/^Bearer\s+/i, "");
  return normalized === secret;
}

function normalizePlatforms(value: unknown): ViralPlatform[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const allowed: ViralPlatform[] = ["youtube", "instagram", "tiktok"];
  const normalized = value
    .map((item) => (typeof item === "string" ? item.toLowerCase().trim() : ""))
    .filter(Boolean) as ViralPlatform[];
  return normalized.filter((platform) => allowed.includes(platform as ViralPlatform));
}

function normalizeSlugs(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item).trim()).filter((slug) => slug.length > 0);
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      slugs?: unknown;
      platforms?: unknown;
      date?: string;
    };

    const slugs = normalizeSlugs(body.slugs);
    const platforms = normalizePlatforms(body.platforms);

    const date = body.date ? new Date(body.date) : undefined;
    if (date && Number.isNaN(date.valueOf())) {
      return NextResponse.json({ success: false, error: "Invalid date value" }, { status: 400 });
    }

    const summary = await runViralContentSync({ date, slugs, platforms });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to trigger sync";
    console.error("[viral-content][admin-sync] unexpected error", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
