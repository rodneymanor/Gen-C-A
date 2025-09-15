import { NextRequest, NextResponse } from "next/server";

import { withGlobalInstagramRateLimit, retryWithGlobalBackoff } from "@/lib/global-rate-limiter";

interface InstagramUserIdResponse {
  UserID: number;
  UserName: string;
}

interface ApiResponse {
  success: boolean;
  user_id: number;
  username: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * GET /api/instagram/user-id
 *
 * Fetches Instagram user ID by username using RapidAPI Instagram scraper.
 *
 * @param username - Instagram username (without @)
 * @returns User ID and username or error message
 */
export async function GET(request: NextRequest) {
  try {
    console.log("📥 Instagram User ID API - Request received");

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    // Validation
    if (!username) {
      console.log("❌ Username parameter is missing");
      return NextResponse.json({ error: "Username parameter is required" } as ErrorResponse, { status: 400 });
    }

    if (username.length < 1 || username.length > 30) {
      console.log("❌ Invalid username length");
      return NextResponse.json({ error: "Username must be between 1 and 30 characters" } as ErrorResponse, {
        status: 400,
      });
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace("@", "");

    console.log(`🔍 Fetching user ID for username: ${cleanUsername}`);

    // Check if RapidAPI key is configured
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      console.log("❌ RAPIDAPI_KEY not found in environment variables");
      return NextResponse.json(
        { error: "API configuration error", details: "RAPIDAPI_KEY not configured" } as ErrorResponse,
        { status: 500 },
      );
    }

    // Make request to Instagram API with rate limiting and retry logic
    const response = await retryWithGlobalBackoff(
      () =>
        withGlobalInstagramRateLimit(async () => {
          const res = await fetch(
            `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/user_id_by_username?username=${encodeURIComponent(cleanUsername)}`,
            {
              method: "GET",
              headers: {
                "x-rapidapi-host": "instagram-api-fast-reliable-data-scraper.p.rapidapi.com",
                "x-rapidapi-key": rapidApiKey,
              },
            },
          );
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
          }
          return res;
        }, `instagram-user-id-${cleanUsername}`),
      3,
      1000,
      `instagram-user-id-${cleanUsername}`,
    );

    // If we reached here, response.ok is true due to throw-on-error above

    const data: InstagramUserIdResponse = await response.json();

    console.log("✅ Successfully fetched user ID:", data);

    // Validate response structure
    if (!data.UserID) {
      console.log("❌ Invalid response structure from Instagram API");
      return NextResponse.json({ error: "Invalid response from Instagram API" } as ErrorResponse, { status: 502 });
    }

    const result: ApiResponse = {
      success: true,
      user_id: data.UserID,
      username: data.UserName || cleanUsername,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("❌ Instagram User ID API Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      } as ErrorResponse,
      { status: 500 },
    );
  }
}
