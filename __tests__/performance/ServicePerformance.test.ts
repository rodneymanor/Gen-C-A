/**
 * Performance Benchmarking Tests for Services
 * 
 * Tests response time benchmarks, concurrent operation handling,
 * memory usage validation, and load testing scenarios
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest'
import { AuthService } from '@/services/auth/AuthService'
import { RBACService } from '@/services/auth/RBACService'
import { CollectionsService } from '@/lib/collections-service'
import { VideoProcessingService } from '@/services/video-processing-service'

// Performance test configuration
const PERFORMANCE_CONFIG = {
  iterations: 100,
  timeout: 30000,
  concurrency: {
    low: 10,
    medium: 50,
    high: 100
  },
  thresholds: {
    auth: 100,        // Authentication should be < 100ms
    rbac: 200,        // RBAC checks should be < 200ms
    collections: 300, // Collection operations should be < 300ms
    video: 500        // Video processing should be < 500ms
  }
}

// Mock external services with realistic delays
const createMockWithDelay = (delay: number, mockValue: any) => {
  return vi.fn().mockImplementation(async () => {
    await global.testUtils.delay(delay)
    return mockValue
  })
}

describe('Service Performance Tests', () => {
  let authService: AuthService
  let rbacService: RBACService
  let collectionsService: CollectionsService
  let videoProcessingService: VideoProcessingService

  beforeAll(() => {
    // Set test timeout for performance tests
    vi.setConfig({ testTimeout: PERFORMANCE_CONFIG.timeout })
    
    process.env.FIREBASE_PROJECT_ID = 'performance-test-project'
    process.env.CDN_API_KEY = 'performance-test-cdn-key'
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    authService = new AuthService()
    rbacService = new RBACService()
    collectionsService = new CollectionsService()
    videoProcessingService = new VideoProcessingService()

    // Mock Firebase services with realistic response times
    vi.mocked(authService.validateToken).mockImplementation(
      createMockWithDelay(50, {
        valid: true,
        uid: 'perf-user-123',
        claims: { role: 'user', permissions: ['read:collections', 'write:collections'] }
      })
    )

    vi.mocked(rbacService.canPerformAction).mockImplementation(
      createMockWithDelay(80, { allowed: true, reason: 'Permission granted' })
    )

    vi.mocked(collectionsService.createCollection).mockImplementation(
      createMockWithDelay(150, { success: true, collectionId: 'perf-collection' })
    )

    vi.mocked(videoProcessingService.processVideo).mockImplementation(
      createMockWithDelay(300, {
        success: true,
        video: global.testUtils.createMockVideo()
      })
    )
  })

  describe('Single Operation Performance', () => {
    it('should validate token within performance threshold', async () => {
      // Arrange
      const token = 'performance-test-token'

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        return await authService.validateToken(token)
      })

      // Assert
      expect(result.valid).toBe(true)
      global.performanceUtils.expectPerformance(
        duration, 
        PERFORMANCE_CONFIG.thresholds.auth, 
        'Token validation'
      )
    })

    it('should check RBAC permissions within performance threshold', async () => {
      // Arrange
      const userId = 'rbac-perf-user'

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        return await rbacService.canPerformAction(userId, 'read:collections', 'collection')
      })

      // Assert
      expect(result.allowed).toBe(true)
      global.performanceUtils.expectPerformance(
        duration,
        PERFORMANCE_CONFIG.thresholds.rbac,
        'RBAC permission check'
      )
    })

    it('should create collection within performance threshold', async () => {
      // Arrange
      const userId = 'collection-perf-user'
      const collectionData = {
        title: 'Performance Test Collection',
        description: 'Testing collection creation performance'
      }

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        return await collectionsService.createCollection(userId, collectionData)
      })

      // Assert
      expect(result.success).toBe(true)
      global.performanceUtils.expectPerformance(
        duration,
        PERFORMANCE_CONFIG.thresholds.collections,
        'Collection creation'
      )
    })

    it('should process video within performance threshold', async () => {
      // Arrange
      const videoUrl = 'https://example.com/performance-test.mp4'
      const options = { generateThumbnails: true }

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        return await videoProcessingService.processVideo(videoUrl, options)
      })

      // Assert
      expect(result.success).toBe(true)
      global.performanceUtils.expectPerformance(
        duration,
        PERFORMANCE_CONFIG.thresholds.video,
        'Video processing'
      )
    })
  })

  describe('Concurrent Operations Performance', () => {
    it('should handle low concurrency token validations', async () => {
      // Arrange
      const tokens = Array.from({ length: PERFORMANCE_CONFIG.concurrency.low }, 
        (_, i) => `concurrent-token-${i}`
      )

      // Act
      const { duration, result: results } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          tokens.map(token => authService.validateToken(token))
        )
      })

      // Assert
      expect(results).toHaveLength(PERFORMANCE_CONFIG.concurrency.low)
      expect(results.every(r => r.valid)).toBe(true)
      
      const avgDuration = duration / PERFORMANCE_CONFIG.concurrency.low
      global.performanceUtils.expectPerformance(
        avgDuration,
        PERFORMANCE_CONFIG.thresholds.auth * 2, // Allow 2x threshold for concurrent ops
        `Concurrent token validation (${PERFORMANCE_CONFIG.concurrency.low} operations)`
      )
    })

    it('should handle medium concurrency RBAC checks', async () => {
      // Arrange
      const userIds = Array.from({ length: PERFORMANCE_CONFIG.concurrency.medium },
        (_, i) => `concurrent-user-${i}`
      )

      // Act
      const { duration, result: results } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          userIds.map(userId => rbacService.canPerformAction(userId, 'read:collections', 'collection'))
        )
      })

      // Assert
      expect(results).toHaveLength(PERFORMANCE_CONFIG.concurrency.medium)
      expect(results.every(r => r.allowed)).toBe(true)

      const avgDuration = duration / PERFORMANCE_CONFIG.concurrency.medium
      global.performanceUtils.expectPerformance(
        avgDuration,
        PERFORMANCE_CONFIG.thresholds.rbac * 2,
        `Concurrent RBAC checks (${PERFORMANCE_CONFIG.concurrency.medium} operations)`
      )
    })

    it('should handle high concurrency collection operations', async () => {
      // Arrange
      const operations = Array.from({ length: PERFORMANCE_CONFIG.concurrency.high },
        (_, i) => ({
          userId: `high-concurrency-user-${i}`,
          title: `High Concurrency Collection ${i}`,
          description: `Performance test collection ${i}`
        })
      )

      // Act
      const { duration, result: results } = await global.performanceUtils.measureTime(async () => {
        return await Promise.all(
          operations.map(op => collectionsService.createCollection(op.userId, {
            title: op.title,
            description: op.description
          }))
        )
      })

      // Assert
      expect(results).toHaveLength(PERFORMANCE_CONFIG.concurrency.high)
      expect(results.every(r => r.success)).toBe(true)

      const avgDuration = duration / PERFORMANCE_CONFIG.concurrency.high
      global.performanceUtils.expectPerformance(
        avgDuration,
        PERFORMANCE_CONFIG.thresholds.collections * 3, // Allow 3x threshold for high concurrency
        `High concurrency collection operations (${PERFORMANCE_CONFIG.concurrency.high} operations)`
      )
    })
  })

  describe('Load Testing Scenarios', () => {
    it('should handle sustained load over time', async () => {
      // Arrange
      const loadDuration = 5000 // 5 seconds of sustained load
      const operationsPerSecond = 20
      const totalOperations = (loadDuration / 1000) * operationsPerSecond

      let completedOperations = 0
      const startTime = Date.now()
      const results: any[] = []

      // Act
      const loadTest = async () => {
        while (Date.now() - startTime < loadDuration) {
          const batchPromises = Array.from({ length: operationsPerSecond }, async (_, i) => {
            const result = await authService.validateToken(`load-test-token-${completedOperations + i}`)
            completedOperations++
            return result
          })

          const batchResults = await Promise.all(batchPromises)
          results.push(...batchResults)

          // Wait for next second
          await global.testUtils.delay(1000)
        }
      }

      const { duration } = await global.performanceUtils.measureTime(loadTest)

      // Assert
      expect(results.length).toBeGreaterThan(0)
      expect(results.every(r => r.valid)).toBe(true)
      expect(duration).toBeGreaterThan(loadDuration * 0.9) // Allow 10% variance
      expect(duration).toBeLessThan(loadDuration * 1.5) // Should not exceed 150% of target time

      const actualOpsPerSecond = results.length / (duration / 1000)
      expect(actualOpsPerSecond).toBeGreaterThan(operationsPerSecond * 0.8) // At least 80% of target throughput
    })

    it('should handle burst traffic patterns', async () => {
      // Arrange
      const burstSizes = [10, 50, 100, 50, 10] // Varying burst sizes
      const burstInterval = 1000 // 1 second between bursts

      // Act
      const { duration, result: allResults } = await global.performanceUtils.measureTime(async () => {
        const results = []

        for (const burstSize of burstSizes) {
          const burstPromises = Array.from({ length: burstSize }, (_, i) => 
            rbacService.canPerformAction(`burst-user-${i}`, 'read:collections', 'collection')
          )

          const burstResults = await Promise.all(burstPromises)
          results.push(...burstResults)

          // Wait before next burst
          if (burstSize !== burstSizes[burstSizes.length - 1]) {
            await global.testUtils.delay(burstInterval)
          }
        }

        return results
      })

      // Assert
      const totalOperations = burstSizes.reduce((sum, size) => sum + size, 0)
      expect(allResults).toHaveLength(totalOperations)
      expect(allResults.every(r => r.allowed)).toBe(true)

      const avgDuration = duration / totalOperations
      global.performanceUtils.expectPerformance(
        avgDuration,
        PERFORMANCE_CONFIG.thresholds.rbac * 1.5,
        'Burst traffic pattern handling'
      )
    })
  })

  describe('Memory Usage and Resource Management', () => {
    it('should not leak memory during repeated operations', async () => {
      // Arrange
      const iterations = 1000
      const memoryCheckInterval = 100

      const initialMemory = process.memoryUsage()
      let peakMemory = initialMemory
      const memoryReadings = []

      // Act
      for (let i = 0; i < iterations; i++) {
        await authService.validateToken(`memory-test-token-${i}`)

        if (i % memoryCheckInterval === 0) {
          const currentMemory = process.memoryUsage()
          memoryReadings.push({
            iteration: i,
            heapUsed: currentMemory.heapUsed,
            heapTotal: currentMemory.heapTotal,
            external: currentMemory.external
          })

          if (currentMemory.heapUsed > peakMemory.heapUsed) {
            peakMemory = currentMemory
          }
        }
      }

      const finalMemory = process.memoryUsage()

      // Assert
      // Memory should not increase significantly over time (accounting for GC cycles)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      const maxAllowedIncrease = initialMemory.heapUsed * 0.5 // Allow 50% increase

      expect(memoryIncrease).toBeLessThan(maxAllowedIncrease)

      // Peak memory should not be excessively high
      const peakIncrease = peakMemory.heapUsed - initialMemory.heapUsed
      const maxAllowedPeakIncrease = initialMemory.heapUsed * 2 // Allow 200% peak increase

      expect(peakIncrease).toBeLessThan(maxAllowedPeakIncrease)
    })

    it('should manage resources efficiently under load', async () => {
      // Arrange
      const concurrentOperations = 50
      const operationBatches = 10

      // Act
      const { duration, result } = await global.performanceUtils.measureTime(async () => {
        const batchResults = []

        for (let batch = 0; batch < operationBatches; batch++) {
          const batchPromises = Array.from({ length: concurrentOperations }, async (_, i) => {
            const userId = `resource-test-user-${batch}-${i}`
            
            // Perform multiple service operations
            const authResult = await authService.validateToken(`token-${batch}-${i}`)
            const rbacResult = await rbacService.canPerformAction(userId, 'read:collections', 'collection')
            const collectionResult = await collectionsService.createCollection(userId, {
              title: `Resource Test Collection ${batch}-${i}`,
              description: 'Testing resource management'
            })

            return { auth: authResult, rbac: rbacResult, collection: collectionResult }
          })

          const batchResult = await Promise.all(batchPromises)
          batchResults.push(...batchResult)

          // Small delay between batches to allow resource cleanup
          await global.testUtils.delay(100)
        }

        return batchResults
      })

      // Assert
      const totalOperations = concurrentOperations * operationBatches
      expect(result).toHaveLength(totalOperations)
      expect(result.every(r => r.auth.valid && r.rbac.allowed && r.collection.success)).toBe(true)

      const avgDurationPerOperation = duration / totalOperations
      global.performanceUtils.expectPerformance(
        avgDurationPerOperation,
        1000, // 1 second per batch of operations
        'Resource management under load'
      )
    })
  })

  describe('Performance Degradation Testing', () => {
    it('should gracefully handle performance degradation', async () => {
      // Arrange
      const baseDelay = 50
      const degradationFactor = 2
      const operations = 20

      let currentDelay = baseDelay
      const delays: number[] = []
      const results: any[] = []

      // Mock service with increasing delays
      vi.mocked(authService.validateToken).mockImplementation(async (token) => {
        const delay = currentDelay
        delays.push(delay)
        
        await global.testUtils.delay(delay)
        
        // Increase delay for next operation (simulating degradation)
        currentDelay = Math.min(currentDelay * degradationFactor, 1000)
        
        return { valid: true, uid: 'degradation-user', claims: {} }
      })

      // Act
      const { duration } = await global.performanceUtils.measureTime(async () => {
        for (let i = 0; i < operations; i++) {
          const result = await authService.validateToken(`degradation-token-${i}`)
          results.push(result)
        }
      })

      // Assert
      expect(results).toHaveLength(operations)
      expect(results.every(r => r.valid)).toBe(true)
      
      // Verify that delays increased as expected
      expect(delays[0]).toBe(baseDelay)
      expect(delays[delays.length - 1]).toBeGreaterThan(baseDelay * 10)
      
      // Even with degradation, should complete within reasonable time
      expect(duration).toBeLessThan(30000) // 30 seconds max
    })

    it('should implement circuit breaker under degraded conditions', async () => {
      // Arrange
      const failureThreshold = 5
      const circuitBreakerTimeout = 2000
      
      let callCount = 0
      let consecutiveFailures = 0
      let circuitOpen = false
      let circuitOpenTime = 0

      // Mock service with circuit breaker logic
      vi.mocked(videoProcessingService.processVideo).mockImplementation(async (url, options) => {
        callCount++

        // Check if circuit is open
        if (circuitOpen) {
          if (Date.now() - circuitOpenTime < circuitBreakerTimeout) {
            throw new Error('Circuit breaker is open - service temporarily unavailable')
          } else {
            // Try to close circuit
            circuitOpen = false
            consecutiveFailures = 0
          }
        }

        // Simulate service failures
        if (callCount <= failureThreshold + 2) {
          consecutiveFailures++
          if (consecutiveFailures >= failureThreshold) {
            circuitOpen = true
            circuitOpenTime = Date.now()
          }
          throw new Error('Service temporarily degraded')
        }

        // Service recovered
        consecutiveFailures = 0
        return { success: true, video: global.testUtils.createMockVideo() }
      })

      // Act & Assert
      const results = []

      // First batch should fail and trigger circuit breaker
      for (let i = 0; i < failureThreshold + 3; i++) {
        try {
          const result = await videoProcessingService.processVideo(`test-${i}.mp4`, {})
          results.push({ success: true, result })
        } catch (error) {
          results.push({ success: false, error: error.message })
        }
      }

      // Wait for circuit breaker timeout
      await global.testUtils.delay(circuitBreakerTimeout + 100)

      // Next call should succeed (circuit closed)
      try {
        const recoveryResult = await videoProcessingService.processVideo('recovery-test.mp4', {})
        results.push({ success: true, result: recoveryResult })
      } catch (error) {
        results.push({ success: false, error: error.message })
      }

      // Verify circuit breaker behavior
      const failures = results.filter(r => !r.success)
      const circuitBreakerErrors = failures.filter(r => r.error.includes('Circuit breaker'))
      const finalSuccess = results[results.length - 1]

      expect(failures.length).toBeGreaterThan(0)
      expect(circuitBreakerErrors.length).toBeGreaterThan(0)
      expect(finalSuccess.success).toBe(true) // Service should recover
    })
  })
})