import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { buildInternalUrl } from "@/lib/utils/url";

interface AddVideoBody {
  videoUrl: string;
  collectionTitle: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult.user.uid;

    const { videoUrl, collectionTitle, title }: AddVideoBody = await request.json();

    if (!videoUrl || !collectionTitle) {
      return NextResponse.json({ success: false, error: "videoUrl and collectionTitle are required" }, { status: 400 });
    }

    if (!isAdminInitialized) {
      return NextResponse.json({ success: false, error: "Firebase Admin not configured" }, { status: 500 });
    }
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Admin DB not available" }, { status: 500 });
    }

    // Find or create collection by title for this user
    const snapshot = await adminDb
      .collection("collections")
      .where("userId", "==", userId)
      .where("title", "==", collectionTitle.trim())
      .limit(1)
      .get();

    let collectionId: string;
    if (!snapshot.empty) {
      collectionId = snapshot.docs[0].id;
    } else {
      const now = new Date();
      const docRef = await adminDb.collection("collections").add({
        title: collectionTitle.trim(),
        description: "",
        userId,
        videoCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      collectionId = docRef.id;
    }

    // Use the queue-based workflow (same as UI) instead of the old direct add-video-to-collection
    const headers: HeadersInit = { "content-type": "application/json" };
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) headers["x-api-key"] = apiKey;
    if (authHeader) headers["authorization"] = authHeader;

    console.log(`🎬 [Chrome Add Video] Using queue workflow for: ${videoUrl}`);
    console.log(`📁 [Chrome Add Video] Target collection: ${collectionTitle} (${collectionId})`);

    // Step 1: Add video to processing queue
    const queueRes = await fetch(buildInternalUrl("/api/video/add-to-queue"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        videoUrl,
        userId,
        collectionId,
        title: title || "Video from Chrome Extension",
      }),
    });

    if (!queueRes.ok) {
      const queueError = await queueRes.json();
      console.error("❌ [Chrome Add Video] Queue failed:", queueError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to queue video: ${queueError.error || "Unknown error"}`,
        },
        { status: queueRes.status },
      );
    }

    const queueData = await queueRes.json();
    console.log(`✅ [Chrome Add Video] Video queued successfully:`, queueData);

    // Return success response similar to the UI workflow
    return NextResponse.json({
      success: true,
      message: "Video added to processing queue",
      jobId: queueData.jobId,
      collectionTitle,
      collectionId,
      videoUrl,
    });
  } catch (error) {
    console.error("❌ [Chrome Add Video to Collection] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add video to collection" }, { status: 500 });
  }
}
