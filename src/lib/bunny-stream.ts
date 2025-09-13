/* eslint-disable max-lines */
async function createBunnyStreamVideo(
  libraryId: string,
  apiKey: string,
  filename: string,
  timeout: number,
): Promise<string | null> {
  const createVideoUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;

  console.log("🌐 [BUNNY] Making request to:", createVideoUrl);
  console.log("🔑 [BUNNY] Using API key (first 10 chars):", apiKey.substring(0, 10) + "...");

  const createResponse = await Promise.race([
    fetch(createVideoUrl, {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        title: filename.replace(/\.[^/.]+$/, ""), // Remove file extension for title
      }),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout),
    ),
  ]);

  console.log("📥 [BUNNY] Create response status:", createResponse.status);

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error("❌ [BUNNY] Failed to create video object:", createResponse.status, errorText);
    return null;
  }

  const videoObject = await createResponse.json();
  const videoGuid = videoObject.guid;
  console.log("✅ [BUNNY] Video object created with GUID:", videoGuid);
  return videoGuid;
}

async function uploadBunnyStreamVideo(
  libraryId: string,
  apiKey: string,
  videoGuid: string,
  arrayBuffer: ArrayBuffer,
  timeout: number,
): Promise<boolean> {
  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`;

  console.log("🌐 [BUNNY] Upload URL:", uploadUrl);
  console.log("📊 [BUNNY] ArrayBuffer size:", arrayBuffer.byteLength, "bytes");

  const uploadResponse = await Promise.race([
    fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
      },
      body: arrayBuffer,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Upload timeout after ${timeout}ms`)), timeout),
    ),
  ]);

  console.log("📥 [BUNNY] Upload response status:", uploadResponse.status);

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("❌ [BUNNY] Upload failed:", uploadResponse.status, errorText);
    return false;
  }

  console.log("✅ [BUNNY] Video file uploaded successfully");
  return true;
}

async function attemptUpload(
  libraryId: string,
  apiKey: string,
  arrayBuffer: ArrayBuffer,
  filename: string,
  attempt: number,
  maxRetries: number,
): Promise<{ cdnUrl: string; filename: string } | null> {
  console.log(`🔄 [BUNNY] Attempt ${attempt}/${maxRetries}`);

  const timeout = 120000 + 60000 * (attempt - 1); // 120s, 180s, 240s
  console.log(`⏱️ [BUNNY] Using timeout: ${timeout}ms`);

  // Step 1: Create video object
  console.log("📝 [BUNNY] Creating video object...");
  const videoGuid = await createBunnyStreamVideo(libraryId, apiKey, filename, timeout);

  if (!videoGuid) {
    return null;
  }

  // Step 2: Upload video file
  console.log("📤 [BUNNY] Uploading video file...");
  const uploadSuccess = await uploadBunnyStreamVideo(libraryId, apiKey, videoGuid, arrayBuffer, timeout);

  if (!uploadSuccess) {
    return null;
  }

  // Step 3: Construct URLs for Bunny Stream
  const iframeUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;
  const hostname = process.env.BUNNY_CDN_HOSTNAME ?? "";
  const cleanHostname = hostname.startsWith("vz-") ? hostname : `vz-${hostname}`;
  const directUrl = `https://${cleanHostname}/${videoGuid}/play_720p.mp4`;

  console.log("🎯 [BUNNY] Iframe embed URL constructed:", iframeUrl);
  console.log("🎯 [BUNNY] Direct MP4 URL constructed:", directUrl);

  return {
    cdnUrl: iframeUrl,
    directUrl: directUrl,
    filename: videoGuid,
  };
}

function validateBunnyConfig(): { isValid: boolean; config?: { libraryId: string; apiKey: string; hostname: string } } {
  const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
  const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
  const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

  console.log("🔧 [BUNNY] Stream configuration check:");
  console.log("  - Library ID:", BUNNY_STREAM_LIBRARY_ID);
  console.log("  - API Key present:", !!BUNNY_STREAM_API_KEY);
  console.log("  - CDN Hostname:", BUNNY_CDN_HOSTNAME);

  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY || !BUNNY_CDN_HOSTNAME) {
    console.error("❌ [BUNNY] Missing Bunny Stream configuration");
    return { isValid: false };
  }

  return {
    isValid: true,
    config: {
      libraryId: BUNNY_STREAM_LIBRARY_ID,
      apiKey: BUNNY_STREAM_API_KEY,
      hostname: BUNNY_CDN_HOSTNAME,
    },
  };
}

async function performRetryLoop(
  config: { libraryId: string; apiKey: string; hostname: string },
  arrayBuffer: ArrayBuffer,
  filename: string,
): Promise<{ cdnUrl: string; filename: string } | null> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptUpload(config.libraryId, config.apiKey, arrayBuffer, filename, attempt, MAX_RETRIES);

      if (result) {
        return result;
      }

      if (attempt < MAX_RETRIES) {
        const backoffDelay = Math.min(30000, 2000 * Math.pow(2, attempt - 1)); // Exponential backoff, max 30s
        console.log(`⏳ [BUNNY] Waiting ${backoffDelay}ms before retry (exponential backoff)...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    } catch (error) {
      console.error(`❌ [BUNNY] Attempt ${attempt} failed:`, error);

      if (attempt === MAX_RETRIES) {
        console.error("❌ [BUNNY] All retry attempts exhausted");
        return null;
      }

      const backoffDelay = Math.min(60000, 3000 * Math.pow(2, attempt - 1)); // Exponential backoff, max 60s
      console.log(`⏳ [BUNNY] Waiting ${backoffDelay}ms before retry (exponential backoff)...`);
      console.log(`🔍 [BUNNY] Error details for monitoring:`, {
        attempt,
        maxRetries: MAX_RETRIES,
        errorType: error.constructor.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
        bufferSize: arrayBuffer.byteLength,
        filename,
      });
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  return null;
}

export async function uploadToBunnyStream(
  buffer: Buffer,
  filename: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mimeType: string,
): Promise<{ cdnUrl: string; filename: string } | null> {
  try {
    console.log("🚀 [BUNNY] Starting upload to Bunny Stream...");

    // Test configuration for debugging
    testBunnyStreamConfig();

    // Convert Buffer to ArrayBuffer as required by the guide
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    console.log("🔄 [BUNNY] Converted Buffer to ArrayBuffer:", arrayBuffer.byteLength, "bytes");

    // Validate configuration
    const configResult = validateBunnyConfig();
    if (!configResult.isValid || !configResult.config) {
      return null;
    }

    // Perform retry loop
    return await performRetryLoop(configResult.config, arrayBuffer, filename);
  } catch (error) {
    console.error("❌ [BUNNY] Stream upload error:", error);
    return null;
  }
}

export function isBunnyStreamConfigured(): boolean {
  return (
    !!process.env.BUNNY_STREAM_LIBRARY_ID && !!process.env.BUNNY_STREAM_API_KEY && !!process.env.BUNNY_CDN_HOSTNAME
  );
}

// Test function to verify Bunny Stream configuration
export function testBunnyStreamConfig(): void {
  console.log("🔍 [BUNNY] Testing Bunny Stream Configuration:");
  console.log("  - BUNNY_STREAM_LIBRARY_ID:", process.env.BUNNY_STREAM_LIBRARY_ID);
  console.log("  - BUNNY_STREAM_API_KEY (length):", process.env.BUNNY_STREAM_API_KEY?.length);
  console.log("  - BUNNY_CDN_HOSTNAME:", process.env.BUNNY_CDN_HOSTNAME);

  if (process.env.BUNNY_STREAM_LIBRARY_ID && process.env.BUNNY_STREAM_API_KEY && process.env.BUNNY_CDN_HOSTNAME) {
    console.log("✅ [BUNNY] All environment variables are present");

    // Test URL construction
    const testVideoId = "test-video-id";
    const createUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos`;
    const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos/${testVideoId}`;
    const iframeUrl = `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_STREAM_LIBRARY_ID}/${testVideoId}`;

    console.log("🔗 [BUNNY] Test URLs:");
    console.log("  - Create URL:", createUrl);
    console.log("  - Upload URL:", uploadUrl);
    console.log("  - Iframe Embed URL:", iframeUrl);
  } else {
    console.error("❌ [BUNNY] Missing environment variables");
  }
}

export async function streamToBunnyFromUrl(
  videoUrl: string,
  filename: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mimeType: string = "video/mp4",
): Promise<{ iframeUrl: string; directUrl: string } | null> {
  try {
    console.log("🌊 [BUNNY_STREAM] Starting direct stream from URL to Bunny CDN...");
    console.log("🔗 [BUNNY_STREAM] Source URL:", videoUrl.substring(0, 100) + "...");

    // Create video object in Bunny Stream first
    const videoGuid = await createBunnyVideoObject(filename);
    if (!videoGuid) {
      console.error("❌ [BUNNY_STREAM] Failed to create video object");
      return null;
    }

    console.log("📝 [BUNNY_STREAM] Created video object with GUID:", videoGuid);
    console.log("🔍 [BUNNY_STREAM] GUID details:", {
      guid: videoGuid,
      guidLength: videoGuid.length,
      expectedLength: 36, // Standard UUID length
      isComplete: videoGuid.length === 36,
    });

    // Stream video directly from source to Bunny CDN
    const success = await streamVideoToBunny(videoUrl, videoGuid);
    if (!success) {
      console.error("❌ [BUNNY_STREAM] Failed to stream video");
      return null;
    }

    const iframeUrl = `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_STREAM_LIBRARY_ID}/${videoGuid}`;
    const hostname = process.env.BUNNY_CDN_HOSTNAME ?? "";
    const cleanHostname = hostname.startsWith("vz-") ? hostname : `vz-${hostname}`;
    const directUrl = `https://${cleanHostname}/${videoGuid}/play_720p.mp4`;

    console.log("✅ [BUNNY_STREAM] Direct stream completed successfully");
    console.log("🎯 [BUNNY_STREAM] Complete Iframe URL:", iframeUrl);
    console.log("🎯 [BUNNY_STREAM] Direct MP4 URL:", directUrl);
    console.log("🔍 [BUNNY_STREAM] URL validation:", {
      iframeUrl: iframeUrl,
      directUrl: directUrl,
      urlLength: iframeUrl.length,
      libraryId: process.env.BUNNY_STREAM_LIBRARY_ID,
      guid: videoGuid,
      expectedFormat: `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_STREAM_LIBRARY_ID}/${videoGuid}`,
    });

    return { iframeUrl, directUrl };
  } catch (error) {
    console.error("❌ [BUNNY_STREAM] Direct stream error:", error);
    return null;
  }
}

async function createBunnyVideoObject(filename: string): Promise<string | null> {
  try {
    console.log("📝 [BUNNY_STREAM] Creating video object for filename:", filename);
    console.log("🔍 [BUNNY_STREAM] Using library ID:", process.env.BUNNY_STREAM_LIBRARY_ID);

    const response = await fetch(`https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessKey: process.env.BUNNY_STREAM_API_KEY ?? "",
      },
      body: JSON.stringify({
        title: filename.replace(/\.[^/.]+$/, ""), // Remove extension
      }),
    });

    if (!response.ok) {
      console.error("❌ [BUNNY_STREAM] Failed to create video object:", response.status);
      const errorText = await response.text();
      console.error("❌ [BUNNY_STREAM] Error response:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("✅ [BUNNY_STREAM] Video object created successfully");
    console.log("🔍 [BUNNY_STREAM] Response data:", data);
    console.log("🔍 [BUNNY_STREAM] Generated GUID:", data.guid);

    return data.guid;
  } catch (error) {
    console.error("❌ [BUNNY_STREAM] Create video object error:", error);
    return null;
  }
}

async function fetchSourceVideo(sourceUrl: string): Promise<Response | null> {
  console.log(`🔍 [BUNNY_STREAM] Fetching source video from: ${sourceUrl.substring(0, 100)}...`);

  // Use comprehensive headers to bypass Instagram's hotlinking protection
  const sourceResponse = await fetch(sourceUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.instagram.com/",
      Accept: "video/mp4,video/*,*/*;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "video",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
    },
  });

  if (!sourceResponse.ok) {
    console.error("❌ [BUNNY_STREAM] Failed to fetch source video:", sourceResponse.status, sourceResponse.statusText);

    // Log response headers for debugging
    const responseHeaders = Object.fromEntries(sourceResponse.headers.entries());
    console.error("❌ [BUNNY_STREAM] Response headers:", responseHeaders);

    // Try to get error text
    try {
      const errorText = await sourceResponse.text();
      console.error("❌ [BUNNY_STREAM] Error response body:", errorText.substring(0, 500));
    } catch {
      console.error("❌ [BUNNY_STREAM] Could not read error response body");
    }

    return null;
  }

  if (!sourceResponse.body) {
    console.error("❌ [BUNNY_STREAM] No response body from source");
    return null;
  }

  // Validate content type to ensure we're getting video data
  const contentType = sourceResponse.headers.get("content-type");
  console.log(`🔍 [BUNNY_STREAM] Content-Type: ${contentType}`);

  if (contentType && !contentType.startsWith("video/")) {
    console.error(`❌ [BUNNY_STREAM] Invalid content type: ${contentType} (expected video/*)`);
    console.error(
      `❌ [BUNNY_STREAM] URL may be pointing to thumbnail instead of video: ${sourceUrl.substring(0, 100)}...`,
    );
    return null;
  }

  return sourceResponse;
}

function checkVideoSize(response: Response): boolean {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    console.log(`📏 [BUNNY_STREAM] Video size: ${sizeInMB.toFixed(2)} MB`);

    if (sizeInMB > 50) {
      console.warn(`⚠️ [BUNNY_STREAM] Video too large (${sizeInMB.toFixed(2)} MB), skipping upload`);
      return false;
    }
  }
  return true;
}

async function uploadToBunnyFromBuffer(videoGuid: string, videoBuffer: ArrayBuffer): Promise<boolean> {
  console.log(
    `📤 [BUNNY_STREAM] Uploading ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)}MB buffer to Bunny.net...`,
  );

  const uploadResponse = await fetch(
    `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}`,
    {
      method: "PUT",
      headers: {
        AccessKey: process.env.BUNNY_STREAM_API_KEY ?? "",
        "Content-Type": "video/mp4",
      },
      body: videoBuffer,
      signal: AbortSignal.timeout(300000), // 5 minute timeout for buffer upload
    },
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error(`❌ [BUNNY_STREAM] Buffer upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    console.error(`❌ [BUNNY_STREAM] Error details: ${errorText}`);
    return false;
  }

  console.log(`✅ [BUNNY_STREAM] Buffer upload completed successfully`);
  return true;
}

async function streamVideoToBunny(sourceUrl: string, videoGuid: string, maxRetries: number = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 [BUNNY_STREAM] Download-then-upload approach (attempt ${attempt}/${maxRetries})`);

      // Step 1: Download the entire video to memory first
      console.log(`📥 [BUNNY_STREAM] Step 1: Downloading video from Instagram CDN...`);
      const sourceResponse = await fetchSourceVideo(sourceUrl);
      if (!sourceResponse) {
        console.error(`❌ [BUNNY_STREAM] Failed to fetch source video (attempt ${attempt})`);
        continue;
      }

      if (!checkVideoSize(sourceResponse)) {
        console.error(`❌ [BUNNY_STREAM] Video too large, skipping`);
        return false;
      }

      // Convert response to ArrayBuffer (download completely)
      const videoBuffer = await sourceResponse.arrayBuffer();
      const videoSizeMB = (videoBuffer.byteLength / 1024 / 1024).toFixed(2);
      console.log(`✅ [BUNNY_STREAM] Downloaded ${videoSizeMB}MB from Instagram CDN`);

      // Step 2: Upload the buffer to Bunny.net
      console.log(`📤 [BUNNY_STREAM] Step 2: Uploading ${videoSizeMB}MB to Bunny.net...`);
      const uploadSuccess = await uploadToBunnyFromBuffer(videoGuid, videoBuffer);

      if (!uploadSuccess) {
        console.error(`❌ [BUNNY_STREAM] Upload failed (attempt ${attempt})`);
        if (attempt < maxRetries) {
          const retryDelay = Math.min(10000, 2000 * Math.pow(2, attempt - 1)); // Exponential backoff, max 10s
          console.log(`🔄 [BUNNY_STREAM] Retrying in ${retryDelay}ms (exponential backoff)...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
        return false;
      }

      console.log(`✅ [BUNNY_STREAM] Successfully uploaded ${videoSizeMB}MB to Bunny.net`);
      return true;
    } catch (error) {
      console.error(`❌ [BUNNY_STREAM] Download-upload error (attempt ${attempt}):`, error);
      if (attempt < maxRetries) {
        const retryDelay = Math.min(15000, 3000 * Math.pow(2, attempt - 1)); // Exponential backoff, max 15s
        console.log(`🔄 [BUNNY_STREAM] Retrying in ${retryDelay}ms (exponential backoff)...`);
        console.log(`🔍 [BUNNY_STREAM] Error monitoring details:`, {
          attempt,
          maxRetries,
          errorType: error.constructor.name,
          errorMessage: error.message,
          sourceUrl: sourceUrl.substring(0, 100) + "...",
          videoGuid,
          timestamp: new Date().toISOString(),
        });
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }
      return false;
    }
  }

  console.error("❌ [BUNNY_STREAM] All download-upload attempts failed");
  return false;
}

/**
 * Generate a Bunny CDN thumbnail URL for a video
 * Format: https://vz-{hostname}.b-cdn.net/{videoId}/thumbnail.jpg
 */
export function generateBunnyThumbnailUrl(videoId: string): string | null {
  const hostname = process.env.BUNNY_CDN_HOSTNAME;

  if (!hostname) {
    console.error("❌ [BUNNY] BUNNY_CDN_HOSTNAME not configured");
    return null;
  }

  const cleanedHost = hostname.startsWith("vz-") ? hostname : `vz-${hostname}`;
  const thumbnailUrl = `https://${cleanedHost}/${videoId}/thumbnail.jpg`;
  console.log("🖼️ [BUNNY] Generated thumbnail URL:", thumbnailUrl);

  return thumbnailUrl;
}

/**
 * Generate a Bunny CDN animated preview URL for a video
 * Format: https://vz-{hostname}.b-cdn.net/{videoId}/preview.webp
 */
export function generateBunnyPreviewUrl(videoId: string): string | null {
  const hostname = process.env.BUNNY_CDN_HOSTNAME;

  if (!hostname) {
    console.error("❌ [BUNNY] BUNNY_CDN_HOSTNAME not configured");
    return null;
  }

  const cleanedHost = hostname.startsWith("vz-") ? hostname : `vz-${hostname}`;
  const previewUrl = `https://${cleanedHost}/${videoId}/preview.webp`;
  console.log("🎞️ [BUNNY] Generated animated preview URL:", previewUrl);

  return previewUrl;
}

/**
 * Extract video ID from Bunny iframe URL
 * Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 */
export function extractVideoIdFromIframeUrl(iframeUrl: string): string | null {
  try {
    const url = new URL(iframeUrl);
    const pathParts = url.pathname.split("/");
    const videoId = pathParts[pathParts.length - 1];

    if (videoId && videoId.length > 0) {
      console.log("🆔 [BUNNY] Extracted video ID from iframe:", videoId);
      return videoId;
    }

    console.error("❌ [BUNNY] Could not extract video ID from iframe URL");
    return null;
  } catch (error) {
    console.error("❌ [BUNNY] Error parsing iframe URL:", error);
    return null;
  }
}

/**
 * Upload a custom thumbnail to Bunny CDN for a video
 * @param videoGuid - The video GUID in Bunny Stream
 * @param thumbnailUrl - URL of the thumbnail to upload
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function uploadBunnyThumbnailWithRetry(
  videoGuid: string,
  thumbnailUrl: string,
  maxRetries: number = 3,
): Promise<boolean> {
  console.log(`🖼️ [BUNNY_THUMBNAIL] Starting thumbnail upload for video: ${videoGuid}`);
  console.log(`🔗 [BUNNY_THUMBNAIL] Source thumbnail URL: ${thumbnailUrl}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [BUNNY_THUMBNAIL] Attempt ${attempt}/${maxRetries}`);

      // Step 1: Download the thumbnail from the source URL
      console.log("📥 [BUNNY_THUMBNAIL] Downloading thumbnail from source...");
      const thumbnailResponse = await fetch(thumbnailUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!thumbnailResponse.ok) {
        console.error(`❌ [BUNNY_THUMBNAIL] Failed to download thumbnail: ${thumbnailResponse.status}`);
        if (attempt === maxRetries) return false;
        continue;
      }

      const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
      console.log(`📦 [BUNNY_THUMBNAIL] Downloaded thumbnail: ${thumbnailBuffer.byteLength} bytes`);

      // Step 2: Upload thumbnail to Bunny CDN
      console.log("📤 [BUNNY_THUMBNAIL] Uploading to Bunny CDN...");
      const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos/${videoGuid}/thumbnail`;

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          AccessKey: process.env.BUNNY_STREAM_API_KEY ?? "",
          "Content-Type": "image/jpeg",
        },
        body: thumbnailBuffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ [BUNNY_THUMBNAIL] Upload failed (${uploadResponse.status}): ${errorText}`);

        if (attempt === maxRetries) return false;

        // Wait before retrying (exponential backoff)
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ [BUNNY_THUMBNAIL] Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      console.log("✅ [BUNNY_THUMBNAIL] Thumbnail uploaded successfully!");
      return true;
    } catch (error) {
      console.error(`❌ [BUNNY_THUMBNAIL] Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        console.error("❌ [BUNNY_THUMBNAIL] All retry attempts exhausted");
        return false;
      }

      // Wait before retrying
      const waitTime = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏳ [BUNNY_THUMBNAIL] Waiting ${waitTime}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return false;
}
