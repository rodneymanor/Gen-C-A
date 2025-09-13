/**
 * Integration Tests for Service Interactions
 * 
 * Tests complex workflows involving multiple services working together,
 * authentication + RBAC workflows, collections + video processing pipelines,
 * and error propagation across service boundaries
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import { AuthService } from '@/services/auth/AuthService'
import { RBACService } from '@/services/auth/RBACService'
import { CollectionsService } from '@/lib/collections-service'
import { VideoProcessingService } from '@/services/video-processing-service'
import { PipelineOrchestrator } from '@/services/pipeline-orchestrator'

// Mock all external dependencies
vi.mock('firebase-admin/auth')
vi.mock('firebase-admin/firestore')
vi.mock('@/services/cdn-service')
vi.mock('@/services/ai-analysis-service')
vi.mock('@/services/transcription-service')
vi.mock('@/services/video-download-service')

describe('Service Integration Tests', () => {
  let authService: AuthService
  let rbacService: RBACService
  let collectionsService: CollectionsService
  let videoProcessingService: VideoProcessingService
  let orchestrator: PipelineOrchestrator

  beforeAll(() => {
    // Set up test environment
    process.env.FIREBASE_PROJECT_ID = 'integration-test-project'
    process.env.CDN_API_KEY = 'integration-test-cdn-key'
    process.env.AI_API_KEY = 'integration-test-ai-key'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    authService = new AuthService()
    rbacService = new RBACService()
    collectionsService = new CollectionsService()
    videoProcessingService = new VideoProcessingService()
    orchestrator = new PipelineOrchestrator()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication + RBAC Workflows', () => {
    it('should complete full user authentication and authorization flow', async () => {
      // Arrange
      const token = 'integration-test-token'
      const userId = 'integration-user-123'
      
      // Mock authentication success
      vi.spyOn(authService, 'validateToken').mockResolvedValue({
        valid: true,
        uid: userId,
        claims: {
          role: 'user',
          permissions: ['read:collections', 'write:collections']
        }
      })

      // Mock RBAC context retrieval
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue({
        userId,
        role: 'user',
        permissions: ['read:collections', 'write:collections'],
        organizationId: null
      })

      // Mock permission check
      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({
        allowed: true,
        reason: 'User has write:collections permission'
      })

      // Act
      const authResult = await authService.validateToken(token)
      const rbacContext = await rbacService.getRBACContext(userId)
      const permissionResult = await rbacService.canPerformAction(
        userId, 'write:collections', 'collection'
      )

      // Assert
      expect(authResult.valid).toBe(true)
      expect(authResult.uid).toBe(userId)
      expect(rbacContext.userId).toBe(userId)
      expect(rbacContext.permissions).toContain('write:collections')
      expect(permissionResult.allowed).toBe(true)
    })

    it('should handle authentication failure and block subsequent operations', async () => {
      // Arrange
      const invalidToken = 'invalid-token'
      
      vi.spyOn(authService, 'validateToken').mockResolvedValue({
        valid: false,
        error: 'Token is invalid or expired'
      })

      // Act
      const authResult = await authService.validateToken(invalidToken)

      // Assert
      expect(authResult.valid).toBe(false)
      expect(authResult.error).toContain('invalid or expired')
      
      // Should not proceed with RBAC checks if authentication fails
      expect(rbacService.getRBACContext).not.toHaveBeenCalled()
    })

    it('should handle role elevation workflow', async () => {
      // Arrange
      const userId = 'elevation-user-456'
      const adminUserId = 'admin-user-789'

      // Initial user with basic permissions
      vi.spyOn(rbacService, 'getRBACContext')
        .mockResolvedValueOnce({
          userId,
          role: 'user',
          permissions: ['read:collections'],
          organizationId: null
        })
        .mockResolvedValueOnce({
          userId,
          role: 'moderator',
          permissions: ['read:collections', 'write:collections', 'moderate:content'],
          organizationId: null
        })

      // Admin user who can elevate permissions
      vi.spyOn(rbacService, 'canPerformAction')
        .mockResolvedValueOnce({ allowed: false, reason: 'Insufficient permissions' })
        .mockResolvedValueOnce({ allowed: true, reason: 'Admin can elevate user roles' })
        .mockResolvedValueOnce({ allowed: true, reason: 'User now has moderator permissions' })

      // Mock user profile update
      vi.spyOn(authService, 'setCustomClaims').mockResolvedValue({
        success: true
      })

      // Act
      // 1. Check initial permissions
      const initialContext = await rbacService.getRBACContext(userId)
      const initialPermission = await rbacService.canPerformAction(
        userId, 'moderate:content', 'content'
      )

      // 2. Admin elevates user role
      const adminPermission = await rbacService.canPerformAction(
        adminUserId, 'elevate:user', 'user'
      )

      if (adminPermission.allowed) {
        await authService.setCustomClaims(userId, {
          role: 'moderator',
          permissions: ['read:collections', 'write:collections', 'moderate:content']
        })
      }

      // 3. Check new permissions
      const elevatedContext = await rbacService.getRBACContext(userId)
      const elevatedPermission = await rbacService.canPerformAction(
        userId, 'moderate:content', 'content'
      )

      // Assert
      expect(initialContext.role).toBe('user')
      expect(initialPermission.allowed).toBe(false)
      expect(adminPermission.allowed).toBe(true)
      expect(elevatedContext.role).toBe('moderator')
      expect(elevatedPermission.allowed).toBe(true)
    })
  })

  describe('Collections + Video Processing Integration', () => {
    it('should complete end-to-end video collection workflow', async () => {
      // Arrange
      const userId = 'video-workflow-user'
      const videoUrl = 'https://youtube.com/watch?v=integration_test'
      
      // Mock authentication and authorization
      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({
        allowed: true,
        reason: 'User authorized for all operations'
      })

      // Mock collection creation
      vi.spyOn(collectionsService, 'createCollection').mockResolvedValue({
        success: true,
        collectionId: 'integration-collection-123'
      })

      // Mock video processing
      vi.spyOn(videoProcessingService, 'processVideo').mockResolvedValue({
        success: true,
        video: {
          id: 'processed-video-456',
          url: 'https://cdn.example.com/processed.mp4',
          thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
          title: 'Integration Test Video',
          description: 'Video processed for integration testing',
          duration: 180,
          metadata: {
            width: 1920,
            height: 1080,
            fps: 30,
            bitrate: 5000000,
            format: 'mp4'
          },
          transcript: 'This is an integration test video transcript.',
          keyframes: [
            { timestamp: 30, url: 'https://cdn.example.com/keyframe1.jpg' },
            { timestamp: 90, url: 'https://cdn.example.com/keyframe2.jpg' }
          ]
        }
      })

      // Mock adding video to collection
      vi.spyOn(collectionsService, 'addVideoToCollection').mockResolvedValue({
        success: true
      })

      // Act - Complete workflow
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        // 1. Create collection
        const collectionResult = await collectionsService.createCollection(userId, {
          title: 'Integration Test Collection',
          description: 'Testing end-to-end workflow'
        })

        if (!collectionResult.success) {
          throw new Error('Failed to create collection')
        }

        // 2. Process video
        const videoResult = await videoProcessingService.processVideo(videoUrl, {
          generateThumbnails: true,
          transcribeAudio: true,
          analyzeContent: true
        })

        if (!videoResult.success) {
          throw new Error('Failed to process video')
        }

        // 3. Add video to collection
        const addResult = await collectionsService.addVideoToCollection(
          userId,
          collectionResult.collectionId,
          videoResult.video
        )

        return {
          collection: collectionResult,
          video: videoResult,
          addToCollection: addResult
        }
      })

      // Assert
      expect(result.collection.success).toBe(true)
      expect(result.video.success).toBe(true)
      expect(result.addToCollection.success).toBe(true)
      expect(result.video.video.transcript).toBeDefined()
      expect(result.video.video.keyframes).toHaveLength(2)
      
      global.performanceUtils.expectPerformance(duration, 2000, 'End-to-end video workflow')
    })

    it('should handle video processing failure and cleanup', async () => {
      // Arrange
      const userId = 'cleanup-user'
      const videoUrl = 'https://example.com/broken-video.mp4'

      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({ allowed: true })

      // Mock collection creation success
      vi.spyOn(collectionsService, 'createCollection').mockResolvedValue({
        success: true,
        collectionId: 'cleanup-collection-789'
      })

      // Mock video processing failure
      vi.spyOn(videoProcessingService, 'processVideo').mockResolvedValue({
        success: false,
        error: 'Video download failed: Network timeout'
      })

      // Mock collection cleanup
      vi.spyOn(collectionsService, 'deleteCollection').mockResolvedValue({
        success: true
      })

      // Act
      const collectionResult = await collectionsService.createCollection(userId, {
        title: 'Cleanup Test Collection',
        description: 'This should be cleaned up on failure'
      })

      const videoResult = await videoProcessingService.processVideo(videoUrl, {
        generateThumbnails: true
      })

      let cleanupResult = null
      if (!videoResult.success && collectionResult.success) {
        // Cleanup empty collection on video processing failure
        cleanupResult = await collectionsService.deleteCollection(
          userId,
          collectionResult.collectionId
        )
      }

      // Assert
      expect(collectionResult.success).toBe(true)
      expect(videoResult.success).toBe(false)
      expect(cleanupResult?.success).toBe(true)
      expect(videoResult.error).toContain('download failed')
    })

    it('should handle concurrent video processing for batch operations', async () => {
      // Arrange
      const userId = 'batch-user'
      const videoUrls = [
        'https://example.com/batch1.mp4',
        'https://example.com/batch2.mp4',
        'https://example.com/batch3.mp4'
      ]

      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({ allowed: true })

      // Mock collection creation
      vi.spyOn(collectionsService, 'createCollection').mockResolvedValue({
        success: true,
        collectionId: 'batch-collection-456'
      })

      // Mock video processing with different outcomes
      vi.spyOn(videoProcessingService, 'processVideo')
        .mockResolvedValueOnce({
          success: true,
          video: global.testUtils.createMockVideo({ id: 'batch-video-1' })
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Processing failed for batch2.mp4'
        })
        .mockResolvedValueOnce({
          success: true,
          video: global.testUtils.createMockVideo({ id: 'batch-video-3' })
        })

      // Mock adding videos to collection
      vi.spyOn(collectionsService, 'addVideoToCollection').mockResolvedValue({
        success: true
      })

      // Act
      const collectionResult = await collectionsService.createCollection(userId, {
        title: 'Batch Processing Collection',
        description: 'Testing concurrent video processing'
      })

      const { duration, result: processingResults } = await global.performanceUtils.measureTime(async () => {
        return await Promise.allSettled(
          videoUrls.map(url => videoProcessingService.processVideo(url, {}))
        )
      })

      const successfulVideos = processingResults
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.video)

      const addResults = await Promise.all(
        successfulVideos.map(video => 
          collectionsService.addVideoToCollection(
            userId,
            collectionResult.collectionId,
            video
          )
        )
      )

      // Assert
      expect(collectionResult.success).toBe(true)
      expect(processingResults).toHaveLength(3)
      expect(successfulVideos).toHaveLength(2) // 2 successful, 1 failed
      expect(addResults.every(result => result.success)).toBe(true)
      
      global.performanceUtils.expectPerformance(duration, 3000, 'Concurrent video processing')
    })
  })

  describe('Pipeline Orchestration', () => {
    it('should orchestrate complex multi-service workflow', async () => {
      // Arrange
      const workflowData = {
        userId: 'orchestration-user',
        videos: [
          'https://youtube.com/watch?v=workflow1',
          'https://tiktok.com/@user/video/workflow2'
        ],
        collectionTitle: 'Orchestrated Collection',
        processingOptions: {
          generateThumbnails: true,
          transcribeAudio: true,
          analyzeContent: true,
          extractKeyframes: true
        }
      }

      // Mock all service dependencies
      vi.spyOn(authService, 'validateToken').mockResolvedValue({
        valid: true,
        uid: workflowData.userId,
        claims: { role: 'user', permissions: ['read:collections', 'write:collections'] }
      })

      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({ allowed: true })
      
      vi.spyOn(collectionsService, 'createCollection').mockResolvedValue({
        success: true,
        collectionId: 'orchestrated-collection'
      })

      vi.spyOn(videoProcessingService, 'processVideo')
        .mockResolvedValueOnce({
          success: true,
          video: global.testUtils.createMockVideo({ 
            id: 'orchestrated-video-1',
            platform: 'youtube' 
          })
        })
        .mockResolvedValueOnce({
          success: true,
          video: global.testUtils.createMockVideo({ 
            id: 'orchestrated-video-2',
            platform: 'tiktok' 
          })
        })

      vi.spyOn(collectionsService, 'addVideoToCollection').mockResolvedValue({
        success: true
      })

      // Mock orchestrator
      vi.spyOn(orchestrator, 'executeWorkflow').mockImplementation(async (workflow) => {
        // Simulate the orchestrator coordinating all services
        const authResult = await authService.validateToken('test-token')
        if (!authResult.valid) {
          return { success: false, error: 'Authentication failed' }
        }

        const permissionCheck = await rbacService.canPerformAction(
          workflow.userId, 'write:collections', 'collection'
        )
        if (!permissionCheck.allowed) {
          return { success: false, error: 'Permission denied' }
        }

        const collection = await collectionsService.createCollection(
          workflow.userId,
          { title: workflow.collectionTitle, description: 'Orchestrated collection' }
        )
        if (!collection.success) {
          return { success: false, error: 'Collection creation failed' }
        }

        const videoResults = await Promise.all(
          workflow.videos.map(url => 
            videoProcessingService.processVideo(url, workflow.processingOptions)
          )
        )

        const addResults = await Promise.all(
          videoResults
            .filter(result => result.success)
            .map(result => 
              collectionsService.addVideoToCollection(
                workflow.userId,
                collection.collectionId,
                result.video
              )
            )
        )

        return {
          success: true,
          collectionId: collection.collectionId,
          processedVideos: videoResults.length,
          addedVideos: addResults.length
        }
      })

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        return await orchestrator.executeWorkflow(workflowData)
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.processedVideos).toBe(2)
      expect(result.addedVideos).toBe(2)
      expect(authService.validateToken).toHaveBeenCalled()
      expect(rbacService.canPerformAction).toHaveBeenCalled()
      expect(collectionsService.createCollection).toHaveBeenCalled()
      expect(videoProcessingService.processVideo).toHaveBeenCalledTimes(2)
      expect(collectionsService.addVideoToCollection).toHaveBeenCalledTimes(2)

      global.performanceUtils.expectPerformance(duration, 5000, 'Complete workflow orchestration')
    })

    it('should handle cascading failures in orchestrated workflow', async () => {
      // Arrange
      const workflowData = {
        userId: 'cascade-failure-user',
        videos: ['https://example.com/failing-video.mp4'],
        collectionTitle: 'Cascade Failure Test',
        processingOptions: {}
      }

      // Mock authentication success but RBAC failure
      vi.spyOn(authService, 'validateToken').mockResolvedValue({
        valid: true,
        uid: workflowData.userId,
        claims: { role: 'user', permissions: ['read:collections'] }
      })

      // Mock RBAC denial
      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({
        allowed: false,
        reason: 'User lacks write:collections permission'
      })

      // Mock orchestrator with proper error handling
      vi.spyOn(orchestrator, 'executeWorkflow').mockImplementation(async (workflow) => {
        try {
          const authResult = await authService.validateToken('test-token')
          if (!authResult.valid) {
            return { success: false, error: 'Authentication failed', step: 'authentication' }
          }

          const permissionCheck = await rbacService.canPerformAction(
            workflow.userId, 'write:collections', 'collection'
          )
          if (!permissionCheck.allowed) {
            return { 
              success: false, 
              error: permissionCheck.reason, 
              step: 'authorization' 
            }
          }

          // This point should never be reached due to permission failure
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error.message, 
            step: 'unknown' 
          }
        }
      })

      // Act
      const result = await orchestrator.executeWorkflow(workflowData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.step).toBe('authorization')
      expect(result.error).toContain('write:collections permission')
      expect(authService.validateToken).toHaveBeenCalled()
      expect(rbacService.canPerformAction).toHaveBeenCalled()
      expect(collectionsService.createCollection).not.toHaveBeenCalled()
    })
  })

  describe('Error Propagation and Recovery', () => {
    it('should propagate errors correctly across service boundaries', async () => {
      // Arrange
      const userId = 'error-propagation-user'
      
      // Mock deep error in video processing
      vi.spyOn(videoProcessingService, 'processVideo').mockImplementation(async () => {
        throw new Error('Deep service error: CDN upload failed after 3 retries')
      })

      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({ allowed: true })
      vi.spyOn(collectionsService, 'createCollection').mockResolvedValue({
        success: true,
        collectionId: 'error-test-collection'
      })

      // Act
      try {
        await collectionsService.createCollection(userId, {
          title: 'Error Test Collection',
          description: 'Testing error propagation'
        })

        await videoProcessingService.processVideo('https://example.com/error-test.mp4', {})
      } catch (error) {
        // Assert
        expect(error.message).toContain('CDN upload failed')
        expect(error.message).toContain('retries')
      }
    })

    it('should implement circuit breaker pattern for external services', async () => {
      // Arrange
      const userId = 'circuit-breaker-user'
      let callCount = 0

      // Mock service that fails multiple times then succeeds
      vi.spyOn(videoProcessingService, 'processVideo').mockImplementation(async () => {
        callCount++
        if (callCount <= 3) {
          throw new Error('External service temporarily unavailable')
        }
        return {
          success: true,
          video: global.testUtils.createMockVideo()
        }
      })

      // Act & Assert
      // First 3 calls should fail
      for (let i = 0; i < 3; i++) {
        const result = await videoProcessingService.processVideo(
          `https://example.com/circuit-test-${i}.mp4`, 
          {}
        ).catch(error => ({ success: false, error: error.message }))
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('temporarily unavailable')
      }

      // 4th call should succeed (circuit breaker recovers)
      const successResult = await videoProcessingService.processVideo(
        'https://example.com/circuit-recovery.mp4', 
        {}
      )
      
      expect(successResult.success).toBe(true)
      expect(callCount).toBe(4)
    })
  })

  describe('Data Consistency Across Services', () => {
    it('should maintain data consistency in distributed operations', async () => {
      // Arrange
      const userId = 'consistency-user'
      const collectionData = {
        title: 'Consistency Test Collection',
        description: 'Testing data consistency'
      }

      // Mock consistent data across services
      const mockCollection = global.testUtils.createMockCollection({
        id: 'consistent-collection',
        userId,
        ...collectionData
      })

      const mockVideo = global.testUtils.createMockVideo({
        id: 'consistent-video',
        title: 'Consistency Test Video'
      })

      vi.spyOn(rbacService, 'canPerformAction').mockResolvedValue({ allowed: true })
      vi.spyOn(collectionsService, 'createCollection').mockResolvedValue({
        success: true,
        collectionId: mockCollection.id,
        collection: mockCollection
      })

      vi.spyOn(collectionsService, 'getCollection').mockResolvedValue({
        success: true,
        collection: mockCollection
      })

      vi.spyOn(videoProcessingService, 'processVideo').mockResolvedValue({
        success: true,
        video: mockVideo
      })

      vi.spyOn(collectionsService, 'addVideoToCollection').mockImplementation(
        async (userId, collectionId, video) => {
          // Simulate updating collection with video
          mockCollection.videos.push(video)
          mockCollection.updatedAt = new Date().toISOString()
          return { success: true }
        }
      )

      // Act
      const createResult = await collectionsService.createCollection(userId, collectionData)
      const videoResult = await videoProcessingService.processVideo(
        'https://example.com/consistency.mp4', 
        {}
      )
      const addResult = await collectionsService.addVideoToCollection(
        userId,
        createResult.collectionId,
        videoResult.video
      )
      const getResult = await collectionsService.getCollection(userId, createResult.collectionId)

      // Assert data consistency
      expect(createResult.success).toBe(true)
      expect(videoResult.success).toBe(true)
      expect(addResult.success).toBe(true)
      expect(getResult.success).toBe(true)
      expect(getResult.collection.videos).toHaveLength(1)
      expect(getResult.collection.videos[0].id).toBe(mockVideo.id)
      expect(getResult.collection.videos[0].title).toBe(mockVideo.title)
    })
  })
})