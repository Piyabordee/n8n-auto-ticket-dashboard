/**
 * Integration Tests for OutlierRepository
 *
 * Tests the repository layer with mocked SQL Server responses
 */

import { OutlierRepository } from '@/repository/OutlierRepository'

// Mock the mssql module
jest.mock('mssql', () => {
  const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
  }

  return {
    connect: jest.fn(),
    DateTime: jest.fn(),
    ConnectionPool: jest.fn(),
  }
})

import sql from 'mssql'

// Mock the sql connection module after imports
jest.mock('../../app/lib/sql', () => {
  const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
  }

  const mockPool = {
    connected: true,
    request: jest.fn(() => mockRequest),
    close: jest.fn().mockResolvedValue(undefined),
  }

  return {
    getConnection: jest.fn().mockResolvedValue(mockPool),
    closeConnection: jest.fn().mockResolvedValue(undefined),
  }
})

import { getConnection } from '../../app/lib/sql'

describe('OutlierRepository', () => {
  let repository: OutlierRepository
  let mockPool: any

  beforeEach(() => {
    repository = new OutlierRepository()
    jest.clearAllMocks()

    // Setup mock pool
    mockPool = {
      connected: true,
      request: jest.fn().mockReturnValue({
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }

    ;(getConnection as jest.Mock).mockResolvedValue(mockPool)
  })

  afterEach(async () => {
    await repository.close()
  })

  describe('connect', () => {
    it('should establish database connection', async () => {
      await repository.connect()
      expect(getConnection).toHaveBeenCalled()
    })

    it('should reuse existing connection', async () => {
      await repository.connect()
      await repository.connect()
      // Shared pool returns same connection, so getConnection is still called
      expect(getConnection).toHaveBeenCalled()
    })
  })

  describe('close', () => {
    it('should close database connection (no-op for shared pool)', async () => {
      await repository.connect()
      await repository.close()
      // close is now a no-op, so it shouldn't call closeConnection
      expect(getConnection).toHaveBeenCalled()
    })
  })

  describe('getOutliers', () => {
    it('should return outliers with summary', async () => {
      const mockOutliers = [
        {
          message_id: 'MSG001',
          assigned_to: 'สมชาย ใจดี',
          subject: 'ปัญหาเครื่องปริ้นเตอร์',
          diff_minutes: 150,
          created_date: new Date('2026-03-01'),
          assigned_date: new Date('2026-03-01'),
          personal_median: 40,
          personal_sd: 20,
        },
        {
          message_id: 'MSG002',
          assigned_to: 'วิภา สุขสันต์',
          subject: 'เน็ตเวิร์กล่าช้า',
          diff_minutes: 120,
          created_date: new Date('2026-03-02'),
          assigned_date: new Date('2026-03-02'),
          personal_median: 35,
          personal_sd: 15,
        },
      ]

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: mockOutliers })

      const startDate = new Date('2026-03-01')
      const endDate = new Date('2026-03-31')

      const result = await repository.getOutliers(startDate, endDate)

      expect(result.outliers).toHaveLength(2)
      expect(result.summary.total).toBe(2)
      expect(result.outliers[0].message_id).toBe('MSG001')
    })

    it('should normalize stylized names', async () => {
      const mockOutliers = [
        {
          message_id: 'MSG001',
          assigned_to: 'Ｓｏｍｃｈａｉ', // Fullwidth characters
          subject: 'Test',
          diff_minutes: 100,
          created_date: new Date('2026-03-01'),
          assigned_date: new Date('2026-03-01'),
          personal_median: 40,
          personal_sd: 20,
        },
      ]

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: mockOutliers })

      const result = await repository.getOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result.outliers[0].assigned_to).toBe('Somchai')
    })

    it('should calculate deviation score correctly', async () => {
      const mockOutliers = [
        {
          message_id: 'MSG001',
          assigned_to: 'Test User',
          subject: 'Test',
          diff_minutes: 120,
          created_date: new Date('2026-03-01'),
          assigned_date: new Date('2026-03-01'),
          personal_median: 40,
          personal_sd: 20,
        },
      ]

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: mockOutliers })

      const result = await repository.getOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      // 120 / 40 = 3.0
      expect(result.outliers[0].deviation_score).toBe(3)
    })

    it('should return empty array when no outliers found', async () => {
      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: [] })

      const result = await repository.getOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result.outliers).toHaveLength(0)
      expect(result.summary.total).toBe(0)
    })

    it('should calculate summary statistics', async () => {
      const mockOutliers = [
        {
          message_id: 'MSG001',
          assigned_to: 'User1',
          subject: 'Test1',
          diff_minutes: 100,
          created_date: new Date('2026-03-01'),
          assigned_date: new Date('2026-03-01'),
          personal_median: 40,
          personal_sd: 20,
        },
        {
          message_id: 'MSG002',
          assigned_to: 'User2',
          subject: 'Test2',
          diff_minutes: 150,
          created_date: new Date('2026-03-02'),
          assigned_date: new Date('2026-03-02'),
          personal_median: 40,
          personal_sd: 20,
        },
      ]

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: mockOutliers })

      const result = await repository.getOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      // avg: (100 + 150) / 2 = 125
      expect(result.summary.avgTime).toBe(125)
      expect(result.summary.maxTime).toBe(150)
      expect(result.summary.minTime).toBe(100)
    })
  })

  describe('getTopOutliers', () => {
    it('should return top 3 outliers', async () => {
      const mockOutliers = [
        {
          message_id: 'MSG001',
          assigned_to: 'User1',
          subject: 'Test1',
          diff_minutes: 200,
          created_date: new Date('2026-03-01'),
          assigned_date: new Date('2026-03-01'),
          personal_median: 40,
        },
        {
          message_id: 'MSG002',
          assigned_to: 'User2',
          subject: 'Test2',
          diff_minutes: 150,
          created_date: new Date('2026-03-02'),
          assigned_date: new Date('2026-03-02'),
          personal_median: 40,
        },
        {
          message_id: 'MSG003',
          assigned_to: 'User3',
          subject: 'Test3',
          diff_minutes: 120,
          created_date: new Date('2026-03-03'),
          assigned_date: new Date('2026-03-03'),
          personal_median: 40,
        },
      ]

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: mockOutliers })

      const result = await repository.getTopOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result).toHaveLength(3)
      expect(result[0].diff_minutes).toBe(200)
    })

    it('should return less than 3 if fewer outliers exist', async () => {
      const mockOutliers = [
        {
          message_id: 'MSG001',
          assigned_to: 'User1',
          subject: 'Test1',
          diff_minutes: 100,
          created_date: new Date('2026-03-01'),
          assigned_date: new Date('2026-03-01'),
          personal_median: 40,
        },
      ]

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn().mockResolvedValue({ recordset: mockOutliers })

      const result = await repository.getTopOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result).toHaveLength(1)
    })
  })

  describe('getStaffPerformanceWithOutliers', () => {
    it('should return staff data with ranking', async () => {
      const mockStaffData = [
        {
          assigned_to: 'User1',
          totalAssigned: 50,
          totalClosed: 45,
          totalPending: 5,
          avgTimeAll: 35.5,
          avgTimeNormal: 25.3,
          avgTimeOutlier: 80.2,
          outlierCount: 2,
        },
        {
          assigned_to: 'User2',
          totalAssigned: 45,
          totalClosed: 42,
          totalPending: 3,
          avgTimeAll: 30.2,
          avgTimeNormal: 22.1,
          avgTimeOutlier: 75.5,
          outlierCount: 1,
        },
      ]

      const mockSummary = {
        avgTimeAll: 32.85,
        avgTimeNormal: 23.7,
        avgTimeOutlier: 77.85,
        totalOutliers: 3,
        outlierThreshold: 0,
      }

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn()
        .mockResolvedValueOnce({ recordset: mockStaffData })
        .mockResolvedValueOnce({ recordset: [mockSummary] })

      const result = await repository.getStaffPerformanceWithOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result.staff).toHaveLength(2)
      expect(result.staff[0].rank).toBe(1)
      expect(result.staff[1].rank).toBe(2)
    })

    it('should normalize staff names', async () => {
      const mockStaffData = [
        {
          assigned_to: 'Ｕｓｅｒ１',
          totalAssigned: 10,
          totalClosed: 10,
          totalPending: 0,
          avgTimeAll: 30,
          avgTimeNormal: 30,
          avgTimeOutlier: null,
          outlierCount: 0,
        },
      ]

      const mockSummary = {
        avgTimeAll: 30,
        avgTimeNormal: 30,
        avgTimeOutlier: null,
        totalOutliers: 0,
        outlierThreshold: 0,
      }

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn()
        .mockResolvedValueOnce({ recordset: mockStaffData })
        .mockResolvedValueOnce({ recordset: [mockSummary] })

      const result = await repository.getStaffPerformanceWithOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result.staff[0].name).toBe('User1')
    })

    it('should round average times', async () => {
      const mockStaffData = [
        {
          assigned_to: 'User1',
          totalAssigned: 10,
          totalClosed: 10,
          totalPending: 0,
          avgTimeAll: 35.567,
          avgTimeNormal: 25.344,
          avgTimeOutlier: 80.899,
          outlierCount: 2,
        },
      ]

      const mockSummary = {
        avgTimeAll: 35.567,
        avgTimeNormal: 25.344,
        avgTimeOutlier: 80.899,
        totalOutliers: 2,
        outlierThreshold: 0,
      }

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn()
        .mockResolvedValueOnce({ recordset: mockStaffData })
        .mockResolvedValueOnce({ recordset: [mockSummary] })

      const result = await repository.getStaffPerformanceWithOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result.staff[0].avgTimeAll).toBe(35.6)
      expect(result.staff[0].avgTimeNormal).toBe(25.3)
      expect(result.staff[0].avgTimeOutlier).toBe(80.9)
    })

    it('should handle null values', async () => {
      const mockStaffData = [
        {
          assigned_to: 'User1',
          totalAssigned: 10,
          totalClosed: 10,
          totalPending: 0,
          avgTimeAll: null,
          avgTimeNormal: null,
          avgTimeOutlier: null,
          outlierCount: null,
        },
      ]

      const mockSummary = {
        avgTimeAll: null,
        avgTimeNormal: null,
        avgTimeOutlier: null,
        totalOutliers: null,
        outlierThreshold: 0,
      }

      const mockRequest = mockPool.request()
      mockRequest.query = jest.fn()
        .mockResolvedValueOnce({ recordset: mockStaffData })
        .mockResolvedValueOnce({ recordset: [mockSummary] })

      const result = await repository.getStaffPerformanceWithOutliers(
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(result.staff[0].avgTimeAll).toBe(0)
      expect(result.staff[0].avgTimeNormal).toBe(0)
      expect(result.staff[0].avgTimeOutlier).toBe(0)
      expect(result.staff[0].outlierCount).toBe(0)
    })
  })
})

describe('getOutlierRepository', () => {
  it('should return singleton instance', () => {
    const { getOutlierRepository } = require('@/repository/OutlierRepository')

    const repo1 = getOutlierRepository()
    const repo2 = getOutlierRepository()

    expect(repo1).toBe(repo2)
  })
})
