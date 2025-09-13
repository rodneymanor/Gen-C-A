/**
 * External Service Mock Patterns
 * 
 * Comprehensive mock patterns for Firebase, CDN, AI services, 
 * social media APIs, and other external dependencies
 */

import { vi } from 'vitest'

/**
 * Firebase Admin SDK Mocks
 */
export const createFirebaseAdminMocks = () => {
  const mockAuth = {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'mock-user-123',
      email: 'mock@example.com',
      role: 'user',
      permissions: ['read:collections', 'write:collections']
    }),
    createUser: vi.fn().mockResolvedValue({
      uid: 'new-user-456',
      email: 'newuser@example.com'
    }),
    updateUser: vi.fn().mockResolvedValue({
      uid: 'updated-user-789'
    }),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    getUser: vi.fn().mockResolvedValue({
      uid: 'existing-user',
      email: 'existing@example.com',
      displayName: 'Existing User',
      customClaims: {
        role: 'user',
        permissions: ['read:collections']
      }
    }),
    getUserByEmail: vi.fn().mockResolvedValue({
      uid: 'email-user',
      email: 'email@example.com'
    }),
    createCustomToken: vi.fn().mockResolvedValue('mock-custom-token-123'),
    listUsers: vi.fn().mockResolvedValue({
      users: [],
      pageToken: undefined
    })
  }

  const mockFirestore = {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'mock-doc-id',
          data: () => ({
            title: 'Mock Document',
            createdAt: { _seconds: Date.now() / 1000 }
          })
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        onSnapshot: vi.fn()
      })),
      add: vi.fn().mockResolvedValue({ id: 'new-doc-123' }),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'query-doc-1',
            data: () => ({ title: 'Query Result 1' })
          },
          {
            id: 'query-doc-2', 
            data: () => ({ title: 'Query Result 2' })
          }
        ],
        size: 2,
        empty: false
      })
    })),
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        exists: true,
        id: 'direct-doc-id',
        data: () => ({ title: 'Direct Document' })
      }),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    })),
    batch: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue('batch-success')
    })),
    runTransaction: vi.fn().mockImplementation(async (callback) => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ count: 5 })
        }),
        set: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis()
      }
      return await callback(mockTransaction)
    })
  }

  return { mockAuth, mockFirestore }
}

/**
 * CDN Service Mocks
 */
export const createCDNServiceMocks = () => {
  const mockCDNService = {
    uploadVideo: vi.fn().mockResolvedValue({
      success: true,
      videoId: 'cdn-video-123',
      url: 'https://cdn.example.com/video.mp4',
      streamUrl: 'https://stream.example.com/video.m3u8'
    }),
    generateThumbnail: vi.fn().mockResolvedValue({
      success: true,
      thumbnailUrl: 'https://cdn.example.com/thumbnail.jpg',
      thumbnails: [
        { timestamp: 10, url: 'https://cdn.example.com/thumb-10.jpg' },
        { timestamp: 30, url: 'https://cdn.example.com/thumb-30.jpg' },
        { timestamp: 60, url: 'https://cdn.example.com/thumb-60.jpg' }
      ]
    }),
    getVideoUrl: vi.fn().mockResolvedValue({
      success: true,
      url: 'https://cdn.example.com/video.mp4',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }),
    deleteVideo: vi.fn().mockResolvedValue({
      success: true
    }),
    getUploadProgress: vi.fn().mockResolvedValue({
      progress: 100,
      status: 'completed'
    }),
    generateStreamingUrls: vi.fn().mockResolvedValue({
      success: true,
      urls: {
        hls: 'https://stream.example.com/video.m3u8',
        dash: 'https://stream.example.com/video.mpd',
        mp4: 'https://cdn.example.com/video.mp4'
      }
    })
  }

  return mockCDNService
}

/**
 * AI Analysis Service Mocks
 */
export const createAIServiceMocks = () => {
  const mockAIService = {
    analyzeVideo: vi.fn().mockResolvedValue({
      success: true,
      analysis: {
        transcript: 'This is a mock transcript of the video content.',
        summary: 'Mock video summary highlighting key points.',
        topics: ['technology', 'tutorial', 'programming'],
        sentiment: 'positive',
        language: 'en',
        confidence: 0.95,
        keyPoints: [
          { timestamp: 10, text: 'Introduction to the topic' },
          { timestamp: 45, text: 'Main content explanation' },
          { timestamp: 120, text: 'Conclusion and summary' }
        ]
      }
    }),
    extractKeyframes: vi.fn().mockResolvedValue({
      success: true,
      keyframes: [
        { 
          timestamp: 5, 
          url: 'https://cdn.example.com/keyframe-5.jpg',
          confidence: 0.92,
          description: 'Opening scene'
        },
        { 
          timestamp: 30, 
          url: 'https://cdn.example.com/keyframe-30.jpg',
          confidence: 0.88,
          description: 'Key concept illustration'
        },
        { 
          timestamp: 90, 
          url: 'https://cdn.example.com/keyframe-90.jpg',
          confidence: 0.85,
          description: 'Summary diagram'
        }
      ]
    }),
    generateTranscript: vi.fn().mockResolvedValue({
      success: true,
      transcript: {
        text: 'Complete transcript of the video content with accurate timing.',
        segments: [
          { start: 0, end: 15, text: 'Welcome to this tutorial video.' },
          { start: 15, end: 45, text: 'Today we will be covering the basics of...' },
          { start: 45, end: 120, text: 'Let me show you how this works in practice.' }
        ],
        language: 'en',
        confidence: 0.93
      }
    }),
    detectContent: vi.fn().mockResolvedValue({
      success: true,
      content: {
        objects: ['person', 'computer', 'screen'],
        scenes: ['office', 'presentation'],
        text: ['Tutorial', 'Example', 'Code'],
        faces: 1,
        isAppropriate: true,
        contentWarnings: []
      }
    }),
    generateCaptions: vi.fn().mockResolvedValue({
      success: true,
      captions: {
        vtt: 'WEBVTT\n\n00:00:00.000 --> 00:00:15.000\nWelcome to this tutorial video.\n\n00:00:15.000 --> 00:00:45.000\nToday we will be covering...',
        srt: '1\n00:00:00,000 --> 00:00:15,000\nWelcome to this tutorial video.\n\n2\n00:00:15,000 --> 00:00:45,000\nToday we will be covering...'
      }
    })
  }

  return mockAIService
}

/**
 * Video Download Service Mocks
 */
export const createVideoDownloadServiceMocks = () => {
  const mockVideoDownloadService = {
    downloadVideo: vi.fn().mockResolvedValue({
      success: true,
      buffer: Buffer.from('mock video data'),
      metadata: {
        title: 'Mock Downloaded Video',
        description: 'Mock video description',
        duration: 180,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000000,
        format: 'mp4',
        fileSize: 50000000 // 50MB
      }
    }),
    getSupportedPlatforms: vi.fn().mockReturnValue([
      'youtube',
      'tiktok',
      'instagram',
      'twitter',
      'vimeo',
      'custom'
    ]),
    validateUrl: vi.fn().mockResolvedValue({
      valid: true,
      platform: 'youtube',
      videoId: 'mock-video-id',
      title: 'Mock Video Title',
      thumbnail: 'https://img.youtube.com/vi/mock-video-id/maxresdefault.jpg'
    }),
    getVideoInfo: vi.fn().mockResolvedValue({
      success: true,
      info: {
        title: 'Mock Video Information',
        description: 'Detailed mock video description',
        uploader: 'Mock Channel',
        uploadDate: '2023-01-01',
        viewCount: 1000000,
        likeCount: 50000,
        duration: 300,
        thumbnail: 'https://example.com/mock-thumbnail.jpg'
      }
    }),
    checkAvailability: vi.fn().mockResolvedValue({
      available: true,
      reason: null
    })
  }

  return mockVideoDownloadService
}

/**
 * Social Media Platform Mocks
 */
export const createSocialMediaMocks = () => {
  const mockYouTubeAPI = {
    getVideoDetails: vi.fn().mockResolvedValue({
      id: 'youtube-mock-id',
      snippet: {
        title: 'Mock YouTube Video',
        description: 'Mock YouTube video description',
        channelTitle: 'Mock YouTube Channel',
        publishedAt: '2023-01-01T00:00:00Z',
        thumbnails: {
          maxres: { url: 'https://img.youtube.com/vi/mock/maxresdefault.jpg' }
        }
      },
      statistics: {
        viewCount: '1000000',
        likeCount: '50000',
        commentCount: '5000'
      },
      contentDetails: {
        duration: 'PT3M20S' // 3 minutes 20 seconds
      }
    }),
    searchVideos: vi.fn().mockResolvedValue({
      items: [
        {
          id: { videoId: 'search-result-1' },
          snippet: {
            title: 'Mock Search Result 1',
            description: 'First mock search result'
          }
        },
        {
          id: { videoId: 'search-result-2' },
          snippet: {
            title: 'Mock Search Result 2',
            description: 'Second mock search result'
          }
        }
      ]
    })
  }

  const mockTikTokAPI = {
    getVideoDetails: vi.fn().mockResolvedValue({
      id: 'tiktok-mock-id',
      desc: 'Mock TikTok video description #mock #test',
      author: {
        uniqueId: 'mock-tiktok-user',
        nickname: 'Mock TikTok User'
      },
      stats: {
        playCount: 500000,
        diggCount: 25000,
        shareCount: 5000
      },
      video: {
        duration: 15,
        ratio: '9:16'
      },
      music: {
        title: 'Mock TikTok Song',
        author: 'Mock Artist'
      }
    })
  }

  const mockInstagramAPI = {
    getPostDetails: vi.fn().mockResolvedValue({
      id: 'instagram-mock-id',
      caption: {
        text: 'Mock Instagram post caption #instagram #mock'
      },
      user: {
        username: 'mock-instagram-user',
        full_name: 'Mock Instagram User'
      },
      like_count: 10000,
      comment_count: 500,
      media_type: 'VIDEO',
      video_url: 'https://mock-instagram-video.mp4'
    })
  }

  const mockTwitterAPI = {
    getTweetDetails: vi.fn().mockResolvedValue({
      id: 'twitter-mock-id',
      text: 'Mock Twitter post with video content #twitter #mock',
      user: {
        screen_name: 'mock_twitter_user',
        name: 'Mock Twitter User'
      },
      retweet_count: 1000,
      favorite_count: 5000,
      entities: {
        media: [{
          type: 'video',
          video_info: {
            variants: [
              { bitrate: 2176000, url: 'https://mock-twitter-video.mp4' }
            ]
          }
        }]
      }
    })
  }

  return {
    mockYouTubeAPI,
    mockTikTokAPI,
    mockInstagramAPI,
    mockTwitterAPI
  }
}

/**
 * Transcription Service Mocks
 */
export const createTranscriptionServiceMocks = () => {
  const mockTranscriptionService = {
    transcribeVideo: vi.fn().mockResolvedValue({
      success: true,
      transcriptionId: 'mock-transcription-123',
      transcript: {
        text: 'Complete mock transcript of the video content.',
        segments: [
          { 
            start: 0, 
            end: 10, 
            text: 'Hello and welcome to this video.',
            confidence: 0.95 
          },
          { 
            start: 10, 
            end: 25, 
            text: 'Today we will be discussing important topics.',
            confidence: 0.92 
          }
        ],
        language: 'en',
        duration: 180
      }
    }),
    getTranscriptionStatus: vi.fn().mockResolvedValue({
      success: true,
      status: 'completed',
      progress: 100,
      estimatedCompletion: null
    }),
    listSupportedLanguages: vi.fn().mockReturnValue([
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'
    ]),
    translateTranscript: vi.fn().mockResolvedValue({
      success: true,
      translatedText: 'Translated mock transcript content.',
      sourceLanguage: 'en',
      targetLanguage: 'es'
    })
  }

  return mockTranscriptionService
}

/**
 * Content Analysis Service Mocks
 */
export const createContentAnalysisServiceMocks = () => {
  const mockContentAnalysisService = {
    analyzeReadability: vi.fn().mockResolvedValue({
      success: true,
      scores: {
        fleschKincaid: 8.5,
        fleschReading: 65.2,
        smog: 9.1,
        automated: 7.8,
        colemanLiau: 8.9
      },
      level: 'High School',
      recommendations: [
        'Consider simplifying complex sentences',
        'Use more common vocabulary where possible'
      ]
    }),
    extractTopics: vi.fn().mockResolvedValue({
      success: true,
      topics: [
        { topic: 'Technology', confidence: 0.95 },
        { topic: 'Education', confidence: 0.88 },
        { topic: 'Programming', confidence: 0.82 }
      ]
    }),
    detectSentiment: vi.fn().mockResolvedValue({
      success: true,
      sentiment: {
        overall: 'positive',
        score: 0.75,
        breakdown: {
          positive: 0.75,
          neutral: 0.20,
          negative: 0.05
        }
      }
    }),
    moderateContent: vi.fn().mockResolvedValue({
      success: true,
      moderation: {
        appropriate: true,
        categories: {
          violence: 0.01,
          adult: 0.02,
          hate: 0.01,
          spam: 0.03
        },
        warnings: [],
        blocked: false
      }
    })
  }

  return mockContentAnalysisService
}

/**
 * Background Job Service Mocks
 */
export const createBackgroundJobServiceMocks = () => {
  const mockBackgroundJobService = {
    enqueueJob: vi.fn().mockResolvedValue({
      success: true,
      jobId: 'mock-job-123',
      estimatedCompletion: new Date(Date.now() + 300000) // 5 minutes
    }),
    getJobStatus: vi.fn().mockResolvedValue({
      success: true,
      status: 'in_progress',
      progress: 65,
      result: null,
      error: null
    }),
    cancelJob: vi.fn().mockResolvedValue({
      success: true
    }),
    listJobs: vi.fn().mockResolvedValue({
      success: true,
      jobs: [
        {
          id: 'job-1',
          type: 'video-processing',
          status: 'completed',
          progress: 100
        },
        {
          id: 'job-2',
          type: 'transcription',
          status: 'in_progress',
          progress: 45
        }
      ]
    }),
    retryJob: vi.fn().mockResolvedValue({
      success: true,
      jobId: 'retry-job-456'
    })
  }

  return mockBackgroundJobService
}

/**
 * Mock Factory for Complete Service Ecosystem
 */
export class MockFactory {
  static createCompleteServiceMock() {
    const firebase = createFirebaseAdminMocks()
    const cdn = createCDNServiceMocks()
    const ai = createAIServiceMocks()
    const videoDownload = createVideoDownloadServiceMocks()
    const socialMedia = createSocialMediaMocks()
    const transcription = createTranscriptionServiceMocks()
    const contentAnalysis = createContentAnalysisServiceMocks()
    const backgroundJobs = createBackgroundJobServiceMocks()

    return {
      firebase,
      cdn,
      ai,
      videoDownload,
      socialMedia,
      transcription,
      contentAnalysis,
      backgroundJobs
    }
  }

  static createTestData() {
    return {
      users: [
        {
          uid: 'test-user-1',
          email: 'user1@example.com',
          displayName: 'Test User 1',
          role: 'user',
          permissions: ['read:collections', 'write:collections']
        },
        {
          uid: 'test-admin-1',
          email: 'admin@example.com',
          displayName: 'Test Admin',
          role: 'admin',
          permissions: ['*:*']
        }
      ],
      collections: [
        {
          id: 'test-collection-1',
          title: 'Test Collection 1',
          description: 'First test collection',
          userId: 'test-user-1',
          isPublic: false,
          videos: [],
          createdAt: new Date().toISOString()
        },
        {
          id: 'test-collection-2',
          title: 'Public Test Collection',
          description: 'Public test collection',
          userId: 'test-user-1',
          isPublic: true,
          videos: [],
          createdAt: new Date().toISOString()
        }
      ],
      videos: [
        {
          id: 'test-video-1',
          title: 'Test Video 1',
          description: 'First test video',
          url: 'https://cdn.example.com/test-video-1.mp4',
          thumbnailUrl: 'https://cdn.example.com/test-video-1-thumb.jpg',
          duration: 180,
          platform: 'youtube',
          metadata: {
            width: 1920,
            height: 1080,
            fps: 30,
            bitrate: 5000000
          }
        }
      ]
    }
  }

  static resetAllMocks() {
    vi.clearAllMocks()
  }
}

export default MockFactory