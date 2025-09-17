/**
 * Video Transcription API Routes - Converted from Next.js to Express format
 */

import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// Helper function to add timeout to any async operation
async function withTimeout(promise, timeoutMs, operation) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation '${operation}' timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Download video from CDN URL with retries and HEAD→GET fallback
async function downloadVideo(url, options = {}) {
  console.log("⬇️ Downloading video from CDN:", url);
  const parsed = new URL(url);
  const isTikTok = parsed.hostname.includes("tiktok");

  const baseHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
    Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "keep-alive",
  };
  if (isTikTok) {
    baseHeaders["Referer"] = "https://www.tiktok.com/";
    baseHeaders["Origin"] = "https://www.tiktok.com";
  }
  if (options.cookieHeader) baseHeaders["Cookie"] = options.cookieHeader;

  const cookieNames = options.cookieHeader
    ? String(options.cookieHeader)
        .split(/;\s*/)
        .map((p) => p.split("=")[0])
        .filter(Boolean)
    : [];

  const MAX_ATTEMPTS = 4;
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const headers = { ...baseHeaders };
    const backoffMs = Math.min(4000, 500 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 250);
    try {
      // Try HEAD first; if it fails with 5xx/4xx, fall back to GET
      let canProceed = true;
      try {
        const headRes = await fetch(url, { method: "HEAD", headers, redirect: "follow", cache: "no-store" });
        if (!headRes.ok) {
          console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} HEAD ${headRes.status} ${headRes.statusText}`);
          // Continue anyway; some CDNs block HEAD
          canProceed = false;
        }
      } catch (e) {
        console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} HEAD error:`, e?.message || e);
        canProceed = false;
      }

      // GET full resource
      const response = await fetch(url, { headers, redirect: "follow", cache: "no-store" });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        lastError = `GET failed: ${response.status} ${response.statusText}`;
        console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} ${lastError}. Snippet:`, text.slice(0, 180));
      } else {
        const buffer = await response.arrayBuffer();
        console.log(`✅ Video downloaded (attempt ${attempt}): ${buffer.byteLength} bytes`);
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (buffer.byteLength > maxSize) {
          return { success: false, error: `Video file too large: ${buffer.byteLength} bytes (max ${maxSize})` };
        }
        return { success: true, buffer };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} error:`, lastError);
    }

    if (attempt < MAX_ATTEMPTS) {
      console.log(`⏳ [DOWNLOAD] Retrying in ${backoffMs}ms...`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return {
    success: false,
    error: lastError || "Failed to download video",
    headersUsed: Object.keys(baseHeaders),
    cookieNames,
  };
}

// Transcribe video using Gemini
async function transcribeVideo(videoBuffer, requestId) {
  let tempFilePath = null;
  let uploadedFile = null;

  try {
    console.log(`🎙️ [${requestId}] Starting Gemini transcription...`);

    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "GEMINI_API_KEY not configured" };
    }

    // Step 1: Save buffer to temporary file
    const tempDir = "/tmp";
    const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.mp4`;
    tempFilePath = path.join(tempDir, fileName);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempFilePath, Buffer.from(videoBuffer));
    console.log(`💾 [${requestId}] Video saved to temp file: ${tempFilePath}`);

    // Step 2: Upload to Gemini Files API with timeout
    console.log(`📤 [${requestId}] Uploading to Gemini Files API...`);
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

    const uploadResult = await withTimeout(
      fileManager.uploadFile(tempFilePath, {
        mimeType: "video/mp4",
        displayName: `transcribe-video-${Date.now()}`,
      }),
      60000, // 60 second timeout
      "Gemini file upload",
    );

    uploadedFile = uploadResult.file;
    console.log(`✅ [${requestId}] Video uploaded to Gemini: ${uploadedFile.uri}`);

    // Step 3: Wait for processing with timeout
    let file = uploadedFile;
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const startWait = Date.now();

    while (file.state === "PROCESSING") {
      if (Date.now() - startWait > maxWaitTime) {
        throw new Error("Video processing timeout - exceeded 5 minutes");
      }

      console.log(`⏳ [${requestId}] Waiting for Gemini video processing...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
    }

    if (file.state === "FAILED") {
      throw new Error("Video processing failed on Gemini side");
    }

    console.log(`🎬 [${requestId}] Video processing completed, starting transcription...`);

    // Step 4: Transcribe with simplified prompt for faster processing
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Please transcribe this video and provide a complete word-for-word transcription of all spoken content. Focus on accuracy and completeness.

Return the response in this exact JSON format:
{
  "transcript": "full transcript here",
  "components": {
    "hook": "opening line that grabs attention",
    "bridge": "transition from hook to main content",
    "nugget": "main value/content point",
    "wta": "why to act at the end"
  },
  "contentMetadata": {
    "author": "speaker name if identifiable",
    "description": "brief content description",
    "hashtags": ["relevant", "hashtags"]
  },
  "visualContext": "brief description of visual elements"
}`;

    const result = await withTimeout(
      model.generateContent([
        {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType,
          },
        },
        { text: prompt },
      ]),
      120000, // 2 minute timeout
      "Gemini transcription",
    );

    const responseText = result.response.text();
    console.log(`📄 [${requestId}] Received transcription response`);

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ?? responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : responseText;
      parsedResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error(`❌ [${requestId}] Failed to parse JSON response:`, parseError);

      // Fallback response with raw transcript
      return {
        success: true,
        transcript: responseText,
        components: { hook: "", bridge: "", nugget: "", wta: "" },
        contentMetadata: {
          platform: "tiktok",
          author: "Unknown",
          description: "Video transcribed successfully",
          hashtags: [],
        },
        visualContext: "",
      };
    }

    const transcriptionData = {
      success: true,
      transcript: parsedResponse.transcript ?? "",
      components: parsedResponse.components ?? { hook: "", bridge: "", nugget: "", wta: "" },
      contentMetadata: {
        platform: "tiktok",
        author: parsedResponse.contentMetadata?.author ?? "Unknown",
        description: parsedResponse.contentMetadata?.description ?? "",
        hashtags: parsedResponse.contentMetadata?.hashtags ?? [],
      },
      visualContext: parsedResponse.visualContext ?? "",
    };

    console.log(`✅ [${requestId}] Transcription completed successfully`);
    console.log(`📋 [${requestId}] Transcript Length: ${transcriptionData.transcript.length} characters`);

    return transcriptionData;
  } catch (error) {
    console.error(`❌ [${requestId}] Transcription failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
  } finally {
    // Cleanup: Delete temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`🗑️ [${requestId}] Temporary file cleaned up`);
      } catch (cleanupError) {
        console.error(`⚠️ [${requestId}] Failed to cleanup temp file:`, cleanupError);
      }
    }

    // Cleanup: Delete uploaded file from Gemini
    if (uploadedFile) {
      try {
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
        await fileManager.deleteFile(uploadedFile.name);
        console.log(`🗑️ [${requestId}] Uploaded file cleaned up from Gemini`);
      } catch (cleanupError) {
        console.error(`⚠️ [${requestId}] Failed to cleanup uploaded file:`, cleanupError);
      }
    }
  }
}

export async function handleVideoTranscribe(req, res) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🚀 [${requestId}] Starting video transcription from URL`);

  try {
    const { videoUrl: initialUrl, cookies } = req.body;

    // Build optional Cookie header from provided cookies
    function buildCookieHeader(input) {
      if (!input) return undefined;
      if (typeof input === "string") return input.trim() || undefined;
      if (Array.isArray(input)) {
        const parts = input.map((c) => (c && c.name ? `${c.name}=${c.value ?? ""}` : "")).filter(Boolean);
        return parts.length ? parts.join("; ") : undefined;
      }
      if (typeof input === "object") {
        const parts = Object.entries(input)
          .filter(([k]) => !!k)
          .map(([k, v]) => `${k}=${v ?? ""}`);
        return parts.length ? parts.join("; ") : undefined;
      }
      return undefined;
    }
    const cookieHeader = buildCookieHeader(cookies);

    if (!initialUrl) {
      return res.status(400).json({
        success: false,
        error: "Video URL is required"
      });
    }

    // Validate environment
    if (!process.env.GEMINI_API_KEY) {
      console.error(`❌ [${requestId}] Missing GEMINI_API_KEY`);
      return res.status(500).json({
        success: false,
        error: "Server configuration incomplete"
      });
    }

    console.log(`📹 [${requestId}] Processing video URL: ${initialUrl}`);

    // Step 1: Download video from CDN
    const downloadResult = await downloadVideo(initialUrl, { cookieHeader });
    if (!downloadResult.success || !downloadResult.buffer) {
      console.error(`❌ [${requestId}] Download failed:`, downloadResult.error);
      return res.status(400).json({
        success: false,
        error: "Failed to download video",
        details: downloadResult.error,
        debug: {
          headersUsed: downloadResult.headersUsed,
          cookieNames: downloadResult.cookieNames,
          status: downloadResult.status,
        },
      });
    }

    console.log(`✅ [${requestId}] Video downloaded successfully: ${downloadResult.buffer.byteLength} bytes`);

    // Step 2: Transcribe video
    const transcriptionResult = await transcribeVideo(downloadResult.buffer, requestId);

    if (!transcriptionResult.success) {
      console.error(`❌ [${requestId}] Transcription failed:`, transcriptionResult.error);
      return res.status(500).json(transcriptionResult);
    }

    console.log(`🎉 [${requestId}] Transcription completed successfully`);
    return res.json(transcriptionResult);
  } catch (error) {
    console.error(`❌ [${requestId}] Unexpected error:`, error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
