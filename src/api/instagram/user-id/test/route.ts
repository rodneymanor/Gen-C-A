import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/instagram/user-id/test
 *
 * Test endpoint to verify the Instagram user ID API is working
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Testing Instagram User ID API");

    // Test with a known Instagram username
    const testUsername = "instagram";

    // Get the base URL for internal requests
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";
    const host = request.headers.get("host") ?? "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    console.log(`🔗 Making internal request to: ${baseUrl}/api/instagram/user-id?username=${testUsername}`);

    // Make request to our own API
    const response = await fetch(`${baseUrl}/api/instagram/user-id?username=${testUsername}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log(`❌ Test failed: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      return NextResponse.json(
        {
          test: "failed",
          status: response.status,
          error: errorData,
        },
        { status: 500 },
      );
    }

    const data = await response.json();
    console.log("✅ Test successful:", data);

    return NextResponse.json({
      test: "passed",
      message: "Instagram User ID API is working correctly",
      sample_response: data,
      tested_username: testUsername,
    });
  } catch (error) {
    console.error("❌ Test Error:", error);
    return NextResponse.json(
      {
        test: "failed",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
