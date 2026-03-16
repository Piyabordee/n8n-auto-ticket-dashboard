import { normalizeStylizedText, hasStylizedText } from '../../app/lib/normalizeText'

describe('normalizeStylizedText', () => {
  describe('basic functionality', () => {
    it('should return the same text if no stylized characters are present', () => {
      expect(normalizeStylizedText('Hello World')).toBe('Hello World')
      expect(normalizeStylizedText('สมชาย ใจดี')).toBe('สมชาย ใจดี')
      expect(normalizeStylizedText('Test123')).toBe('Test123')
    })

    it('should handle empty string', () => {
      expect(normalizeStylizedText('')).toBe('')
    })

    it('should return null/undefined as-is', () => {
      expect(normalizeStylizedText(null as any)).toBe(null)
      expect(normalizeStylizedText(undefined as any)).toBe(undefined)
    })
  })

  describe('Enclosed Alphanumerics (squared letters)', () => {
    it('should convert squared uppercase letters to regular ASCII', () => {
      expect(normalizeStylizedText('🆃🅾🅲🆃🅰🅲🅺')).toBe('TOCTACK')
      expect(normalizeStylizedText('🅰🅱🅲')).toBe('ABC')
      expect(normalizeStylizedText('🆇🆈🆉')).toBe('XYZ')
    })

    it('should convert mixed stylized and regular text', () => {
      expect(normalizeStylizedText('🆃est 🅰pple')).toBe('Test Apple')
      expect(normalizeStylizedText('User: 🆂')).toBe('User: S')
    })

    it('should convert all squared letters from A-Z', () => {
      const allSquared = '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉'
      expect(normalizeStylizedText(allSquared)).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    })
  })

  describe('Fullwidth characters', () => {
    it('should convert fullwidth uppercase letters to regular ASCII', () => {
      expect(normalizeStylizedText('\uFF21\uFF22\uFF23')).toBe('ABC')
      expect(normalizeStylizedText('ＴＥＳＴ')).toBe('TEST')
    })

    it('should convert fullwidth lowercase letters to regular ASCII', () => {
      expect(normalizeStylizedText('\uFF41\uFF42\uFF43')).toBe('abc')
      expect(normalizeStylizedText('ｔｅｓｔ')).toBe('test')
    })

    it('should convert mixed fullwidth text', () => {
      expect(normalizeStylizedText('Ｈｅｌｌｏ Ｗｏｒｌｄ')).toBe('Hello World')
    })
  })

  describe('Unicode normalization (NFKC)', () => {
    it('should normalize combining characters', () => {
      // Combined é (e + combining acute)
      const combined = 'e\u0301' // e + combining acute accent
      const normalized = normalizeStylizedText(combined)
      expect(normalized).toBe('e') // combining marks should be removed
    })

    it('should handle Thai characters with tone marks', () => {
      expect(normalizeStylizedText('สมชาย')).toBe('สมชาย')
      expect(normalizeStylizedText('สวัสดีครับ')).toBe('สวัสดีครับ')
    })
  })

  describe('real-world examples', () => {
    it('should handle stylized names from the database', () => {
      // Example of how a stylized name might appear
      expect(normalizeStylizedText('🆃🅾🅲🆃🅰🅲🅺')).toBe('TOCTACK')
      expect(normalizeStylizedText('Ｓｏｍｃｈａｉ')).toBe('Somchai')
    })

    it('should preserve Thai names while normalizing Latin parts', () => {
      expect(normalizeStylizedText('สมชาย Ｊ')).toBe('สมชาย J')
      expect(normalizeStylizedText('🆃🅰🅽🅰🆂🅰🆂')).toBe('TANASAS')
    })
  })

  describe('edge cases', () => {
    it('should handle numbers and special characters', () => {
      expect(normalizeStylizedText('Test-123')).toBe('Test-123')
      expect(normalizeStylizedText('user@example.com')).toBe('user@example.com')
    })

    it('should handle multiple spaces', () => {
      expect(normalizeStylizedText('🆃🅴🆂🆃  🆃🅴🆇🆃')).toBe('TEST  TEXT')
    })

    it('should handle very long strings', () => {
      const longText = '🆃'.repeat(1000)
      expect(normalizeStylizedText(longText)).toBe('T'.repeat(1000))
    })
  })
})

describe('hasStylizedText', () => {
  describe('Enclosed Alphanumerics detection', () => {
    it('should detect squared letters', () => {
      expect(hasStylizedText('🆃🅾🅲🆃')).toBe(true)
      expect(hasStylizedText('Test 🆃')).toBe(true)
      expect(hasStylizedText('ABC')).toBe(false)
    })
  })

  describe('Fullwidth character detection', () => {
    it('should detect fullwidth characters', () => {
      expect(hasStylizedText('ＴＥＳＴ')).toBe(true)
      expect(hasStylizedText('ｔｅｓｔ')).toBe(true)
      expect(hasStylizedText('Test')).toBe(false)
    })
  })

  describe('Mathematical Alphanumeric Symbols detection', () => {
    it('should detect mathematical alphanumeric symbols', () => {
      expect(hasStylizedText('𝐀𝐁𝐂')).toBe(true) // Mathematical bold
      expect(hasStylizedText('𝒜𝐵𝒞')).toBe(true) // Mathematical italic
      expect(hasStylizedText('ABC')).toBe(false)
    })
  })

  describe('negative cases', () => {
    it('should return false for normal ASCII text', () => {
      expect(hasStylizedText('Hello World')).toBe(false)
      expect(hasStylizedText('Test123')).toBe(false)
      expect(hasStylizedText('user@example.com')).toBe(false)
    })

    it('should return false for Thai text', () => {
      expect(hasStylizedText('สมชาย ใจดี')).toBe(false)
      expect(hasStylizedText('สวัสดีครับ')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(hasStylizedText('')).toBe(false)
    })
  })

  describe('mixed content', () => {
    it('should detect stylized text in mixed content', () => {
      expect(hasStylizedText('User: 🆃')).toBe(true)
      expect(hasStylizedText('Ｔest')).toBe(true)
      expect(hasStylizedText('Test 🅰nd Ｔｅｘｔ')).toBe(true)
    })
  })
})
