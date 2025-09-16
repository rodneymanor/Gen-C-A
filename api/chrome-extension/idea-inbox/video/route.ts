import { NextRequest, NextResponse } from "next/server";

import { NoteType } from "@/app/(main)/dashboard/idea-inbox/_components/types";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { notesService } from "@/lib/services/notes-service";
import { UnifiedVideoScraper, scrapeVideoUrl } from "@/lib/unified-video-scraper";

interface VideoIdeaBody {
  url: string;
  title?: string;
  noteType?: NoteType;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult.user.uid;

    const { url, title, noteType }: VideoIdeaBody = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "url is required" }, { status: 400 });
    }

    const decodedUrl = decodeURIComponent(url);
    const validation = UnifiedVideoScraper.validateUrlWithMessage(decodedUrl);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    // Only TikTok/Instagram for now (per product scope)
    if (!["tiktok", "instagram", "tiktok_cdn", "instagram_cdn"].includes(validation.platform)) {
      return NextResponse.json(
        { success: false, error: "Only TikTok and Instagram URLs are supported" },
        { status: 400 },
      );
    }

    // Scrape metadata (no upload/processing here)
    const videoData = await scrapeVideoUrl(decodedUrl).catch(() => null);

    // Determine note type based on platform
    let derivedNoteType = noteType;
    if (!derivedNoteType) {
      if (validation.platform.includes("tiktok")) {
        derivedNoteType = NoteType.TIKTOK;
      } else if (validation.platform.includes("instagram")) {
        derivedNoteType = NoteType.INSTAGRAM;
      } else {
        derivedNoteType = NoteType.NOTE;
      }
    }

    const noteId = await notesService.createNote(userId, {
      title: (title ?? `Idea from ${validation.platform}`).trim(),
      content: decodedUrl,
      noteType: derivedNoteType,
      type: "idea_inbox",
      source: "inbox",
      starred: false,
      metadata: {
        videoUrl: decodedUrl,
        thumbnailUrl: (videoData as any)?.thumbnailUrl,
        duration: (videoData as any)?.additionalMetadata?.duration,
        viewCount: (videoData as any)?.metrics?.views,
        publishedAt: (videoData as any)?.metadata?.publishedAt,
      },
    });

    const note = await notesService.getNote(noteId, userId);
    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error("❌ [Chrome Idea Inbox Video] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save video idea" }, { status: 500 });
  }
}
