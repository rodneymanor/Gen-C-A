/**
 * Comprehensive Unit Tests for AuthService
 * 
 * Tests authentication functionality, token validation, user management,
 * custom claims, session handling, and error scenarios
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import { AuthService } from '@/services/auth/AuthService'
import type { 
  UserProfile, 
  AuthResult, 
  CustomClaims,
  SessionData 
} from '@/services/auth/types'

// Mock Firebase Admin Auth
const mockAuth = {
  verifyIdToken: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
  getUser: vi.fn(),
  getUserByEmail: vi.fn(),
  createCustomToken: vi.fn(),
  listUsers: vi.fn()
}

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => mockAuth)
}))

describe('AuthService', () => {
  let authService: AuthService
  
  beforeAll(() => {
    // Set up test environment
    process.env.FIREBASE_PROJECT_ID = 'test-project'
    process.env.FIREBASE_PRIVATE_KEY = 'test-key'
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com'
  })

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    authService = new AuthService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should validate a valid token successfully', async () => {
      // Arrange
      const mockToken = 'valid-token-123'
      const mockDecodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        role: 'user',
        permissions: ['read:collections']
      }
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken)

      // Act
      const result = await authService.validateToken(mockToken)

      // Assert
      expect(result).toEqual({
        valid: true,
        uid: 'user-123',
        claims: mockDecodedToken
      })
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(mockToken)
    })

    it('should reject invalid token', async () => {
      // Arrange
      const mockToken = 'invalid-token'
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

      // Act
      const result = await authService.validateToken(mockToken)

      // Assert
      expect(result).toEqual({
        valid: false,
        error: 'Invalid token'
      })
    })

    it('should handle expired token gracefully', async () => {
      // Arrange
      const mockToken = 'expired-token'
      const expiredError = new Error('Token expired')
      expiredError.code = 'auth/id-token-expired'
      mockAuth.verifyIdToken.mockRejectedValue(expiredError)

      // Act
      const result = await authService.validateToken(mockToken)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should handle revoked token', async () => {
      // Arrange
      const mockToken = 'revoked-token'
      const revokedError = new Error('Token revoked')
      revokedError.code = 'auth/id-token-revoked'
      mockAuth.verifyIdToken.mockRejectedValue(revokedError)

      // Act
      const result = await authService.validateToken(mockToken)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('revoked')
    })
  })

  describe('User Management', () => {
    it('should create user profile successfully', async () => {
      // Arrange
      const uid = 'new-user-123'
      const profile: UserProfile = {
        email: 'newuser@example.com',
        displayName: 'New User',
        role: 'user',
        permissions: ['read:collections'],
        metadata: {
          createdAt: new Date().toISOString(),
          lastLogin: null
        }
      }
      
      mockAuth.updateUser.mockResolvedValue({ uid })
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined)

      // Act
      const result = await authService.createUserProfile(uid, profile)

      // Assert
      expect(result.success).toBe(true)
      expect(result.uid).toBe(uid)
      expect(mockAuth.updateUser).toHaveBeenCalledWith(uid, {
        email: profile.email,
        displayName: profile.displayName
      })
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        role: profile.role,
        permissions: profile.permissions
      })
    })

    it('should handle user creation failure', async () => {
      // Arrange
      const uid = 'failing-user'
      const profile: UserProfile = {
        email: 'fail@example.com',
        displayName: 'Failing User',
        role: 'user',
        permissions: []
      }
      
      mockAuth.updateUser.mockRejectedValue(new Error('User update failed'))

      // Act
      const result = await authService.createUserProfile(uid, profile)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('User update failed')
    })

    it('should get user profile successfully', async () => {
      // Arrange
      const uid = 'existing-user'
      const mockUserRecord = {
        uid,
        email: 'existing@example.com',
        displayName: 'Existing User',
        customClaims: {
          role: 'admin',
          permissions: ['read:all', 'write:all']
        }
      }
      
      mockAuth.getUser.mockResolvedValue(mockUserRecord)

      // Act
      const result = await authService.getUserProfile(uid)

      // Assert
      expect(result.success).toBe(true)
      expect(result.profile).toEqual({
        email: mockUserRecord.email,
        displayName: mockUserRecord.displayName,
        role: mockUserRecord.customClaims.role,
        permissions: mockUserRecord.customClaims.permissions
      })
    })

    it('should handle non-existent user', async () => {
      // Arrange
      const uid = 'non-existent-user'
      const notFoundError = new Error('User not found')
      notFoundError.code = 'auth/user-not-found'
      mockAuth.getUser.mockRejectedValue(notFoundError)

      // Act
      const result = await authService.getUserProfile(uid)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should update user profile successfully', async () => {
      // Arrange
      const uid = 'update-user'
      const updates = {
        displayName: 'Updated Name',
        role: 'moderator' as const,
        permissions: ['read:collections', 'moderate:content']
      }
      
      mockAuth.updateUser.mockResolvedValue({ uid })
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined)

      // Act
      const result = await authService.updateUserProfile(uid, updates)

      // Assert
      expect(result.success).toBe(true)
      expect(mockAuth.updateUser).toHaveBeenCalledWith(uid, {
        displayName: updates.displayName
      })
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, {
        role: updates.role,
        permissions: updates.permissions
      })
    })

    it('should delete user successfully', async () => {
      // Arrange
      const uid = 'delete-user'
      mockAuth.deleteUser.mockResolvedValue(undefined)

      // Act
      const result = await authService.deleteUser(uid)

      // Assert
      expect(result.success).toBe(true)
      expect(mockAuth.deleteUser).toHaveBeenCalledWith(uid)
    })
  })

  describe('Custom Claims Management', () => {
    it('should set custom claims successfully', async () => {
      // Arrange
      const uid = 'claims-user'
      const claims: CustomClaims = {
        role: 'admin',
        permissions: ['read:all', 'write:all', 'delete:all'],
        organizationId: 'org-123'
      }
      
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined)

      // Act
      const result = await authService.setCustomClaims(uid, claims)

      // Assert
      expect(result.success).toBe(true)
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, claims)
    })

    it('should get custom claims successfully', async () => {
      // Arrange
      const uid = 'claims-user'
      const mockUserRecord = {
        uid,
        customClaims: {
          role: 'moderator',
          permissions: ['read:collections', 'moderate:content'],
          organizationId: 'org-456'
        }
      }
      
      mockAuth.getUser.mockResolvedValue(mockUserRecord)

      // Act
      const result = await authService.getCustomClaims(uid)

      // Assert
      expect(result.success).toBe(true)
      expect(result.claims).toEqual(mockUserRecord.customClaims)
    })

    it('should handle user with no custom claims', async () => {
      // Arrange
      const uid = 'no-claims-user'
      const mockUserRecord = {
        uid,
        customClaims: undefined
      }
      
      mockAuth.getUser.mockResolvedValue(mockUserRecord)

      // Act
      const result = await authService.getCustomClaims(uid)

      // Assert
      expect(result.success).toBe(true)
      expect(result.claims).toEqual({})
    })
  })

  describe('Session Management', () => {
    it('should create session successfully', async () => {
      // Arrange
      const uid = 'session-user'
      const sessionData: SessionData = {
        userId: uid,
        deviceId: 'device-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
      
      mockAuth.createCustomToken.mockResolvedValue('custom-token-123')

      // Act
      const result = await authService.createSession(uid, sessionData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.sessionToken).toBe('custom-token-123')
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith(uid)
    })

    it('should validate session successfully', async () => {
      // Arrange
      const sessionToken = 'valid-session-token'
      const mockDecodedToken = {
        uid: 'session-user',
        email: 'session@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) + 3600  // 1 hour from now
      }
      
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken)

      // Act
      const result = await authService.validateSession(sessionToken)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.userId).toBe('session-user')
      expect(result.expiresAt).toBeDefined()
    })

    it('should invalidate expired session', async () => {
      // Arrange
      const sessionToken = 'expired-session-token'
      const expiredError = new Error('Token expired')
      expiredError.code = 'auth/id-token-expired'
      
      mockAuth.verifyIdToken.mockRejectedValue(expiredError)

      // Act
      const result = await authService.validateSession(sessionToken)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network error')
      networkError.code = 'NETWORK_ERROR'
      mockAuth.verifyIdToken.mockRejectedValue(networkError)

      // Act
      const result = await authService.validateToken('some-token')

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle rate limiting', async () => {
      // Arrange
      const rateLimitError = new Error('Too many requests')
      rateLimitError.code = 'auth/too-many-requests'
      mockAuth.verifyIdToken.mockRejectedValue(rateLimitError)

      // Act
      const result = await authService.validateToken('some-token')

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('rate limit')
    })

    it('should handle service unavailable', async () => {
      // Arrange
      const serviceError = new Error('Service unavailable')
      serviceError.code = 'ECONNREFUSED'
      mockAuth.verifyIdToken.mockRejectedValue(serviceError)

      // Act
      const result = await authService.validateToken('some-token')

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('service unavailable')
    })
  })

  describe('Performance Tests', () => {
    it('should validate token within performance threshold', async () => {
      // Arrange
      const mockToken = 'performance-token'
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user-123' })

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        return await authService.validateToken(mockToken)
      })

      // Assert
      global.performanceUtils.expectPerformance(duration, 100, 'Token validation')
    })

    it('should handle concurrent token validations', async () => {
      // Arrange
      const tokens = Array.from({ length: 10 }, (_, i) => `token-${i}`)
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user-123' })

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          tokens.map(token => authService.validateToken(token))
        )
      })

      // Assert
      global.performanceUtils.expectPerformance(duration, 500, 'Concurrent token validation')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null token', async () => {
      // Act
      const result = await authService.validateToken(null as any)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Token is required')
    })

    it('should handle empty string token', async () => {
      // Act
      const result = await authService.validateToken('')

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Token is required')
    })

    it('should handle undefined user ID', async () => {
      // Act
      const result = await authService.getUserProfile(undefined as any)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('User ID is required')
    })

    it('should handle malformed custom claims', async () => {
      // Arrange
      const uid = 'malformed-claims-user'
      const mockUserRecord = {
        uid,
        customClaims: 'invalid-claims' // Should be object, not string
      }
      
      mockAuth.getUser.mockResolvedValue(mockUserRecord)

      // Act
      const result = await authService.getCustomClaims(uid)

      // Assert
      expect(result.success).toBe(true)
      expect(result.claims).toEqual({})
    })
  })

  describe('Integration with Firebase Auth', () => {
    it('should properly initialize Firebase Auth', () => {
      // Act
      const service = new AuthService()

      // Assert
      expect(service).toBeDefined()
      expect(service.constructor.name).toBe('AuthService')
    })

    it('should use correct Firebase project configuration', () => {
      // Arrange
      const originalEnv = process.env.FIREBASE_PROJECT_ID

      // Act
      process.env.FIREBASE_PROJECT_ID = 'test-project-123'
      const service = new AuthService()

      // Assert
      expect(service).toBeDefined()
      
      // Cleanup
      process.env.FIREBASE_PROJECT_ID = originalEnv
    })
  })
})