/**
 * Simplified VideoProcessingService Tests
 * 
 * Tests basic video processing functionality without deep service mocking
 */

import { describe, it, expect, vi } from 'vitest'

// Mock all the service dependencies at the module level
vi.mock('@/services/video-download-service', () => ({
  VideoDownloadService: vi.fn().mockImplementation(() => ({
    downloadVideo: vi.fn(),
    getSupportedPlatforms: vi.fn(() => ['youtube', 'tiktok', 'instagram']),
    validateUrl: vi.fn(),
    detectPlatform: vi.fn()
  }))
}))

vi.mock('@/services/cdn-service', () => ({
  CDNService: vi.fn().mockImplementation(() => ({
    uploadBuffer: vi.fn(),
    streamFromUrl: vi.fn(),
    generateThumbnailUrl: vi.fn(),
    generatePreviewUrl: vi.fn()
  }))
}))

vi.mock('@/services/transcription-service', () => ({
  TranscriptionService: vi.fn().mockImplementation(() => ({
    transcribeFromUrl: vi.fn(),
    transcribeFromBuffer: vi.fn()
  }))
}))

vi.mock('@/services/ai-analysis-service', () => ({
  AIAnalysisService: vi.fn().mockImplementation(() => ({
    analyzeScriptComponents: vi.fn(),
    performCompleteAnalysis: vi.fn()
  }))
}))

vi.mock('@/services/background-job-service', () => ({
  BackgroundJobService: vi.fn().mockImplementation(() => ({
    startBackgroundTranscription: vi.fn(),
    getJobStatus: vi.fn()
  }))
}))

// Now import the service after mocking
import { VideoProcessingService } from '@/services/video-processing-service'

describe('VideoProcessingService', () => {
  
  it('should create VideoProcessingService instance', () => {
    // This basic test verifies that the service can be instantiated
    // with mocked dependencies
    expect(() => {
      const mockVideoDownload = {} as any
      const mockCDN = {} as any
      const mockTranscription = {} as any
      const mockAI = {} as any
      const mockBackground = {} as any
      
      const service = new VideoProcessingService(
        mockVideoDownload,
        mockCDN,
        mockTranscription,
        mockAI,
        mockBackground
      )
      
      expect(service).toBeDefined()
    }).not.toThrow()
  })

  it('should have processVideo method', () => {
    const mockVideoDownload = {} as any
    const mockCDN = {} as any
    const mockTranscription = {} as any
    const mockAI = {} as any
    const mockBackground = {} as any
    
    const service = new VideoProcessingService(
      mockVideoDownload,
      mockCDN,
      mockTranscription,
      mockAI,
      mockBackground
    )
    
    expect(service.processVideo).toBeDefined()
    expect(typeof service.processVideo).toBe('function')
  })

  it('should define video processing interfaces', () => {
    // Test that the types are properly defined
    const mockVideoDownload = {} as any
    const mockCDN = {} as any
    const mockTranscription = {} as any
    const mockAI = {} as any
    const mockBackground = {} as any
    
    const service = new VideoProcessingService(
      mockVideoDownload,
      mockCDN,
      mockTranscription,
      mockAI,
      mockBackground
    )
    
    expect(service).toHaveProperty('processVideo')
  })
})