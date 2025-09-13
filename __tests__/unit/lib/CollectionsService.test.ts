/**
 * Comprehensive Unit Tests for CollectionsService
 * 
 * Tests CRUD operations, RBAC integration, data validation,
 * video management, and error scenarios
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import { CollectionsService } from '@/lib/collections-service'
import { RBACService } from '@/services/auth/RBACService'
import type { 
  Collection, 
  Video, 
  CollectionCreateData,
  CollectionUpdateData,
  CollectionFilters 
} from '@/lib/collections-service-interface'

// Mock Firestore operations
const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      onSnapshot: vi.fn()
    })),
    add: vi.fn(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn()
  })),
  doc: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  })),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn()
  })),
  runTransaction: vi.fn()
}

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
  FieldValue: {
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
    serverTimestamp: vi.fn()
  }
}))

// Mock RBACService
const mockRBACService = {
  canPerformAction: vi.fn(),
  getRBACContext: vi.fn(),
  filterUserCollections: vi.fn(),
  buildCollectionsQuery: vi.fn()
}

vi.mock('@/services/auth/RBACService', () => ({
  RBACService: vi.fn(() => mockRBACService)
}))

describe('CollectionsService', () => {
  let collectionsService: CollectionsService
  
  beforeAll(() => {
    process.env.FIREBASE_PROJECT_ID = 'test-project'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    collectionsService = new CollectionsService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Collection CRUD Operations', () => {
    it('should create collection successfully', async () => {
      // Arrange
      const userId = 'creator-user-123'
      const collectionData: CollectionCreateData = {
        title: 'Test Collection',
        description: 'Test collection description',
        isPublic: false,
        tags: ['test', 'demo']
      }
      
      const mockDocRef = { id: 'new-collection-123' }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.collection().add.mockResolvedValue(mockDocRef)

      // Act
      const result = await collectionsService.createCollection(userId, collectionData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.collectionId).toBe('new-collection-123')
      expect(mockRBACService.canPerformAction).toHaveBeenCalledWith(
        userId, 'write:collections', 'collection'
      )
      expect(mockFirestore.collection().add).toHaveBeenCalledWith({
        title: collectionData.title,
        description: collectionData.description,
        userId,
        isPublic: collectionData.isPublic,
        tags: collectionData.tags,
        videos: [],
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object)
      })
    })

    it('should deny collection creation without permission', async () => {
      // Arrange
      const userId = 'unauthorized-user'
      const collectionData: CollectionCreateData = {
        title: 'Denied Collection',
        description: 'Should not be created'
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ 
        allowed: false, 
        reason: 'Permission denied'
      })

      // Act
      const result = await collectionsService.createCollection(userId, collectionData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Permission denied')
      expect(mockFirestore.collection().add).not.toHaveBeenCalled()
    })

    it('should get collection successfully', async () => {
      // Arrange
      const userId = 'getter-user-123'
      const collectionId = 'existing-collection-456'
      
      const mockCollection = global.testUtils.createMockCollection({
        id: collectionId,
        userId: userId,
        title: 'Existing Collection'
      })
      
      const mockDoc = {
        exists: true,
        id: collectionId,
        data: () => mockCollection
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().get.mockResolvedValue(mockDoc)

      // Act
      const result = await collectionsService.getCollection(userId, collectionId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.collection).toEqual({ ...mockCollection, id: collectionId })
      expect(mockRBACService.canPerformAction).toHaveBeenCalledWith(
        userId, 'read:collections', 'collection'
      )
    })

    it('should handle non-existent collection', async () => {
      // Arrange
      const userId = 'user-123'
      const collectionId = 'non-existent-collection'
      
      const mockDoc = {
        exists: false,
        data: () => null
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().get.mockResolvedValue(mockDoc)

      // Act
      const result = await collectionsService.getCollection(userId, collectionId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should update collection successfully', async () => {
      // Arrange
      const userId = 'updater-user-123'
      const collectionId = 'update-collection-789'
      const updateData: CollectionUpdateData = {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated', 'test']
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().update.mockResolvedValue(undefined)

      // Act
      const result = await collectionsService.updateCollection(userId, collectionId, updateData)

      // Assert
      expect(result.success).toBe(true)
      expect(mockFirestore.doc().update).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Object)
      })
    })

    it('should delete collection successfully', async () => {
      // Arrange
      const userId = 'deleter-user-123'
      const collectionId = 'delete-collection-999'
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().delete.mockResolvedValue(undefined)

      // Act
      const result = await collectionsService.deleteCollection(userId, collectionId)

      // Assert
      expect(result.success).toBe(true)
      expect(mockFirestore.doc().delete).toHaveBeenCalled()
      expect(mockRBACService.canPerformAction).toHaveBeenCalledWith(
        userId, 'delete:collections', 'collection'
      )
    })
  })

  describe('Video Management', () => {
    it('should add video to collection successfully', async () => {
      // Arrange
      const userId = 'video-user-123'
      const collectionId = 'video-collection-456'
      const videoData = global.testUtils.createMockVideo({
        title: 'Test Video',
        url: 'https://example.com/video.mp4'
      })
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().update.mockResolvedValue(undefined)

      // Act
      const result = await collectionsService.addVideoToCollection(
        userId, collectionId, videoData
      )

      // Assert
      expect(result.success).toBe(true)
      expect(mockFirestore.doc().update).toHaveBeenCalledWith({
        videos: expect.anything(), // arrayUnion call
        updatedAt: expect.any(Object)
      })
    })

    it('should remove video from collection successfully', async () => {
      // Arrange
      const userId = 'video-user-123'
      const collectionId = 'video-collection-456'
      const videoId = 'video-to-remove-789'
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().update.mockResolvedValue(undefined)

      // Act
      const result = await collectionsService.removeVideoFromCollection(
        userId, collectionId, videoId
      )

      // Assert
      expect(result.success).toBe(true)
      expect(mockFirestore.doc().update).toHaveBeenCalled()
    })

    it('should update video metadata in collection', async () => {
      // Arrange
      const userId = 'metadata-user-123'
      const collectionId = 'metadata-collection-456'
      const videoId = 'metadata-video-789'
      const metadata = {
        title: 'Updated Video Title',
        description: 'Updated description',
        tags: ['updated']
      }
      
      const mockCollection = global.testUtils.createMockCollection({
        id: collectionId,
        userId,
        videos: [
          global.testUtils.createMockVideo({ id: videoId, title: 'Old Title' })
        ]
      })
      
      const mockDoc = {
        exists: true,
        id: collectionId,
        data: () => mockCollection
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().get.mockResolvedValue(mockDoc)
      mockFirestore.doc().update.mockResolvedValue(undefined)

      // Act
      const result = await collectionsService.updateVideoInCollection(
        userId, collectionId, videoId, metadata
      )

      // Assert
      expect(result.success).toBe(true)
      expect(mockFirestore.doc().update).toHaveBeenCalled()
    })

    it('should handle video not found in collection', async () => {
      // Arrange
      const userId = 'user-123'
      const collectionId = 'collection-456'
      const videoId = 'non-existent-video'
      const metadata = { title: 'Updated Title' }
      
      const mockCollection = global.testUtils.createMockCollection({
        id: collectionId,
        userId,
        videos: [] // Empty videos array
      })
      
      const mockDoc = {
        exists: true,
        id: collectionId,
        data: () => mockCollection
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().get.mockResolvedValue(mockDoc)

      // Act
      const result = await collectionsService.updateVideoInCollection(
        userId, collectionId, videoId, metadata
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Video not found')
    })
  })

  describe('Collection Querying and Filtering', () => {
    it('should get user collections with RBAC filtering', async () => {
      // Arrange
      const userId = 'query-user-123'
      const mockCollections = [
        global.testUtils.createMockCollection({ id: 'col1', userId, isPublic: false }),
        global.testUtils.createMockCollection({ id: 'col2', userId: 'other-user', isPublic: true }),
        global.testUtils.createMockCollection({ id: 'col3', userId, isPublic: true })
      ]
      
      const mockQuerySnapshot = {
        docs: mockCollections.map(col => ({
          id: col.id,
          data: () => col
        }))
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockRBACService.buildCollectionsQuery.mockResolvedValue({
        get: vi.fn().mockResolvedValue(mockQuerySnapshot)
      })
      mockRBACService.filterUserCollections.mockResolvedValue(mockCollections)

      // Act
      const result = await collectionsService.getUserCollections(userId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.collections).toHaveLength(3)
      expect(mockRBACService.buildCollectionsQuery).toHaveBeenCalledWith(userId)
      expect(mockRBACService.filterUserCollections).toHaveBeenCalledWith(
        userId, 
        expect.any(Array)
      )
    })

    it('should search collections with filters', async () => {
      // Arrange
      const userId = 'search-user-123'
      const filters: CollectionFilters = {
        title: 'Test',
        tags: ['demo'],
        isPublic: true
      }
      
      const mockCollections = [
        global.testUtils.createMockCollection({
          id: 'search1',
          title: 'Test Collection 1',
          tags: ['demo', 'test'],
          isPublic: true
        }),
        global.testUtils.createMockCollection({
          id: 'search2',
          title: 'Test Collection 2',
          tags: ['demo'],
          isPublic: true
        })
      ]
      
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          docs: mockCollections.map(col => ({
            id: col.id,
            data: () => col
          }))
        })
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.collection.mockReturnValue(mockQuery)
      mockRBACService.filterUserCollections.mockResolvedValue(mockCollections)

      // Act
      const result = await collectionsService.searchCollections(userId, filters)

      // Assert
      expect(result.success).toBe(true)
      expect(result.collections).toHaveLength(2)
      expect(mockQuery.where).toHaveBeenCalledWith('isPublic', '==', true)
    })

    it('should get public collections', async () => {
      // Arrange
      const mockPublicCollections = [
        global.testUtils.createMockCollection({
          id: 'pub1',
          title: 'Public Collection 1',
          isPublic: true
        }),
        global.testUtils.createMockCollection({
          id: 'pub2',
          title: 'Public Collection 2',
          isPublic: true
        })
      ]
      
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          docs: mockPublicCollections.map(col => ({
            id: col.id,
            data: () => col
          }))
        })
      }
      
      mockFirestore.collection.mockReturnValue(mockQuery)

      // Act
      const result = await collectionsService.getPublicCollections()

      // Assert
      expect(result.success).toBe(true)
      expect(result.collections).toHaveLength(2)
      expect(mockQuery.where).toHaveBeenCalledWith('isPublic', '==', true)
    })
  })

  describe('Data Validation', () => {
    it('should validate collection data before creation', async () => {
      // Arrange
      const userId = 'validator-user-123'
      const invalidData = {
        title: '', // Empty title should fail validation
        description: 'Valid description'
      } as CollectionCreateData
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })

      // Act
      const result = await collectionsService.createCollection(userId, invalidData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
      expect(mockFirestore.collection().add).not.toHaveBeenCalled()
    })

    it('should validate video data before adding', async () => {
      // Arrange
      const userId = 'video-validator-123'
      const collectionId = 'valid-collection-456'
      const invalidVideo = {
        url: '', // Empty URL should fail validation
        title: 'Valid Title'
      } as Video
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })

      // Act
      const result = await collectionsService.addVideoToCollection(
        userId, collectionId, invalidVideo
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })

    it('should sanitize user input', async () => {
      // Arrange
      const userId = 'sanitize-user-123'
      const collectionData: CollectionCreateData = {
        title: '<script>alert("xss")</script>Legitimate Title',
        description: 'Normal description with <b>HTML</b> tags'
      }
      
      const mockDocRef = { id: 'sanitized-collection-123' }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.collection().add.mockResolvedValue(mockDocRef)

      // Act
      const result = await collectionsService.createCollection(userId, collectionData)

      // Assert
      expect(result.success).toBe(true)
      // Verify that HTML/script tags are sanitized in the stored data
      const storedData = mockFirestore.collection().add.mock.calls[0][0]
      expect(storedData.title).not.toContain('<script>')
      expect(storedData.title).toContain('Legitimate Title')
    })
  })

  describe('Performance Tests', () => {
    it('should create collection within performance threshold', async () => {
      // Arrange
      const userId = 'perf-user-123'
      const collectionData: CollectionCreateData = {
        title: 'Performance Test Collection',
        description: 'Testing performance'
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.collection().add.mockResolvedValue({ id: 'perf-collection' })

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        return await collectionsService.createCollection(userId, collectionData)
      })

      // Assert
      global.performanceUtils.expectPerformance(duration, 300, 'Collection creation')
    })

    it('should handle concurrent operations', async () => {
      // Arrange
      const userId = 'concurrent-user-123'
      const operations = Array.from({ length: 5 }, (_, i) => ({
        title: `Concurrent Collection ${i}`,
        description: `Description ${i}`
      }))
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.collection().add.mockResolvedValue({ id: 'concurrent-collection' })

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          operations.map(data => collectionsService.createCollection(userId, data))
        )
      })

      // Assert
      global.performanceUtils.expectPerformance(duration, 1000, 'Concurrent collection operations')
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      const userId = 'error-user-123'
      const collectionData: CollectionCreateData = {
        title: 'Error Test Collection',
        description: 'Should handle errors'
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.collection().add.mockRejectedValue(new Error('Database connection failed'))

      // Act
      const result = await collectionsService.createCollection(userId, collectionData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })

    it('should handle RBAC service failures', async () => {
      // Arrange
      const userId = 'rbac-error-user'
      const collectionData: CollectionCreateData = {
        title: 'RBAC Error Test',
        description: 'Testing RBAC failures'
      }
      
      mockRBACService.canPerformAction.mockRejectedValue(new Error('RBAC service unavailable'))

      // Act
      const result = await collectionsService.createCollection(userId, collectionData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('authorization check failed')
    })

    it('should handle transaction failures', async () => {
      // Arrange
      const userId = 'transaction-user'
      const collectionId = 'transaction-collection'
      const videoData = global.testUtils.createMockVideo()
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.runTransaction.mockRejectedValue(new Error('Transaction failed'))

      // Act
      const result = await collectionsService.addVideoToCollection(
        userId, collectionId, videoData
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('transaction failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty user ID', async () => {
      // Act
      const result = await collectionsService.createCollection(
        '', 
        { title: 'Test', description: 'Test' }
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('User ID is required')
    })

    it('should handle null collection data', async () => {
      // Act
      const result = await collectionsService.createCollection(
        'user-123', 
        null as any
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Collection data is required')
    })

    it('should handle very large collections', async () => {
      // Arrange
      const userId = 'large-collection-user'
      const collectionId = 'large-collection'
      
      // Create a collection with many videos (simulate large data)
      const largeVideoArray = Array.from({ length: 1000 }, (_, i) => 
        global.testUtils.createMockVideo({ id: `video-${i}`, title: `Video ${i}` })
      )
      
      const mockCollection = global.testUtils.createMockCollection({
        id: collectionId,
        userId,
        videos: largeVideoArray
      })
      
      const mockDoc = {
        exists: true,
        id: collectionId,
        data: () => mockCollection
      }
      
      mockRBACService.canPerformAction.mockResolvedValue({ allowed: true })
      mockFirestore.doc().get.mockResolvedValue(mockDoc)

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        return await collectionsService.getCollection(userId, collectionId)
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.collection.videos).toHaveLength(1000)
      // Should still be performant even with large collections
      global.performanceUtils.expectPerformance(duration, 1000, 'Large collection retrieval')
    })
  })
})