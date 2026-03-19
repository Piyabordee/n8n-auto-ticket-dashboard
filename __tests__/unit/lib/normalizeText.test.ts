import { describe, it, expect } from 'vitest'
import { normalizeStylizedText } from '@/lib/normalizeText'

describe('normalizeText', () => {
  describe('normalizeStylizedText', () => {
    it('should normalize stylized Unicode text to ASCII', () => {
      const stylized = '𝓗𝓮𝓵𝓵𝓸 𝓦𝓸𝓻𝓵𝓭'
      const normalized = normalizeStylizedText(stylized)
      expect(normalized).toBe('Hello World')
    })

    it('should handle mixed stylized and regular text', () => {
      const mixed = '𝓗𝓮𝓵𝓵𝓸 World'
      const normalized = normalizeStylizedText(mixed)
      expect(normalized).toBe('Hello World')
    })

    it('should handle empty string', () => {
      const empty = ''
      const normalized = normalizeStylizedText(empty)
      expect(normalized).toBe('')
    })

    it('should handle regular ASCII text', () => {
      const regular = 'Regular Text'
      const normalized = normalizeStylizedText(regular)
      expect(normalized).toBe('Regular Text')
    })

    it('should handle text with numbers', () => {
      const withNumbers = '𝓣𝓮𝓼𝓽123'
      const normalized = normalizeStylizedText(withNumbers)
      expect(normalized).toBe('Test123')
    })

    it('should handle text with special characters', () => {
      const withSpecial = '𝓗𝓮𝓵𝓵𝓸@#$%'
      const normalized = normalizeStylizedText(withSpecial)
      expect(normalized).toBe('Hello@#$%')
    })

    it('should handle text with spaces', () => {
      const withSpaces = '𝓗𝓮𝓵𝓵𝓸   𝓦𝓸𝓻𝓵𝓭'
      const normalized = normalizeStylizedText(withSpaces)
      expect(normalized).toBe('Hello   World')
    })

    it('should handle null or undefined', () => {
      expect(normalizeStylizedText(null as any)).toBe('')
      expect(normalizeStylizedText(undefined as any)).toBe('')
    })

    it('should preserve Thai characters', () => {
      const thai = 'สวัสดีชาวโลก'
      const normalized = normalizeStylizedText(thai)
      expect(normalized).toBe('สวัสดีชาวโลก')
    })

    it('should handle mixed Thai and stylized text', () => {
      const mixed = '𝓗𝓮𝓵𝓵𝓸สวัสดี'
      const normalized = normalizeStylizedText(mixed)
      expect(normalized).toBe('Helloสวัสดี')
    })
  })
})
