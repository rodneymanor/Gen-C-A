import { NextRequest, NextResponse } from "next/server";

import { getVideoScraperService, VideoScraperServiceError } from "@/services/video/video-scraper-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string; options?: Record<string, unknown> };
    const service = getVideoScraperService();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ success: false, error: "A video URL is required" }, { status: 400 });
    }

    const result = await service.scrapeUrl(url, body?.options);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof VideoScraperServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to scrape video";
    console.error("[video/scrape-url] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
