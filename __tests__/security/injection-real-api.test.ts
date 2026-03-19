import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { server } from '../mocks/server'

/**
 * Security Tests - Real API Testing
 *
 * These tests run against the actual Next.js API server
 * Start the dev server first: npm run dev
 *
 * MSW is disabled for these tests to hit real API
 */
const API_BASE = 'http://localhost:5000'

describe('Security - Real API Tests', () => {
  // Disable MSW for real API testing
  beforeAll(() => server.close())
  // Re-enable MSW after tests
  afterAll(() => server.listen({ onUnhandledRequest: 'error' }))

  describe('SQL Injection', () => {
    it('should sanitize SQL injection in search parameter', async () => {
      const sqlInjection = "'; DROP TABLE ticket; --"

      const response = await fetch(
        `${API_BASE}/api/dashboard/tickets?year=2026&filterType=all&search=${encodeURIComponent(sqlInjection)}`
      )

      // Should not return 500 error (which would indicate SQL error)
      expect(response.status).not.toBe(500)
    })

    it('should sanitize SQL injection in year parameter', async () => {
      const sqlInjection = "2026 OR 1=1--"

      const response = await fetch(
        `${API_BASE}/api/dashboard/stats?year=${encodeURIComponent(sqlInjection)}`
      )

      // Should return 400 (bad input) rather than 500 (SQL error)
      expect([400, 422]).toContain(response.status)
    })

    it('should handle UNION-based SQL injection', async () => {
      const sqlInjection = "2026 UNION SELECT * FROM ticket--"

      const response = await fetch(
        `${API_BASE}/api/dashboard/stats?year=${encodeURIComponent(sqlInjection)}`
      )

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle time-based blind SQL injection', async () => {
      const sqlInjection = "2026; WAITFOR DELAY '00:00:05'--"

      const startTime = Date.now()
      const response = await fetch(
        `${API_BASE}/api/dashboard/stats?year=${encodeURIComponent(sqlInjection)}`
      )
      const endTime = Date.now()

      // Request should not take 5+ seconds
      expect(endTime - startTime).toBeLessThan(2000)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Command Injection', () => {
    it('should sanitize command injection in parameters', async () => {
      const commandInjection = "2026; ls -la"

      const response = await fetch(
        `${API_BASE}/api/dashboard/stats?year=${encodeURIComponent(commandInjection)}`
      )

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle pipe injection attempts', async () => {
      const commandInjection = "2026 | cat /etc/passwd"

      const response = await fetch(
        `${API_BASE}/api/dashboard/stats?year=${encodeURIComponent(commandInjection)}`
      )

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('XSS (Cross-Site Scripting)', () => {
    it('should sanitize reflected XSS in search', async () => {
      const xssPayload = '<script>alert("XSS")</script>'

      const response = await fetch(
        `${API_BASE}/api/dashboard/tickets?year=2026&filterType=all&search=${encodeURIComponent(xssPayload)}`
      )
      const data = await response.json()

      // Script tag should not be present in response
      const responseString = JSON.stringify(data)
      expect(responseString).not.toContain('<script>')
    })

    it('should sanitize XSS in query parameters', async () => {
      const xssPayload = '<img src=x onerror=alert("XSS")>'

      const response = await fetch(
        `${API_BASE}/api/dashboard/tickets?year=2026&filterType=all&search=${encodeURIComponent(xssPayload)}`
      )
      const data = await response.json()

      const responseString = JSON.stringify(data)
      expect(responseString).not.toContain('onerror=')
    })

    it('should handle DOM-based XSS patterns', async () => {
      const xssPayload = 'javascript:alert("XSS")'

      const response = await fetch(
        `${API_BASE}/api/dashboard/tickets?year=2026&filterType=all&search=${encodeURIComponent(xssPayload)}`
      )

      expect(response.status).toBeLessThan(500)
    })
  })

  describe('Input Validation', () => {
    it('should validate year parameter type', async () => {
      const response = await fetch(`${API_BASE}/api/dashboard/stats?year=invalid`)

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should validate month parameter range', async () => {
      const response = await fetch(`${API_BASE}/api/dashboard/stats?year=2026&month=13`)

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should validate month parameter is number', async () => {
      const response = await fetch(`${API_BASE}/api/dashboard/stats?year=2026&month=invalid`)

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle very large year values', async () => {
      const response = await fetch(`${API_BASE}/api/dashboard/stats?year=999999`)

      // Should handle gracefully - either accept or return error
      expect([200, 400, 422]).toContain(response.status)
    })
  })

  describe('Path Traversal', () => {
    it('should prevent path traversal in parameters', async () => {
      const pathTraversal = '../../../etc/passwd'

      const response = await fetch(
        `${API_BASE}/api/dashboard/ticket/${encodeURIComponent(pathTraversal)}`
      )

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle URL-encoded path traversal', async () => {
      const pathTraversal = '%2e%2e%2fetc%2fpasswd'

      const response = await fetch(
        `${API_BASE}/api/dashboard/ticket/${pathTraversal}`
      )

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})
