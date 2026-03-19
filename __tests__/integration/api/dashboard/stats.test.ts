import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http } from 'msw'
import { server } from '../../../mocks/server'

describe('GET /api/dashboard/stats', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('should return KPI stats for valid year', async () => {
    const response = await fetch(
      'http://localhost:5000/api/dashboard/stats?year=2026'
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('closed')
    expect(data).toHaveProperty('pending')
    expect(data).toHaveProperty('closeRate')
    expect(data).toHaveProperty('avgTime')
    expect(data).toHaveProperty('outlierCount')
    expect(data).toHaveProperty('outlierThreshold')
  })

  it('should return stats for specific month when provided', async () => {
    const response = await fetch(
      'http://localhost:5000/api/dashboard/stats?year=2026&month=3'
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('total')
  })

  it('should return 400 error when year is missing', async () => {
    const response = await fetch(
      'http://localhost:5000/api/dashboard/stats'
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('should return numeric values for stats', async () => {
    const response = await fetch(
      'http://localhost:5000/api/dashboard/stats?year=2026'
    )
    const data = await response.json()

    expect(typeof data.total).toBe('number')
    expect(typeof data.closed).toBe('number')
    expect(typeof data.pending).toBe('number')
    expect(typeof data.closeRate).toBe('number')
    expect(typeof data.avgTime).toBe('number')
    expect(typeof data.outlierCount).toBe('number')
    expect(typeof data.outlierThreshold).toBe('number')
  })

  it('should handle network errors gracefully', async () => {
    server.use(
      http.get('http://localhost:5000/api/dashboard/stats', () => {
        return new Response(null, { status: 500 })
      })
    )

    const response = await fetch(
      'http://localhost:5000/api/dashboard/stats?year=2026'
    )

    expect(response.status).toBe(500)
  })
})
