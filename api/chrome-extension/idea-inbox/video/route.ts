import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
// Resolve same-origin internal URL at runtime

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

    const origin = request.nextUrl?.origin || `https://${request.headers.get('host')}`;
    const target = new URL("/api/chrome-extension/idea-inbox/video", origin);
    console.log("[Chrome Idea Video] forwarding ->", target.toString());
    const response = await fetch(target, {
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
