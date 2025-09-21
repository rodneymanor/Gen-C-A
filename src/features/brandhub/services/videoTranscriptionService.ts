import { VIDEO_LIMIT, TRANSCRIBE_CONCURRENCY } from './voiceCreationConfig'
import { VoiceWorkflowContext, TranscribedVideoMeta } from '../types/voiceWorkflow'
import { resolvePlatformFromVideo } from '../utils/voiceCreationFormatting'

interface TranscribeVideosOptions {
  videos: any[]
  context: VoiceWorkflowContext
  baseResult: any
}

export const transcribeVideos = async ({
  videos,
  context,
  baseResult
}: TranscribeVideosOptions): Promise<{ transcripts: string[]; videoMeta: TranscribedVideoMeta[] }> => {
  const limitedVideos = videos.slice(0, VIDEO_LIMIT)
  const results: Array<{ transcript?: string; meta?: TranscribedVideoMeta } | null> = new Array(
    limitedVideos.length
  ).fill(null)
  let nextIndex = 0

  const resolveScrapeSourceUrl = (video: any): string | null => {
    const directCandidates: Array<unknown> = [
      video?.permalink,
      video?.shareUrl,
      video?.share_url,
      video?.url,
      video?.meta?.permalink,
      video?.meta?.url
    ]

    for (const candidate of directCandidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim()
        if (trimmed.length > 0 && /^https?:\/\//i.test(trimmed)) {
          return trimmed
        }
      }
    }

    const platformHint = resolvePlatformFromVideo(video, context.platform)

    if (platformHint === 'tiktok') {
      const rawHandle =
        (typeof video?.author?.username === 'string' && video.author.username.trim()) ||
        (typeof video?.author?.uniqueId === 'string' && video.author.uniqueId.trim()) ||
        (typeof baseResult?.userInfo?.username === 'string' && baseResult.userInfo.username.trim()) ||
        context.identifier

      if (rawHandle && video?.id) {
        const cleanHandle = rawHandle.replace(/^@/, '')
        return `https://www.tiktok.com/@${cleanHandle}/video/${video.id}`
      }
    }

    if (platformHint === 'instagram') {
      const shortcode =
        (typeof video?.code === 'string' && video.code.trim()) ||
        (typeof video?.shortcode === 'string' && video.shortcode.trim()) ||
        (typeof video?.id === 'string' && video.id.length <= 15 ? video.id.trim() : '')

      if (shortcode) {
        return `https://www.instagram.com/reel/${shortcode.replace(/\//g, '')}/`
      }
    }

    return null
  }

  const worker = async () => {
    while (nextIndex < limitedVideos.length) {
      const currentIndex = nextIndex
      nextIndex += 1

      const video = limitedVideos[currentIndex]
      const scrapeSourceUrl = resolveScrapeSourceUrl(video)
      const fallbackTranscriptionUrl =
        video.downloadUrl ||
        video.playUrl ||
        video.audioUrl ||
        (video.meta?.url ? video.meta.url : undefined) ||
        (video.videoUrl ? video.videoUrl : undefined) ||
        null

      if (!scrapeSourceUrl && !fallbackTranscriptionUrl) {
        console.warn('Skipping video due to missing transcription URL', video?.id)
        continue
      }

      try {
        const transcriptionUrl: string | null = fallbackTranscriptionUrl
        const scrapedMeta: Partial<TranscribedVideoMeta> = {
          url: transcriptionUrl ?? undefined,
          sourceUrl: typeof scrapeSourceUrl === 'string' ? scrapeSourceUrl : undefined,
          platform: resolvePlatformFromVideo(video, context.platform)
        }

        if (!transcriptionUrl) {
          console.warn('No transcription URL available for video', video?.id)
          continue
        }

        const transcriptionResponse = await fetch('/api/video/transcribe-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: transcriptionUrl })
        })

        const transcriptionResult = await transcriptionResponse.json().catch(() => null)

        if (
          transcriptionResponse.ok &&
          transcriptionResult?.success &&
          transcriptionResult?.transcript
        ) {
          results[currentIndex] = {
            transcript: transcriptionResult.transcript,
            meta: {
              id: String(video.id ?? video.meta?.id ?? `video-${currentIndex}`),
              url: transcriptionUrl,
              title: scrapedMeta.title ?? video.description,
              sourceUrl:
                scrapedMeta.sourceUrl ??
                (typeof scrapeSourceUrl === 'string' ? scrapeSourceUrl : undefined),
              platform: scrapedMeta.platform,
              thumbnailUrl: scrapedMeta.thumbnailUrl ?? video.cover ?? null
            }
          }
        } else {
          console.warn('Transcription failed for video', video?.id, transcriptionResult?.error)
        }
      } catch (workerError) {
        console.warn('Error transcribing video', video?.id, workerError)
      }
    }
  }

  const workerCount = Math.min(TRANSCRIBE_CONCURRENCY, limitedVideos.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  const transcripts: string[] = []
  const videoMeta: TranscribedVideoMeta[] = []

  results.forEach((result) => {
    if (result?.transcript) {
      transcripts.push(result.transcript)
      if (result.meta) {
        videoMeta.push(result.meta)
      }
    }
  })

  if (!transcripts.length) {
    throw new Error('No videos could be transcribed successfully.')
  }

  return { transcripts, videoMeta }
}
