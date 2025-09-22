import { postJson } from './video-utils.js';

class VideoOrchestratorServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'VideoOrchestratorServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

function sanitizePath(path) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function getServerBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

function pickBestUrl(video) {
  const candidates = [
    video?.downloadUrl,
    video?.playUrl,
    video?.videoUrl,
    video?.url,
    video?.audioUrl,
    video?.meta?.url,
  ];
  const first = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return first || null;
}

class VideoOrchestratorService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || getServerBaseUrl();
  }

  async orchestrateWorkflow(params = {}) {
    const {
      fetchEndpoint = '/api/tiktok/user-feed',
      fetchPayload = {},
      fetchLimit = 5,
      transcribeEndpoint = '/api/video/transcribe-from-url',
      enableVoiceAnalysis = false,
      voiceAnalysisEndpoint = '/api/voice/analyze-patterns',
      voiceAnalysisBatchSize = 10,
      creatorInfo = {},
    } = params;

    const requestId = Math.random().toString(36).slice(2, 8);
    const start = Date.now();

    const resolvedFetchUrl = `${this.baseUrl}${sanitizePath(fetchEndpoint)}`;
    const resolvedTranscribeUrl = `${this.baseUrl}${sanitizePath(transcribeEndpoint)}`;

    const fetchResponse = await postJson(resolvedFetchUrl, fetchPayload);
    const videos = Array.isArray(fetchResponse?.videos) ? fetchResponse.videos : [];
    const limitedVideos = videos.slice(0, Math.max(1, Number(fetchLimit) || videos.length));

    const transcriptResults = [];
    for (let index = 0; index < limitedVideos.length; index++) {
      const video = limitedVideos[index];
      const identifier = video?.id || video?.aweme_id || `video-${index + 1}`;
      const directUrl = pickBestUrl(video);

      if (!directUrl) {
        transcriptResults.push({
          id: identifier,
          success: false,
          error: 'No usable URL for transcription',
        });
        continue;
      }

      try {
        const transcriptionResponse = await postJson(resolvedTranscribeUrl, { videoUrl: directUrl });
        transcriptResults.push({
          id: identifier,
          success: true,
          transcriptLength: transcriptionResponse?.transcript?.length ?? 0,
          details: transcriptionResponse,
        });
      } catch (error) {
        transcriptResults.push({
          id: identifier,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown transcription error',
          response: error?.response,
          status: error?.status,
        });
      }
    }

    const successCount = transcriptResults.filter((item) => item.success).length;
    let voiceAnalysisResult = null;

    if (enableVoiceAnalysis && successCount > 0) {
      const successfulTranscripts = transcriptResults
        .filter((result) => result.success && result.details?.transcript)
        .map((result) => result.details.transcript);

      if (successfulTranscripts.length > 0) {
        const resolvedVoiceAnalysisUrl = `${this.baseUrl}${sanitizePath(voiceAnalysisEndpoint)}`;
        const analysisPayload = {
          transcripts: successfulTranscripts,
          creator: creatorInfo,
          batchSize: voiceAnalysisBatchSize,
          enableBatching: true,
          responseType: 'json',
          model: 'gemini-1.5-flash',
          temperature: 0.2,
          maxTokens: 6000,
        };

        try {
          const analysisResponse = await postJson(resolvedVoiceAnalysisUrl, analysisPayload);
          voiceAnalysisResult = { success: true, ...analysisResponse };
        } catch (error) {
          voiceAnalysisResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Voice analysis failed',
          };
        }
      } else {
        voiceAnalysisResult = {
          success: false,
          error: 'No valid transcripts available for analysis',
        };
      }
    }

    const durationMs = Date.now() - start;

    return {
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
      voiceAnalysis: voiceAnalysisResult,
    };
  }
}

const SERVICE_INSTANCE_KEY = '__videoOrchestratorService__';

function getVideoOrchestratorService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new VideoOrchestratorService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { VideoOrchestratorService, VideoOrchestratorServiceError, getVideoOrchestratorService };
