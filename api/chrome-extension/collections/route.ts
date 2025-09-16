import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { buildInternalUrl } from "@/lib/utils/url";

/**
 * GET /api/chrome-extension/collections
 * Proxies to core collections GET, supporting API key or Firebase token.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate first (dual auth: API key, then Firebase token)
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;

    // For test/dev mode with test API key, return mock data
    if (process.env.NODE_ENV === "development" && request.headers.get("x-api-key") === "test-internal-secret-123") {
      console.log("🔓 [Chrome Collections] Using test mode - returning mock collections");

      // Check if we have real test collections from previous adds
      const { getAdminDb, isAdminInitialized } = await import("@/lib/firebase-admin");

      if (isAdminInitialized) {
        const adminDb = getAdminDb();
        if (adminDb) {
          try {
            const collectionsSnapshot = await adminDb
              .collection("collections")
              .where("userId", "==", "test-user")
              .limit(10)
              .get();

            const collections = collectionsSnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
              updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
            }));

            return NextResponse.json({
              success: true,
              user: {
                id: "test-user",
                email: "test@example.com",
                displayName: "Test User",
                role: "user",
              },
              collections,
              total: collections.length,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Error fetching test collections:", err);
          }
        }
      }

      // Fallback to mock data if no real collections
      return NextResponse.json({
        success: true,
        user: {
          id: "test-user",
          email: "test@example.com",
          displayName: "Test User",
          role: "user",
        },
        collections: [
          {
            id: "Q3J2kI0t8OmlqCbGh594",
            title: "Test Collection",
            description: "",
            videoCount: 2,
            userId: "test-user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "mock-collection-2",
            title: "Chrome Extension Test",
            description: "",
            videoCount: 2,
            userId: "test-user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        timestamp: new Date().toISOString(),
      });
    }

    // Forward original auth headers to internal service
    const forwardedHeaders: HeadersInit = {};
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) forwardedHeaders["x-api-key"] = apiKey;
    if (authHeader) forwardedHeaders["authorization"] = authHeader;

    const res = await fetch(buildInternalUrl("/api/collections"), {
      method: "GET",
      headers: forwardedHeaders,
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [Chrome Collections] GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch collections" }, { status: 500 });
  }
}

/**
 * POST /api/chrome-extension/collections
 * Proxies to core collections POST, body: { title, description? }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate first (dual auth: API key, then Firebase token)
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));

    // For test/dev mode with test API key, create collection directly
    if (process.env.NODE_ENV === "development" && request.headers.get("x-api-key") === "test-internal-secret-123") {
      console.log("🔓 [Chrome Collections] Using test mode - creating collection directly");

      const { getAdminDb, isAdminInitialized } = await import("@/lib/firebase-admin");

      if (!isAdminInitialized) {
        return NextResponse.json({ success: false, error: "Firebase Admin not configured" }, { status: 500 });
      }

      const adminDb = getAdminDb();
      if (!adminDb) {
        return NextResponse.json({ success: false, error: "Admin DB not available" }, { status: 500 });
      }

      const { title, description = "" } = body;

      if (!title) {
        return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
      }

      const now = new Date();
      const collectionData = {
        title: title.trim(),
        description: description.trim(),
        userId: "test-user",
        videoCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await adminDb.collection("collections").add(collectionData);

      return NextResponse.json(
        {
          success: true,
          message: "Collection created successfully",
          collection: {
            id: docRef.id,
            ...collectionData,
            createdAt: collectionData.createdAt.toISOString(),
            updatedAt: collectionData.updatedAt.toISOString(),
          },
        },
        { status: 201 },
      );
    }

    const forwardedHeaders: HeadersInit = { "content-type": "application/json" };
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) forwardedHeaders["x-api-key"] = apiKey;
    if (authHeader) forwardedHeaders["authorization"] = authHeader;

    const res = await fetch(buildInternalUrl("/api/collections"), {
      method: "POST",
      headers: forwardedHeaders,
      body: JSON.stringify(body ?? {}),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [Chrome Collections] POST failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create collection" }, { status: 500 });
  }
}
