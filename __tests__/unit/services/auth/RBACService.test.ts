/**
 * Comprehensive Unit Tests for RBACService
 * 
 * Tests role-based access control, permissions, data filtering,
 * query builders, and security enforcement
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import { RBACService } from '@/services/auth/RBACService'
import type { 
  RBACContext, 
  Permission, 
  Role,
  AccessControlResult,
  QueryFilter 
} from '@/services/auth/types'

// Mock Firestore for query building and data filtering
const mockFirestore = {
  collection: vi.fn(() => ({
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
  }))
}

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore)
}))

describe('RBACService', () => {
  let rbacService: RBACService
  
  beforeAll(() => {
    // Set up test environment
    process.env.FIREBASE_PROJECT_ID = 'test-project'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    rbacService = new RBACService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Permission Checking', () => {
    it('should grant access for valid permission', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        role: 'admin',
        permissions: ['read:collections', 'write:collections', 'delete:collections']
      })
      
      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'write:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.reason).toContain('permission granted')
    })

    it('should deny access for missing permission', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        role: 'user',
        permissions: ['read:collections']
      })
      
      // Mock getting user context
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'delete:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('permission denied')
    })

    it('should handle wildcard permissions', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        role: 'admin',
        permissions: ['*:collections', 'read:*']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'delete:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.reason).toContain('wildcard permission')
    })

    it('should handle super admin role', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        role: 'super_admin',
        permissions: ['*:*']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'any:action', 
        'any_resource'
      )

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.reason).toContain('super admin')
    })

    it('should handle role hierarchy', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        role: 'moderator',
        permissions: ['read:collections', 'moderate:content']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(true)
    })
  })

  describe('Data Filtering', () => {
    it('should filter collections for regular user', async () => {
      // Arrange
      const userId = 'regular-user-123'
      const mockCollections = [
        { id: 'col1', userId: userId, isPublic: false },
        { id: 'col2', userId: 'other-user', isPublic: true },
        { id: 'col3', userId: 'other-user', isPublic: false },
        { id: 'col4', userId: userId, isPublic: true }
      ]
      
      const context: RBACContext = global.testUtils.createMockRBACContext({
        userId,
        role: 'user',
        permissions: ['read:collections']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const filtered = await rbacService.filterUserCollections(userId, mockCollections)

      // Assert
      expect(filtered).toHaveLength(3) // User's collections + public ones
      expect(filtered.every(col => 
        col.userId === userId || col.isPublic === true
      )).toBe(true)
    })

    it('should return all collections for admin user', async () => {
      // Arrange
      const userId = 'admin-user-123'
      const mockCollections = [
        { id: 'col1', userId: 'user1', isPublic: false },
        { id: 'col2', userId: 'user2', isPublic: true },
        { id: 'col3', userId: 'user3', isPublic: false }
      ]
      
      const context: RBACContext = global.testUtils.createMockRBACContext({
        userId,
        role: 'admin',
        permissions: ['read:all']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const filtered = await rbacService.filterUserCollections(userId, mockCollections)

      // Assert
      expect(filtered).toHaveLength(3) // All collections visible to admin
    })

    it('should apply organization-based filtering', async () => {
      // Arrange
      const userId = 'org-user-123'
      const orgId = 'org-456'
      const mockCollections = [
        { id: 'col1', userId: 'user1', organizationId: orgId, isPublic: false },
        { id: 'col2', userId: 'user2', organizationId: 'other-org', isPublic: false },
        { id: 'col3', userId: 'user3', organizationId: orgId, isPublic: true }
      ]
      
      const context: RBACContext = global.testUtils.createMockRBACContext({
        userId,
        role: 'user',
        permissions: ['read:collections'],
        organizationId: orgId
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const filtered = await rbacService.filterUserCollections(userId, mockCollections)

      // Assert
      expect(filtered).toHaveLength(2) // Only collections from same org
      expect(filtered.every(col => col.organizationId === orgId)).toBe(true)
    })
  })

  describe('Query Builders', () => {
    it('should build query with user filter for regular user', async () => {
      // Arrange
      const userId = 'query-user-123'
      const context: RBACContext = global.testUtils.createMockRBACContext({
        userId,
        role: 'user',
        permissions: ['read:collections']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const query = await rbacService.buildCollectionsQuery(userId)

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('collections')
      expect(query.where).toHaveBeenCalledWith('userId', '==', userId)
    })

    it('should build unrestricted query for admin user', async () => {
      // Arrange
      const userId = 'admin-user-123'
      const context: RBACContext = global.testUtils.createMockRBACContext({
        userId,
        role: 'admin',
        permissions: ['read:all']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const query = await rbacService.buildCollectionsQuery(userId)

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('collections')
      // Should not have user-specific where clause for admin
    })

    it('should build organization-scoped query', async () => {
      // Arrange
      const userId = 'org-query-user'
      const orgId = 'query-org-789'
      const context: RBACContext = global.testUtils.createMockRBACContext({
        userId,
        role: 'user',
        permissions: ['read:collections'],
        organizationId: orgId
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const query = await rbacService.buildCollectionsQuery(userId)

      // Assert
      expect(query.where).toHaveBeenCalledWith('organizationId', '==', orgId)
    })
  })

  describe('RBAC Context Management', () => {
    it('should get RBAC context successfully', async () => {
      // Arrange
      const userId = 'context-user-123'
      const mockUserDoc = {
        exists: true,
        data: () => ({
          role: 'moderator',
          permissions: ['read:collections', 'moderate:content'],
          organizationId: 'context-org'
        })
      }
      
      mockFirestore.doc().get.mockResolvedValue(mockUserDoc)

      // Act
      const context = await rbacService.getRBACContext(userId)

      // Assert
      expect(context).toEqual({
        userId,
        role: 'moderator',
        permissions: ['read:collections', 'moderate:content'],
        organizationId: 'context-org'
      })
      expect(mockFirestore.doc).toHaveBeenCalledWith(`users/${userId}`)
    })

    it('should handle non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user'
      const mockUserDoc = {
        exists: false,
        data: () => null
      }
      
      mockFirestore.doc().get.mockResolvedValue(mockUserDoc)

      // Act
      const context = await rbacService.getRBACContext(userId)

      // Assert
      expect(context).toEqual({
        userId,
        role: 'user', // Default role
        permissions: ['read:collections'], // Default permissions
        organizationId: null
      })
    })

    it('should cache RBAC context', async () => {
      // Arrange
      const userId = 'cache-user-123'
      const mockUserDoc = {
        exists: true,
        data: () => ({
          role: 'admin',
          permissions: ['read:all', 'write:all']
        })
      }
      
      mockFirestore.doc().get.mockResolvedValue(mockUserDoc)

      // Act
      const context1 = await rbacService.getRBACContext(userId)
      const context2 = await rbacService.getRBACContext(userId)

      // Assert
      expect(context1).toEqual(context2)
      expect(mockFirestore.doc().get).toHaveBeenCalledTimes(1) // Should be cached
    })

    it('should refresh expired cache', async () => {
      // Arrange
      const userId = 'refresh-cache-user'
      const mockUserDoc = {
        exists: true,
        data: () => ({
          role: 'user',
          permissions: ['read:collections']
        })
      }
      
      mockFirestore.doc().get.mockResolvedValue(mockUserDoc)

      // Act
      await rbacService.getRBACContext(userId)
      
      // Simulate cache expiration
      await global.testUtils.delay(100)
      
      await rbacService.getRBACContext(userId, { forceRefresh: true })

      // Assert
      expect(mockFirestore.doc().get).toHaveBeenCalledTimes(2) // Cache refreshed
    })
  })

  describe('Permission Validation', () => {
    it('should validate complex permission patterns', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        permissions: ['read:collections:*', 'write:collections:own']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result1 = await rbacService.canPerformAction(
        context.userId, 
        'read:collections:any', 
        'collection'
      )
      
      const result2 = await rbacService.canPerformAction(
        context.userId, 
        'write:collections:own', 
        'collection'
      )

      // Assert
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })

    it('should handle resource-specific permissions', async () => {
      // Arrange
      const resourceId = 'resource-456'
      const context: RBACContext = global.testUtils.createMockRBACContext({
        permissions: [`read:collections:${resourceId}`]
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const allowedResult = await rbacService.canPerformAction(
        context.userId, 
        'read:collections', 
        'collection',
        { resourceId }
      )
      
      const deniedResult = await rbacService.canPerformAction(
        context.userId, 
        'read:collections', 
        'collection',
        { resourceId: 'other-resource' }
      )

      // Assert
      expect(allowedResult.allowed).toBe(true)
      expect(deniedResult.allowed).toBe(false)
    })

    it('should validate time-based permissions', async () => {
      // Arrange
      const now = new Date()
      const futureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      
      const context: RBACContext = global.testUtils.createMockRBACContext({
        permissions: ['read:collections'],
        metadata: {
          permissionExpiry: futureTime.toISOString()
        }
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(true)
    })

    it('should deny expired permissions', async () => {
      // Arrange
      const now = new Date()
      const pastTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
      
      const context: RBACContext = global.testUtils.createMockRBACContext({
        permissions: ['read:collections'],
        metadata: {
          permissionExpiry: pastTime.toISOString()
        }
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('expired')
    })
  })

  describe('Performance Tests', () => {
    it('should check permissions within performance threshold', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext()
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        return await rbacService.canPerformAction(
          context.userId, 
          'read:collections', 
          'collection'
        )
      })

      // Assert
      global.performanceUtils.expectPerformance(duration, 200, 'Permission check')
    })

    it('should handle concurrent permission checks', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext()
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      const permissions = [
        'read:collections',
        'write:collections',
        'delete:collections',
        'read:videos',
        'write:videos'
      ]

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          permissions.map(permission => 
            rbacService.canPerformAction(context.userId, permission, 'collection')
          )
        )
      })

      // Assert
      global.performanceUtils.expectPerformance(duration, 500, 'Concurrent permission checks')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid user ID', async () => {
      // Act
      const result = await rbacService.canPerformAction(
        '', 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('invalid user')
    })

    it('should handle malformed permissions', async () => {
      // Arrange
      const context: RBACContext = global.testUtils.createMockRBACContext({
        permissions: ['invalid-permission', null, undefined, 'read:collections']
      })
      
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(context)

      // Act
      const result = await rbacService.canPerformAction(
        context.userId, 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(true) // Should still work with valid permissions
    })

    it('should handle database connection errors', async () => {
      // Arrange
      const userId = 'db-error-user'
      mockFirestore.doc().get.mockRejectedValue(new Error('Database connection failed'))

      // Act
      const result = await rbacService.canPerformAction(
        userId, 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('error')
    })

    it('should handle null context gracefully', async () => {
      // Arrange
      vi.spyOn(rbacService, 'getRBACContext').mockResolvedValue(null as any)

      // Act
      const result = await rbacService.canPerformAction(
        'some-user', 
        'read:collections', 
        'collection'
      )

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('context not found')
    })
  })
})