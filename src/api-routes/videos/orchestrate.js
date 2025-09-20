// Determine the base URL the API should call, handling Vercel vs local dev.
function getServerBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

// Ensure downstream endpoints always receive a normalized leading slash path.
function sanitizePath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

// Wrap fetch POST + JSON parsing with consistent error handling semantics.
async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(`Failed to parse JSON from ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const message = data?.error || response.statusText;
    const error = new Error(`${url} responded with ${response.status}: ${message}`);
    error.response = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

function extractCandidateUrls(video) {
  if (!video || typeof video !== "object") return [];
  const candidates = [
    video.downloadUrl,
    video.playUrl,
    video.videoUrl,
    video.url,
    video.audioUrl,
    video.meta?.url,
  ];

  return candidates
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
}

function pickBestUrl(video) {
  const [primary] = extractCandidateUrls(video);
  return primary || null;
}

// Call the internal scraper endpoint as a fallback to obtain a usable media URL.
async function scrapeDownloadUrl(baseUrl, targetUrl) {
  if (!targetUrl) return null;
  const scrapeEndpoint = `${baseUrl}/api/video/scrape-url`;
  try {
    const result = await postJson(scrapeEndpoint, { url: targetUrl });
    return result?.result?.audioUrl || result?.result?.downloadUrl || null;
  } catch (error) {
    console.warn(`⚠️ Scrape endpoint failed for ${targetUrl}:`, error?.message || error);
    return null;
  }
}

export async function handleVideoWorkflow(req, res) {
  const requestId = Math.random().toString(36).slice(2, 8);
  const start = Date.now();
  console.log(`🚀 [${requestId}] Video workflow orchestrator started`);

  try {
    const {
      fetchEndpoint = "/api/tiktok/user-feed",
      fetchPayload = {},
      fetchLimit = 5,
      transcribeEndpoint = "/api/video/transcribe-from-url",
      preferScraper = false,
      // New: Voice analysis configuration
      enableVoiceAnalysis = false,
      voiceAnalysisEndpoint = "/api/voice/analyze-patterns",
      voiceAnalysisBatchSize = 10,
      creatorInfo = {},
    } = req.body || {};

    const baseUrl = getServerBaseUrl();
    const resolvedFetchUrl = `${baseUrl}${sanitizePath(fetchEndpoint)}`;
    const resolvedTranscribeUrl = `${baseUrl}${sanitizePath(transcribeEndpoint)}`;

    console.log(`📥 [${requestId}] Fetching videos via ${resolvedFetchUrl}`);
    const fetchResponse = await postJson(resolvedFetchUrl, fetchPayload);

    const videos = Array.isArray(fetchResponse?.videos) ? fetchResponse.videos : [];
    if (!videos.length) {
      console.warn(`⚠️ [${requestId}] Fetch endpoint returned no videos`);
    }

    // Respect caller supplied limit but default to at least one item if available.
    const limitedVideos = videos.slice(0, Math.max(1, Number(fetchLimit) || videos.length));

    const transcriptResults = [];
    for (let index = 0; index < limitedVideos.length; index++) {
      const video = limitedVideos[index];
      const identifier = video?.id || video?.aweme_id || `video-${index + 1}`;
      const stepLabel = `${identifier} (${index + 1}/${limitedVideos.length})`;
      console.log(`🎯 [${requestId}] Preparing transcription for ${stepLabel}`);

      let directUrl = pickBestUrl(video);

      if (!directUrl && preferScraper) {
        const canonicalUrl = video?.shareUrl || video?.permalink || video?.url;
        directUrl = await scrapeDownloadUrl(baseUrl, canonicalUrl);
      }

      if (!directUrl) {
        console.warn(`⚠️ [${requestId}] No usable URL for ${stepLabel}, skipping.`);
        transcriptResults.push({
          id: identifier,
          success: false,
          error: "No usable URL for transcription",
        });
        continue;
      }

      try {
        // Request transcription for this video URL and retain the detailed response.
        const transcriptionResponse = await postJson(resolvedTranscribeUrl, { videoUrl: directUrl });
        transcriptResults.push({
          id: identifier,
          success: true,
          transcriptLength: transcriptionResponse?.transcript?.length ?? 0,
          details: transcriptionResponse,
        });
        console.log(`✅ [${requestId}] Transcription succeeded for ${stepLabel}`);
      } catch (err) {
        console.error(`❌ [${requestId}] Transcription failed for ${stepLabel}:`, err);
        transcriptResults.push({
          id: identifier,
          success: false,
          error: err instanceof Error ? err.message : "Unknown transcription error",
          response: err?.response,
          status: err?.status,
        });
      }
    }

    const successCount = transcriptResults.filter((item) => item.success).length;
    
    // Step 3: Voice Analysis (optional)
    let voiceAnalysisResult = null;
    if (enableVoiceAnalysis && successCount > 0) {
      console.log(`🎯 [${requestId}] Starting voice pattern analysis for ${successCount} successful transcripts`);
      
      try {
        // Only pass transcripts that succeeded, optionally batching on the analysis service.
        const successfulTranscripts = transcriptResults
          .filter(result => result.success && result.details?.transcript)
          .map(result => result.details.transcript);

        if (successfulTranscripts.length > 0) {
          const resolvedVoiceAnalysisUrl = `${baseUrl}${sanitizePath(voiceAnalysisEndpoint)}`;
          const analysisPayload = {
            transcripts: successfulTranscripts,
            creator: creatorInfo,
            batchSize: voiceAnalysisBatchSize,
            enableBatching: true,
            responseType: 'json',
            model: 'gemini-1.5-flash',
            temperature: 0.2,
            maxTokens: 6000
          };

          const analysisResponse = await postJson(resolvedVoiceAnalysisUrl, analysisPayload);
          voiceAnalysisResult = {
            success: true,
            ...analysisResponse
          };
          console.log(`✅ [${requestId}] Voice analysis completed successfully`);
        } else {
          console.warn(`⚠️ [${requestId}] No valid transcripts available for voice analysis`);
          voiceAnalysisResult = {
            success: false,
            error: "No valid transcripts available for analysis"
          };
        }
      } catch (err) {
        console.error(`❌ [${requestId}] Voice analysis failed:`, err);
        voiceAnalysisResult = {
          success: false,
          error: err instanceof Error ? err.message : "Voice analysis failed"
        };
      }
    }

    const durationMs = Date.now() - start;

    const response = {
      success: true,
      requestId,
      durationMs,
      fetch: {
        endpoint: fetchEndpoint,
        payload: fetchPayload,
        totalVideos: videos.length,
        processed: limitedVideos.length,
      },
      transcriptions: transcriptResults,
      summary: {
        successCount,
        failureCount: transcriptResults.length - successCount,
      },
    };

    // Add voice analysis results if enabled
    if (enableVoiceAnalysis) {
      response.voiceAnalysis = voiceAnalysisResult;
    }

    return res.json(response);
  } catch (error) {
    console.error(`❌ [${requestId}] Workflow orchestrator failed:`, error);
    return res.status(500).json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : "Workflow failed",
    });
  }
}
