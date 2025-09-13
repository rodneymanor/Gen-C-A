/**
 * Comprehensive Unit Tests for Social Platform Services
 * 
 * Tests TikTok, Instagram, YouTube clients and the unified service manager
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import {
  TikTokClient,
  InstagramClient,
  YouTubeClient,
  SocialPlatformServiceManager,
  createSocialPlatformServiceManager,
  socialPlatformService
} from '@/lib/social-platform-services'
import type {
  PlatformContent,
  VideoDownloadResult,
  TranscriptSegment,
  PlatformClientConfig
} from '@/lib/social-platform-services'

// Mock fetch globally
global.fetch = vi.fn()

describe('Social Platform Services', () => {
  const mockConfig: PlatformClientConfig = {
    rapidApiKey: 'test-rapid-api-key',
    apifyToken: 'test-apify-token',
    youtubeApiKey: 'test-youtube-api-key',
    timeout: 30000,
    retries: 2
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('TikTokClient', () => {
    let tiktokClient: TikTokClient

    beforeEach(() => {
      tiktokClient = new TikTokClient(mockConfig)
    })

    describe('URL Processing', () => {
      it('should extract content ID from standard TikTok URL', () => {
        const url = 'https://www.tiktok.com/@username/video/1234567890123456789'
        const contentId = tiktokClient.extractContentId(url)
        expect(contentId).toBe('1234567890123456789')
      })

      it('should extract content ID from short TikTok URL', () => {
        const url = 'https://vm.tiktok.com/ZMeFw2xyz'
        const contentId = tiktokClient.extractContentId(url)
        expect(contentId).toBe('ZMeFw2xyz')
      })

      it('should handle URL-encoded TikTok URLs', () => {
        const encodedUrl = encodeURIComponent('https://www.tiktok.com/@user/video/1234567890123456789')
        const contentId = tiktokClient.extractContentId(encodedUrl)
        expect(contentId).toBe('1234567890123456789')
      })

      it('should return null for invalid URLs', () => {
        const invalidUrl = 'https://example.com/not-tiktok'
        const contentId = tiktokClient.extractContentId(invalidUrl)
        expect(contentId).toBeNull()
      })

      it('should validate TikTok URLs correctly', () => {
        expect(tiktokClient.validateUrl('https://www.tiktok.com/@user/video/123')).toBe(true)
        expect(tiktokClient.validateUrl('https://vm.tiktok.com/abc')).toBe(true)
        expect(tiktokClient.validateUrl('https://youtube.com/watch?v=123')).toBe(false)
      })
    })

    describe('Content Fetching', () => {
      it('should fetch TikTok content successfully', async () => {
        // Mock API response
        const mockApiResponse = {
          data: {
            aweme_detail: {
              aweme_id: '1234567890123456789',
              desc: 'Test video description #test #viral',
              author: {
                unique_id: 'testuser',
                nickname: 'Test User',
                custom_verify: '0'
              },
              video: {
                duration: 15000,
                play_addr: {
                  url_list: ['https://example.com/video.mp4']
                },
                cover: {
                  url_list: ['https://example.com/thumbnail.jpg']
                }
              },
              statistics: {
                digg_count: 1000,
                play_count: 50000,
                comment_count: 100,
                share_count: 50
              },
              create_time: 1640995200,
              music: {
                play_url: {
                  uri: 'https://example.com/audio.mp3'
                }
              }
            }
          }
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        } as Response)

        const content = await tiktokClient.fetchContent('1234567890123456789')

        expect(content).toEqual({
          id: '1234567890123456789',
          title: 'Test video description #test #viral',
          description: 'Test video description #test #viral',
          author: 'testuser',
          authorDisplayName: 'Test User',
          authorVerified: false,
          videoUrl: 'https://example.com/video.mp4',
          audioUrl: 'https://example.com/audio.mp3',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
          duration: 15,
          hashtags: ['test', 'viral'],
          mentions: [],
          metrics: {
            likes: 1000,
            views: 50000,
            comments: 100,
            shares: 50,
            saves: 0
          },
          timestamp: '2022-01-01T00:00:00.000Z',
          platform: 'tiktok',
          isVideo: true,
          language: 'en',
          rawData: mockApiResponse
        })

        expect(fetch).toHaveBeenCalledWith(
          'https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/1234567890123456789',
          expect.objectContaining({
            headers: expect.objectContaining({
              'x-rapidapi-key': 'test-rapid-api-key'
            })
          })
        )
      })

      it('should throw error when API key is missing', async () => {
        const clientWithoutKey = new TikTokClient({})
        
        await expect(clientWithoutKey.fetchContent('123')).rejects.toThrow('TikTok client requires RapidAPI key')
      })

      it('should handle API errors gracefully', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)

        await expect(tiktokClient.fetchContent('invalid-id')).rejects.toThrow('TikTok API error: 404 Not Found')
      })
    })

    describe('Video Download', () => {
      it('should download TikTok video successfully', async () => {
        // Mock content fetch
        const mockContent: PlatformContent = {
          id: '123',
          title: 'Test Video',
          description: 'Test',
          author: 'testuser',
          videoUrl: 'https://example.com/video.mp4',
          hashtags: [],
          mentions: [],
          metrics: { likes: 0, views: 0, comments: 0, shares: 0 },
          platform: 'tiktok',
          isVideo: true
        }

        vi.spyOn(tiktokClient, 'fetchContent').mockResolvedValue(mockContent)

        // Mock video download
        const mockVideoBuffer = new ArrayBuffer(1024 * 1024) // 1MB
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'video/mp4']]),
          arrayBuffer: () => Promise.resolve(mockVideoBuffer)
        } as any)

        const result = await tiktokClient.downloadVideo('123')

        expect(result).toEqual({
          buffer: mockVideoBuffer,
          size: 1024 * 1024,
          mimeType: 'video/mp4',
          filename: 'tiktok-123.mp4',
          quality: 'default'
        })
      })

      it('should return null when video URL is missing', async () => {
        const mockContentWithoutVideo: PlatformContent = {
          id: '123',
          title: 'Test',
          description: 'Test',
          author: 'testuser',
          hashtags: [],
          mentions: [],
          metrics: { likes: 0, views: 0, comments: 0, shares: 0 },
          platform: 'tiktok',
          isVideo: false
        }

        vi.spyOn(tiktokClient, 'fetchContent').mockResolvedValue(mockContentWithoutVideo)

        const result = await tiktokClient.downloadVideo('123')
        expect(result).toBeNull()
      })
    })

    describe('Caching', () => {
      it('should use cached data when available', async () => {
        const mockApiResponse = {
          data: {
            aweme_detail: {
              aweme_id: '123',
              desc: 'Cached content',
              author: { unique_id: 'user' },
              video: {},
              statistics: {}
            }
          }
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        } as Response)

        // First call - should make API request
        await tiktokClient.fetchContent('123')
        
        // Second call - should use cache
        await tiktokClient.fetchContent('123')

        expect(fetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('InstagramClient', () => {
    let instagramClient: InstagramClient

    beforeEach(() => {
      instagramClient = new InstagramClient(mockConfig)
    })

    describe('URL Processing', () => {
      it('should extract shortcode from Instagram post URL', () => {
        const url = 'https://www.instagram.com/p/ABC123DEF456/'
        const shortcode = instagramClient.extractContentId(url)
        expect(shortcode).toBe('ABC123DEF456')
      })

      it('should extract shortcode from Instagram reel URL', () => {
        const url = 'https://www.instagram.com/reel/XYZ789ABC123/'
        const shortcode = instagramClient.extractContentId(url)
        expect(shortcode).toBe('XYZ789ABC123')
      })

      it('should validate Instagram URLs correctly', () => {
        expect(instagramClient.validateUrl('https://www.instagram.com/p/ABC123/')).toBe(true)
        expect(instagramClient.validateUrl('https://www.instagram.com/reel/XYZ789/')).toBe(true)
        expect(instagramClient.validateUrl('https://www.instagram.com/user/')).toBe(false)
        expect(instagramClient.validateUrl('https://tiktok.com/@user/video/123')).toBe(false)
      })
    })

    describe('Content Fetching', () => {
      it('should fetch Instagram content successfully', async () => {
        const mockApiResponse = {
          user: {
            username: 'testuser',
            full_name: 'Test User',
            is_verified: true
          },
          caption: {
            text: 'Instagram test post #instagram #test'
          },
          video_versions: [
            {
              url: 'https://example.com/video.mp4',
              bandwidth: 1000000
            }
          ],
          image_versions2: {
            candidates: [
              { url: 'https://example.com/thumbnail.jpg' }
            ]
          },
          video_duration: 30,
          like_count: 500,
          play_count: 10000,
          comment_count: 50,
          taken_at: 1640995200
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        } as Response)

        const content = await instagramClient.fetchContent('ABC123')

        expect(content.platform).toBe('instagram')
        expect(content.author).toBe('testuser')
        expect(content.authorDisplayName).toBe('Test User')
        expect(content.authorVerified).toBe(true)
        expect(content.hashtags).toEqual(['instagram', 'test'])
        expect(content.metrics.likes).toBe(500)
      })

      it('should throw error when API key is missing', async () => {
        const clientWithoutKey = new InstagramClient({})
        
        await expect(clientWithoutKey.fetchContent('ABC123')).rejects.toThrow('Instagram client requires RapidAPI key')
      })
    })
  })

  describe('YouTubeClient', () => {
    let youtubeClient: YouTubeClient

    beforeEach(() => {
      youtubeClient = new YouTubeClient(mockConfig)
    })

    describe('URL Processing', () => {
      it('should extract video ID from standard YouTube URL', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        const videoId = youtubeClient.extractContentId(url)
        expect(videoId).toBe('dQw4w9WgXcQ')
      })

      it('should extract video ID from YouTube short URL', () => {
        const url = 'https://youtu.be/dQw4w9WgXcQ'
        const videoId = youtubeClient.extractContentId(url)
        expect(videoId).toBe('dQw4w9WgXcQ')
      })

      it('should extract video ID from embed URL', () => {
        const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        const videoId = youtubeClient.extractContentId(url)
        expect(videoId).toBe('dQw4w9WgXcQ')
      })

      it('should validate YouTube URLs correctly', () => {
        expect(youtubeClient.validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
        expect(youtubeClient.validateUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
        expect(youtubeClient.validateUrl('https://tiktok.com/@user/video/123')).toBe(false)
      })
    })

    describe('Content Fetching', () => {
      it('should fetch YouTube content using oEmbed', async () => {
        const mockOembedResponse = {
          title: 'Test YouTube Video',
          author_name: 'Test Channel',
          thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOembedResponse)
        } as Response)

        const content = await youtubeClient.fetchContent('dQw4w9WgXcQ')

        expect(content.platform).toBe('youtube')
        expect(content.title).toBe('Test YouTube Video')
        expect(content.author).toBe('Test Channel')
        expect(content.videoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        expect(content.isVideo).toBe(true)
      })

      it('should handle oEmbed API errors', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)

        await expect(youtubeClient.fetchContent('invalid-id')).rejects.toThrow('YouTube oEmbed API error: 404')
      })
    })

    describe('Transcript Fetching', () => {
      it('should fetch transcript successfully', async () => {
        const mockTranscriptResponse = {
          success: true,
          transcript: [
            { text: 'Hello world', offset: 0, duration: 2 },
            { text: 'This is a test', offset: 2, duration: 3 }
          ]
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTranscriptResponse)
        } as Response)

        const transcript = await youtubeClient.getTranscript('dQw4w9WgXcQ')

        expect(transcript).toEqual([
          { text: 'Hello world', start: 0, duration: 2 },
          { text: 'This is a test', start: 2, duration: 3 }
        ])
      })

      it('should return null when transcript fails', async () => {
        const mockErrorResponse = {
          success: false,
          error: 'No transcript available'
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockErrorResponse)
        } as Response)

        const transcript = await youtubeClient.getTranscript('dQw4w9WgXcQ')
        expect(transcript).toBeNull()
      })

      it('should throw error when API key is missing', async () => {
        const clientWithoutKey = new YouTubeClient({})
        
        await expect(clientWithoutKey.getTranscript('dQw4w9WgXcQ')).rejects.toThrow('YouTube transcript requires RapidAPI key')
      })
    })
  })

  describe('SocialPlatformServiceManager', () => {
    let serviceManager: SocialPlatformServiceManager

    beforeEach(() => {
      serviceManager = new SocialPlatformServiceManager(mockConfig)
    })

    describe('Client Management', () => {
      it('should get specific platform client', () => {
        const tiktokClient = serviceManager.getClient('tiktok')
        const instagramClient = serviceManager.getClient('instagram')
        const youtubeClient = serviceManager.getClient('youtube')

        expect(tiktokClient).toBeInstanceOf(TikTokClient)
        expect(instagramClient).toBeInstanceOf(InstagramClient)
        expect(youtubeClient).toBeInstanceOf(YouTubeClient)
      })

      it('should return null for unsupported platform', () => {
        const client = serviceManager.getClient('unsupported')
        expect(client).toBeNull()
      })

      it('should detect platform from URL', () => {
        const tiktokDetection = serviceManager.detectPlatformAndGetClient('https://www.tiktok.com/@user/video/123')
        const instagramDetection = serviceManager.detectPlatformAndGetClient('https://www.instagram.com/reel/ABC123/')
        const youtubeDetection = serviceManager.detectPlatformAndGetClient('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

        expect(tiktokDetection?.platform).toBe('tiktok')
        expect(instagramDetection?.platform).toBe('instagram')
        expect(youtubeDetection?.platform).toBe('youtube')
      })

      it('should return null for unsupported URLs', () => {
        const detection = serviceManager.detectPlatformAndGetClient('https://unsupported.com/video/123')
        expect(detection).toBeNull()
      })
    })

    describe('Universal Content Fetching', () => {
      it('should fetch content from any supported platform', async () => {
        const mockContent: PlatformContent = {
          id: '123',
          title: 'Universal Test',
          description: 'Test',
          author: 'testuser',
          hashtags: [],
          mentions: [],
          metrics: { likes: 0, views: 0, comments: 0, shares: 0 },
          platform: 'tiktok',
          isVideo: true
        }

        // Mock the TikTok client's fetchContent method
        const tiktokClient = serviceManager.getClient('tiktok') as TikTokClient
        vi.spyOn(tiktokClient, 'fetchContent').mockResolvedValue(mockContent)

        const result = await serviceManager.fetchContent('https://www.tiktok.com/@user/video/123')

        expect(result).toEqual(mockContent)
      })

      it('should throw error for unsupported platform', async () => {
        await expect(
          serviceManager.fetchContent('https://unsupported.com/video/123')
        ).rejects.toThrow('Unsupported platform or invalid URL format')
      })

      it('should throw error when content ID extraction fails', async () => {
        await expect(
          serviceManager.fetchContent('https://www.tiktok.com/invalid-url')
        ).rejects.toThrow('Could not extract content ID from tiktok URL')
      })
    })

    describe('Universal Video Download', () => {
      it('should download video from any supported platform', async () => {
        const mockDownloadResult: VideoDownloadResult = {
          buffer: new ArrayBuffer(1024),
          size: 1024,
          mimeType: 'video/mp4',
          filename: 'test.mp4'
        }

        const tiktokClient = serviceManager.getClient('tiktok') as TikTokClient
        vi.spyOn(tiktokClient, 'downloadVideo').mockResolvedValue(mockDownloadResult)

        const result = await serviceManager.downloadVideo('https://www.tiktok.com/@user/video/123')

        expect(result).toEqual(mockDownloadResult)
      })

      it('should throw error for platforms without download support', async () => {
        // Mock a client that doesn't support download
        const mockClient = {
          extractContentId: vi.fn().mockReturnValue('123'),
          validateUrl: vi.fn().mockReturnValue(true),
          fetchContent: vi.fn(),
          getPlatform: vi.fn().mockReturnValue('mock'),
          isConfigured: vi.fn().mockReturnValue(true)
          // Note: no downloadVideo method
        }

        vi.spyOn(serviceManager, 'detectPlatformAndGetClient').mockReturnValue({
          platform: 'mock',
          client: mockClient as any
        })

        await expect(
          serviceManager.downloadVideo('https://mock.com/video/123')
        ).rejects.toThrow('Video download not supported for mock')
      })
    })

    describe('URL Validation', () => {
      it('should validate supported platform URLs', () => {
        const tiktokResult = serviceManager.validateUrl('https://www.tiktok.com/@user/video/123')
        const instagramResult = serviceManager.validateUrl('https://www.instagram.com/reel/ABC123/')
        const youtubeResult = serviceManager.validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

        expect(tiktokResult.valid).toBe(true)
        expect(tiktokResult.platform).toBe('tiktok')

        expect(instagramResult.valid).toBe(true)
        expect(instagramResult.platform).toBe('instagram')

        expect(youtubeResult.valid).toBe(true)
        expect(youtubeResult.platform).toBe('youtube')
      })

      it('should reject invalid URL formats', () => {
        const result = serviceManager.validateUrl('not-a-url')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid URL format')
      })

      it('should reject unsupported platforms', () => {
        const result = serviceManager.validateUrl('https://unsupported.com/video/123')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Unsupported platform. Only TikTok, Instagram, and YouTube are supported.')
      })
    })

    describe('Client Status', () => {
      it('should return status of all clients', () => {
        const status = serviceManager.getClientsStatus()

        expect(status).toHaveLength(3)
        expect(status.map(s => s.platform)).toEqual(['tiktok', 'instagram', 'youtube'])
        
        status.forEach(clientStatus => {
          expect(clientStatus.configured).toBe(true)
          expect(clientStatus.hasRapidApi).toBe(true)
        })
      })
    })
  })

  describe('Factory Function and Singleton', () => {
    it('should create service manager with default config', () => {
      const manager = createSocialPlatformServiceManager()
      expect(manager).toBeInstanceOf(SocialPlatformServiceManager)
    })

    it('should create service manager with custom config', () => {
      const customConfig = {
        rapidApiKey: 'custom-key',
        timeout: 60000
      }
      
      const manager = createSocialPlatformServiceManager(customConfig)
      expect(manager).toBeInstanceOf(SocialPlatformServiceManager)
    })

    it('should export singleton instance', () => {
      expect(socialPlatformService).toBeInstanceOf(SocialPlatformServiceManager)
    })
  })

  describe('Text Processing Utilities', () => {
    let client: TikTokClient

    beforeEach(() => {
      client = new TikTokClient(mockConfig)
    })

    it('should extract hashtags from text', () => {
      const text = 'This is a test #hashtag #another #test123'
      const hashtags = (client as any).extractHashtags(text)
      expect(hashtags).toEqual(['hashtag', 'another', 'test123'])
    })

    it('should extract mentions from text', () => {
      const text = 'Hello @user1 and @user_2 and @test.user'
      const mentions = (client as any).extractMentions(text)
      expect(mentions).toEqual(['user1', 'user_2', 'test.user'])
    })

    it('should clean HTML entities from text', () => {
      const dirtyText = 'This &amp; that, &quot;quoted&quot; &#39;text&#39; &lt;tag&gt;'
      const cleanText = (client as any).cleanText(dirtyText)
      expect(cleanText).toBe('This & that, "quoted" \'text\' <tag>')
    })
  })

  describe('Performance Tests', () => {
    let serviceManager: SocialPlatformServiceManager

    beforeEach(() => {
      serviceManager = new SocialPlatformServiceManager(mockConfig)
    })

    it('should handle concurrent platform detection', async () => {
      const urls = [
        'https://www.tiktok.com/@user1/video/123',
        'https://www.instagram.com/reel/ABC123/',
        'https://www.youtube.com/watch?v=video1',
        'https://www.tiktok.com/@user2/video/456',
        'https://www.instagram.com/p/DEF456/'
      ]

      const { duration, result: results } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          urls.map(url => {
            const detection = serviceManager.detectPlatformAndGetClient(url)
            return detection ? detection.platform : null
          })
        )
      })

      expect(results).toEqual(['tiktok', 'instagram', 'youtube', 'tiktok', 'instagram'])
      global.performanceUtils.expectPerformance(duration, 100, 'Concurrent platform detection')
    })

    it('should validate multiple URLs efficiently', async () => {
      const urls = Array.from({ length: 50 }, (_, i) => 
        `https://www.tiktok.com/@user${i}/video/${1000000000000000000 + i}`
      )

      const { duration, result: results } = await global.performanceUtils.measureTime(async () => {
        return urls.map(url => serviceManager.validateUrl(url))
      })

      expect(results.every(r => r.valid)).toBe(true)
      expect(results.every(r => r.platform === 'tiktok')).toBe(true)
      global.performanceUtils.expectPerformance(duration, 200, 'Bulk URL validation')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    let serviceManager: SocialPlatformServiceManager

    beforeEach(() => {
      serviceManager = new SocialPlatformServiceManager(mockConfig)
    })

    it('should handle network timeouts gracefully', async () => {
      vi.mocked(fetch).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )

      await expect(
        serviceManager.fetchContent('https://www.tiktok.com/@user/video/123')
      ).rejects.toThrow('Failed to fetch TikTok content: Network timeout')
    })

    it('should handle malformed API responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      } as Response)

      const tiktokClient = serviceManager.getClient('tiktok') as TikTokClient
      const result = await tiktokClient.fetchContent('123')

      // Should still create a valid content object even with malformed response
      expect(result.platform).toBe('tiktok')
      expect(result.id).toBe('123')
    })

    it('should handle empty or null responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null)
      } as Response)

      const tiktokClient = serviceManager.getClient('tiktok') as TikTokClient
      const result = await tiktokClient.fetchContent('123')

      expect(result.platform).toBe('tiktok')
      expect(result.id).toBe('123')
    })

    it('should handle special characters in URLs', () => {
      const urlWithSpecialChars = 'https://www.tiktok.com/@user_name-123/video/1234567890123456789?lang=en&foo=bar'
      const detection = serviceManager.detectPlatformAndGetClient(urlWithSpecialChars)
      
      expect(detection?.platform).toBe('tiktok')
    })

    it('should handle very long content descriptions', async () => {
      const longDescription = 'A'.repeat(10000) + ' #test'
      const mockApiResponse = {
        data: {
          aweme_detail: {
            aweme_id: '123',
            desc: longDescription,
            author: { unique_id: 'user' },
            video: {},
            statistics: {}
          }
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      } as Response)

      const tiktokClient = serviceManager.getClient('tiktok') as TikTokClient
      const result = await tiktokClient.fetchContent('123')

      expect(result.description).toBe(longDescription)
      expect(result.hashtags).toEqual(['test'])
    })
  })
})