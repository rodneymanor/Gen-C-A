import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { buildInternalUrl } from "@/lib/utils/url";

const createJobId = () => `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const guessPlatformFromUrl = (url: string): string => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("instagram")) return "instagram";
  } catch {
    // ignore parse errors and fall through to unknown
  }
  return "unknown";
};

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

    console.log("🔐 [Chrome Add Video] Authenticated request", {
      userId,
      collectionTitle,
      hasTitle: Boolean(title),
      urlPreview: videoUrl.slice(0, 60),
    });

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

    const headers: HeadersInit = { "content-type": "application/json", "x-user-id": userId };
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) headers["x-api-key"] = apiKey;
    if (authHeader) headers["authorization"] = authHeader;

    console.log(`🎬 [Chrome Add Video] Forwarding to add-to-collection for: ${videoUrl}`);
    console.log(`📁 [Chrome Add Video] Target collection: ${collectionTitle} (${collectionId})`);
    console.log("🛰️ [Chrome Add Video] Forward payload", {
      userId,
      collectionId,
      platform: guessPlatformFromUrl(videoUrl),
      hasAuthHeader: Boolean(authHeader),
      hasApiKey: Boolean(apiKey),
    });

    const addRes = await fetch(buildInternalUrl("/api/videos/add-to-collection"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        collectionId,
        videoData: {
          originalUrl: videoUrl,
          platform: guessPlatformFromUrl(videoUrl),
          addedAt: new Date().toISOString(),
          processing: {
            components: {
              hook: title || "Auto-generated hook",
              bridge: "",
              nugget: "",
              wta: "",
            },
          },
        },
      }),
    });

    if (!addRes.ok) {
      const addError = await addRes.json().catch(() => ({}));
      console.error("❌ [Chrome Add Video] Add-to-collection failed:", addError);
      return NextResponse.json(
        {
          success: false,
          error: addError?.error || addError?.message || "Failed to add video to collection",
        },
        { status: addRes.status },
      );
    }

    const addData = await addRes.json();
    console.log(`✅ [Chrome Add Video] Video added successfully:`, addData);
    console.log("📦 [Chrome Add Video] Response summary", {
      status: addRes.status,
      videoId: addData?.videoId,
      hasVideo: Boolean(addData?.video),
      message: addData?.message,
    });

    return NextResponse.json(
      {
        success: true,
        message: addData?.message || "Video added successfully to collection",
        jobId: createJobId(),
        collectionTitle,
        collectionId,
        videoUrl,
        videoId: addData?.videoId,
        video: addData?.video,
      },
      { status: addRes.status },
    );
  } catch (error) {
    console.error("❌ [Chrome Add Video to Collection] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add video to collection" }, { status: 500 });
  }
}
