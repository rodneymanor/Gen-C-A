import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
// Resolve same-origin URL at runtime; avoid backend fallbacks

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
    const target = new URL("/api/chrome-extension/youtube-transcript", origin);
    console.log("[Chrome YT Transcript][POST] forwarding ->", target.toString());
    const response = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ [Chrome YouTube Transcript] proxy error:", error);
    return NextResponse.json({ success: false, error: "Failed to extract transcript" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;

    const origin = request.nextUrl?.origin || `https://${request.headers.get('host')}`;
    const forwardedUrl = new URL("/api/chrome-extension/youtube-transcript", origin);
    console.log("[Chrome YT Transcript][GET] forwarding ->", forwardedUrl.toString());
    const original = new URL(request.url);
    original.searchParams.forEach((value, key) => {
      forwardedUrl.searchParams.set(key, value);
    });

    const headers: HeadersInit = {};
    const apiKey = request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    if (apiKey) headers["x-api-key"] = apiKey;
    if (authHeader) headers["authorization"] = authHeader;

    const response = await fetch(forwardedUrl.toString(), {
      method: "GET",
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ [Chrome YouTube Transcript GET] proxy error:", error);
    return NextResponse.json({ success: false, error: "Failed to extract transcript" }, { status: 500 });
  }
}
