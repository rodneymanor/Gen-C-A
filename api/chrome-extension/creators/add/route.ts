import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { buildInternalUrl } from "@/lib/utils/url";

interface AddCreatorBody {
  username: string;
  platform?: "instagram" | "tiktok"; // optional, auto-detect supported by downstream
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;

    const { username, platform }: AddCreatorBody = await request.json();
    if (!username) {
      return NextResponse.json({ success: false, error: "username is required" }, { status: 400 });
    }

    // Forward to existing follow orchestrator which performs full flow
    const headers: HeadersInit = { "content-type": "application/json" };
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) headers["x-api-key"] = apiKey;
    if (authHeader) headers["authorization"] = authHeader;

    const res = await fetch(buildInternalUrl("/api/creators/follow"), {
      method: "POST",
      headers,
      body: JSON.stringify({ username, platform }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [Chrome Creator Add] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add creator" }, { status: 500 });
  }
}
