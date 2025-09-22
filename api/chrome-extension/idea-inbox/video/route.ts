import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { buildInternalUrl } from "@/lib/utils/url";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json().catch(() => ({}));
    const headers: HeadersInit = { "content-type": "application/json" };
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) headers["x-api-key"] = apiKey;
    if (authHeader) headers["authorization"] = authHeader;

    const response = await fetch(buildInternalUrl("/api/chrome-extension/idea-inbox/video"), {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ [Chrome Idea Inbox Video] proxy error:", error);
    return NextResponse.json({ success: false, error: "Failed to save video idea" }, { status: 500 });
  }
}
