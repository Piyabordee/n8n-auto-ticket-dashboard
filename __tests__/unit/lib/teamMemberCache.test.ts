/**
 * Unit Tests for TeamMemberCache
 *
 * Tests the centralized cache service for staff lookups
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the sql connection module
vi.mock('@/lib/sql', () => ({
  getConnection: vi.fn()
}))

import { getConnection } from '@/lib/sql'
import { teamMemberCache } from '@/lib/teamMemberCache'

describe('TeamMemberCache', () => {
  beforeEach(() => {
    // Reset cache before each test
    teamMemberCache.reset()
    // Clear mock calls
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should load staff from database', async () => {
      // Mock SQL response
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({
          recordset: [
            { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', email_spiceworks: 'holvichai.k@superrich1965.co.th', active: 'Y' },
            { userId: 'Ufac40f3d56ef2360068d8d98fb3abe10', fromUser: 'อภิสิทธิ์', email_spiceworks: 'apisit.s@superrich1965.co.th', active: 'Y' }
          ]
        })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      const stats = teamMemberCache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.initialized).toBe(true)
    })

    it('should not initialize twice', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ recordset: [] })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()
      await teamMemberCache.init() // Second call should be no-op

      expect(getConnection).toHaveBeenCalledTimes(1)
    })
  })

  describe('getDisplayName', () => {
    it('should return display name for valid userId', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({
          recordset: [
            { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', active: 'Y' }
          ]
        })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      const name = teamMemberCache.getDisplayName('Ub4c47e7e4f26bc5cee8868372fb6d759')
      expect(name).toBe('หลวิชัย')
    })

    it('should return userId for unknown userId (fallbackToUserId=true)', () => {
      teamMemberCache.reset()
      const name = teamMemberCache.getDisplayName('unknown-id')
      expect(name).toBe('unknown-id')
    })

    it('should return Unknown Staff for empty userId', () => {
      const name = teamMemberCache.getDisplayName('')
      expect(name).toBe('Unknown Staff')
    })
  })

  describe('getEmail', () => {
    it('should return email for valid userId', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({
          recordset: [
            { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', email_spiceworks: 'holvichai.k@superrich1965.co.th', active: 'Y' }
          ]
        })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      const email = teamMemberCache.getEmail('Ub4c47e7e4f26bc5cee8868372fb6d759')
      expect(email).toBe('holvichai.k@superrich1965.co.th')
    })

    it('should return null for unknown userId', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({
          recordset: [
            { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', email_spiceworks: 'test@example.com', active: 'Y' }
          ]
        })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      const email = teamMemberCache.getEmail('unknown-id')
      expect(email).toBeNull()
    })
  })

  describe('getUserIdByDisplayName', () => {
    it('should return userId by display name', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({
          recordset: [
            { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', active: 'Y' }
          ]
        })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      const userId = teamMemberCache.getUserIdByDisplayName('หลวิชัย')
      expect(userId).toBe('Ub4c47e7e4f26bc5cee8868372fb6d759')
    })

    it('should return null for unknown display name', () => {
      const userId = teamMemberCache.getUserIdByDisplayName('Unknown Name')
      expect(userId).toBeNull()
    })
  })

  describe('has', () => {
    it('should return true for existing userId', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({
          recordset: [
            { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', active: 'Y' }
          ]
        })
      }

      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue(mockRequest)
      }

      vi.mocked(getConnection).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      expect(teamMemberCache.has('Ub4c47e7e4f26bc5cee8868372fb6d759')).toBe(true)
    })

    it('should return false for non-existing userId', () => {
      expect(teamMemberCache.has('unknown-id')).toBe(false)
    })
  })
})
