import { describe, it, expect } from 'vitest'

describe('Performance - API Response Times', () => {
  const PERFORMANCE_TARGETS = {
    p50: 100,  // 50th percentile: 100ms
    p95: 200,  // 95th percentile: 200ms
    p99: 500,  // 99th percentile: 500ms
  }

  async function measureResponseTime(url: string): Promise<number> {
    const startTime = performance.now()
    const response = await fetch(url)
    const endTime = performance.now()
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    
    return endTime - startTime
  }

  async function getPercentile(measurements: number[], percentile: number): number {
    const sorted = measurements.sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index]
  }

  describe('Dashboard Stats API', () => {
    it('should respond within performance targets', async () => {
      const measurements = await Promise.all(
        Array(20).fill(null).map(() =>
          measureResponseTime('http://localhost:5000/api/dashboard/stats?year=2026')
        )
      )

      const p50 = await getPercentile(measurements, 50)
      const p95 = await getPercentile(measurements, 95)
      const p99 = await getPercentile(measurements, 99)

      expect(p50).toBeLessThanOrEqual(PERFORMANCE_TARGETS.p50)
      expect(p95).toBeLessThanOrEqual(PERFORMANCE_TARGETS.p95)
      expect(p99).toBeLessThanOrEqual(PERFORMANCE_TARGETS.p99)
    })

    it('should handle concurrent requests efficiently', async () => {
      const startTime = performance.now()
      
      const promises = Array(10).fill(null).map((_, i) =>
        fetch(`http://localhost:5000/api/dashboard/stats?year=2026&month=${(i % 12) + 1}`)
      )
      
      await Promise.all(promises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // 10 concurrent requests should complete in less than 2 seconds
      expect(totalTime).toBeLessThan(2000)
    })
  })

  describe('Staff Performance API', () => {
    it('should respond within performance targets', async () => {
      const measurements = await Promise.all(
        Array(20).fill(null).map(() =>
          measureResponseTime('http://localhost:5000/api/dashboard/staff?year=2026')
        )
      )

      const p95 = await getPercentile(measurements, 95)

      expect(p95).toBeLessThanOrEqual(PERFORMANCE_TARGETS.p95)
    })
  })

  describe('Outliers API', () => {
    it('should respond within performance targets for top3', async () => {
      const measurements = await Promise.all(
        Array(20).fill(null).map(() =>
          measureResponseTime('http://localhost:5000/api/dashboard/outliers/top3?year=2026')
        )
      )

      const p95 = await getPercentile(measurements, 95)

      expect(p95).toBeLessThanOrEqual(PERFORMANCE_TARGETS.p95)
    })

    it('should respond within performance targets for all outliers', async () => {
      const measurements = await Promise.all(
        Array(20).fill(null).map(() =>
          measureResponseTime('http://localhost:5000/api/dashboard/outliers/all?year=2026')
        )
      )

      const p95 = await getPercentile(measurements, 95)

      // All outliers might be slower, but should still be under 500ms
      expect(p95).toBeLessThan(500)
    })
  })

  describe('Monthly Report API', () => {
    it('should respond within performance targets', async () => {
      const measurements = await Promise.all(
        Array(20).fill(null).map(() =>
          measureResponseTime('http://localhost:5000/api/dashboard/report?year=2026&month=3')
        )
      )

      const p95 = await getPercentile(measurements, 95)

      // Report generation can be slower
      expect(p95).toBeLessThan(1000)
    })
  })

  describe('Ticket Search API', () => {
    it('should handle search queries efficiently', async () => {
      const measurements = await Promise.all(
        Array(20).fill(null).map(() =>
          measureResponseTime('http://localhost:5000/api/dashboard/tickets?year=2026&filterType=all&search=test')
        )
      )

      const p95 = await getPercentile(measurements, 95)

      expect(p95).toBeLessThanOrEqual(PERFORMANCE_TARGETS.p95)
    })
  })
})
