import { describe, it, expect } from 'vitest'
import { formatMinutes } from '@/lib/formatTime'

describe('formatTime', () => {
  it('should format minutes to hours and minutes', () => {
    expect(formatMinutes(60)).toBe('1 ชม.')
    expect(formatMinutes(120)).toBe('2 ชม.')
    expect(formatMinutes(150)).toBe('2 ชม. 30 นาที')
  })

  it('should format less than an hour', () => {
    expect(formatMinutes(30)).toBe('30 นาที')
    expect(formatMinutes(45)).toBe('45 นาที')
  })

  it('should format zero minutes', () => {
    expect(formatMinutes(0)).toBe('0 นาที')
  })

  it('should handle large values (days)', () => {
    expect(formatMinutes(1440)).toBe('1 วัน') // 1 day
    expect(formatMinutes(1500)).toBe('1 วัน 1 ชม.') // 1 day 1 hour
    expect(formatMinutes(1530)).toBe('1 วัน 1 ชม. 30 นาที')
  })

  it('should handle null or undefined', () => {
    expect(formatMinutes(null as any)).toBe('-')
    expect(formatMinutes(undefined as any)).toBe('-')
  })

  it('should handle negative values', () => {
    expect(formatMinutes(-1)).toBe('-')
  })
})
