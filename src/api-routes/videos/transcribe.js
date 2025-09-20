/**
 * Video Transcription API Routes - Converted from Next.js to Express format
 */

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

const MAX_DOWNLOAD_SIZE = (() => {
  const env = Number(process.env.VIDEO_TRANSCRIBE_MAX_BYTES);
  return Number.isFinite(env) && env > 0 ? env : 80 * 1024 * 1024; // default 80MB
})();

const GEMINI_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

const GEMINI_MODEL = "gemini-1.5-flash";

const DEFAULT_VIDEO_MIME = "video/mp4";
const GEMINI_FILE_POLL_INTERVAL_MS = 1000;
const GEMINI_FILE_MAX_POLL_ATTEMPTS = 10;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGeminiFileReady(fileManager, file, requestId) {
  let current = file;
  for (let attempt = 0; attempt < GEMINI_FILE_MAX_POLL_ATTEMPTS; attempt++) {
    const state = current?.state;
    if (state === "ACTIVE" && current?.uri) {
      return current;
    }

    if (state === "FAILED" || current?.error) {
      const message = current?.error?.message || "Gemini reported the upload failed";
      throw new Error(`Gemini upload failed for ${requestId}: ${message}`);
    }

    await sleep(GEMINI_FILE_POLL_INTERVAL_MS * Math.max(1, attempt + 1));
    current = await fileManager.getFile(current?.name || file?.name);
  }

  throw new Error(`Gemini upload did not become ready in time for ${requestId}`);
}

async function generateTranscriptFromBuffer(buffer, mimeType, requestId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const effectiveMimeType = mimeType || DEFAULT_VIDEO_MIME;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, safetySettings: GEMINI_SAFETY_SETTINGS });
  const fileManager = new GoogleAIFileManager(apiKey);

  const displayName = `transcription-${requestId}-${Date.now()}`;
  const uploadResponse = await fileManager.uploadFile(Buffer.from(buffer), {
    mimeType: effectiveMimeType,
    displayName,
  });

  const uploadedFile = uploadResponse?.file;
  if (!uploadedFile?.name) {
    throw new Error("Gemini upload did not return a file reference");
  }

  let readyFile;
  try {
    readyFile = await waitForGeminiFileReady(fileManager, uploadedFile, requestId);
  } catch (err) {
    // Clean up the uploaded file before propagating the error
    await fileManager.deleteFile(uploadedFile.name).catch((deleteErr) => {
      console.warn(`⚠️ [${requestId}] Failed to delete Gemini file after upload error:`, deleteErr);
    });
    throw err;
  }

  const prompt =
    "Transcribe every spoken word from this video. Return ONLY the verbatim transcript with no additional commentary.";

  try {
    const result = await withTimeout(
      model.generateContent([
        { text: prompt },
        {
          fileData: {
            fileUri: readyFile.uri,
            mimeType: readyFile.mimeType || effectiveMimeType,
          },
        },
      ]),
      120000,
      `Gemini transcription ${requestId}`
    );

    const transcript = result.response.text().trim();
    if (!transcript) {
      throw new Error("Gemini returned an empty transcript");
    }

    return transcript;
  } finally {
    await fileManager.deleteFile(readyFile.name).catch((error) => {
      console.warn(`⚠️ [${requestId}] Failed to delete Gemini file ${readyFile.name}:`, error?.message || error);
    });
  }
}

async function analyzeTranscriptComponents(transcript, requestId) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Analyze the following transcript and return JSON with keys hook, bridge, nugget, wta. Each field should contain a concise string summarizing that element. Transcript:\n${transcript}`;

  const analysis = await withTimeout(
    model.generateContent([{ text: prompt }]),
    60000,
    `Gemini component analysis ${requestId}`
  );

  const text = analysis.response.text();
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)```/);
    const payload = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    return {
      hook: String(payload.hook ?? ""),
      bridge: String(payload.bridge ?? ""),
      nugget: String(payload.nugget ?? ""),
      wta: String(payload.wta ?? ""),
    };
  } catch (error) {
    console.warn(`⚠️ [${requestId}] Failed to parse component JSON, returning empty components`, text);
    return { hook: "", bridge: "", nugget: "", wta: "" };
  }
}

// Download video from CDN URL with retries and HEAD→GET fallback
async function downloadVideo(url, options = {}) {
  console.log("⬇️ Downloading video from CDN:", url);
  const parsed = new URL(url);
  const isTikTok = parsed.hostname.includes("tiktok");
  const isInstagram = parsed.hostname.includes("instagram.com") || parsed.hostname.includes("cdninstagram.com");

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
  if (isInstagram) {
    baseHeaders["Referer"] = "https://www.instagram.com/";
    baseHeaders["Origin"] = "https://www.instagram.com";
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
        const lengthHeader = headRes.headers.get("content-length");
        const contentLength = Number(lengthHeader);
        if (Number.isFinite(contentLength) && contentLength > MAX_DOWNLOAD_SIZE) {
          console.warn(`⚠️ [DOWNLOAD] HEAD reports size ${contentLength} bytes, exceeding limit ${MAX_DOWNLOAD_SIZE}.`);
          return {
            success: false,
            error: `Video file too large: ${contentLength} bytes (max ${MAX_DOWNLOAD_SIZE})`,
            headersUsed: Object.keys(headers),
            cookieNames,
            status: headRes.status,
          };
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
        const mimeType = response.headers.get("content-type") || "video/mp4";
        console.log(`✅ Video downloaded (attempt ${attempt}): ${buffer.byteLength} bytes`);
        if (buffer.byteLength > MAX_DOWNLOAD_SIZE) {
          return {
            success: false,
            error: `Video file too large: ${buffer.byteLength} bytes (max ${MAX_DOWNLOAD_SIZE})`,
            headersUsed: Object.keys(headers),
            cookieNames,
            status: response.status,
          };
        }
        return { success: true, buffer, mimeType };
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

// Transcribe video using Gemini (inline)
async function transcribeVideo(nodeBuffer, mimeType, requestId, sourceUrl) {
  try {
    console.log(`🎙️ [${requestId}] Starting Gemini transcription (inline)`);
    const transcript = await generateTranscriptFromBuffer(nodeBuffer, mimeType, requestId);
    console.log(`✅ [${requestId}] Transcript received (${transcript.length} characters)`);

    const components = await analyzeTranscriptComponents(transcript, requestId);

    return {
      success: true,
      transcript,
      components,
      contentMetadata: {
        platform: sourceUrl && sourceUrl.includes("instagram") ? "instagram" : "tiktok",
        author: "Unknown",
        description: "Video transcribed successfully",
        hashtags: [],
      },
      visualContext: "",
    };
  } catch (error) {
    console.error(`❌ [${requestId}] Transcription failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
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
    const nodeBuffer = Buffer.from(downloadResult.buffer);
    const mimeType = downloadResult.mimeType || "video/mp4";

    const transcriptionResult = await transcribeVideo(nodeBuffer, mimeType, requestId, initialUrl);

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
