import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint for Instagram API rate limiting
 * This will make multiple sequential calls to test the rate limiter
 */
export async function GET(request: NextRequest) {
  console.log("🧪 [TEST_RATE_LIMIT] Starting Instagram API rate limit test");

  const { searchParams } = new URL(request.url);
  const testUsername = searchParams.get("username") ?? "aronsogi";

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const results: Array<{ step: string; success: boolean; duration: number; error?: string }> = [];

    // Test 1: Get user ID
    console.log("🔍 [TEST_RATE_LIMIT] Step 1: Testing user ID endpoint");
    const userIdStartTime = Date.now();

    try {
      const userIdResponse = await fetch(`${baseUrl}/api/instagram/user-id?username=${testUsername}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const userIdData = await userIdResponse.json();
      const userIdDuration = Date.now() - userIdStartTime;

      results.push({
        step: "user-id",
        success: userIdResponse.ok && userIdData.success,
        duration: userIdDuration,
        error: !userIdResponse.ok ? userIdData.error : undefined,
      });

      if (userIdResponse.ok && userIdData.success) {
        const userId = userIdData.user_id;
        console.log(`✅ [TEST_RATE_LIMIT] User ID retrieved: ${userId}`);

        // Test 2: Get user reels (should be rate limited)
        console.log("🎬 [TEST_RATE_LIMIT] Step 2: Testing user reels endpoint (should wait for rate limit)");
        const reelsStartTime = Date.now();

        try {
          const reelsResponse = await fetch(
            `${baseUrl}/api/instagram/user-reels?user_id=${userId}&include_feed_video=true`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );

          const reelsData = await reelsResponse.json();
          const reelsDuration = Date.now() - reelsStartTime;

          results.push({
            step: "user-reels",
            success: reelsResponse.ok && reelsData.success,
            duration: reelsDuration,
            error: !reelsResponse.ok ? reelsData.error : undefined,
          });

          console.log(`✅ [TEST_RATE_LIMIT] Reels retrieved: ${reelsData.data?.items?.length ?? 0} items`);
        } catch (error) {
          const reelsDuration = Date.now() - reelsStartTime;
          results.push({
            step: "user-reels",
            success: false,
            duration: reelsDuration,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } catch (error) {
      const userIdDuration = Date.now() - userIdStartTime;
      results.push({
        step: "user-id",
        success: false,
        duration: userIdDuration,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 3: Rapid fire test (should demonstrate rate limiting)
    console.log("⚡ [TEST_RATE_LIMIT] Step 3: Testing rapid fire calls (should be rate limited)");
    const rapidFireStartTime = Date.now();
    const rapidFirePromises = [];

    for (let i = 0; i < 3; i++) {
      rapidFirePromises.push(
        fetch(`${baseUrl}/api/instagram/user-id?username=${testUsername}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).then(async (response) => ({
          call: i + 1,
          success: response.ok,
          status: response.status,
          data: await response.json(),
        })),
      );
    }

    const rapidFireResults = await Promise.allSettled(rapidFirePromises);
    const rapidFireDuration = Date.now() - rapidFireStartTime;

    const rapidFireSummary = rapidFireResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          call: index + 1,
          success: result.value.success,
          status: result.value.status,
          error: !result.value.success ? result.value.data.error : undefined,
        };
      } else {
        return {
          call: index + 1,
          success: false,
          status: 500,
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        };
      }
    });

    console.log("✅ [TEST_RATE_LIMIT] Rate limit test completed");

    return NextResponse.json({
      success: true,
      message: "Rate limit test completed",
      testUsername,
      results: {
        sequential: results,
        rapidFire: {
          duration: rapidFireDuration,
          calls: rapidFireSummary,
          totalCalls: rapidFirePromises.length,
          successfulCalls: rapidFireSummary.filter((call) => call.success).length,
        },
      },
      summary: {
        totalDuration: Date.now() - userIdStartTime,
        allStepsSuccessful: results.every((r) => r.success),
        rateLimitingWorking: rapidFireDuration > 2000, // Should take at least 2 seconds for 3 calls
      },
    });
  } catch (error) {
    console.error("❌ [TEST_RATE_LIMIT] Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
