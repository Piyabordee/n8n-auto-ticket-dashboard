import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadCustomNames,
  saveCustomNames,
  resetCustomNames,
  getSectionDisplayName,
  getChartDisplayName,
  mergeCustomNames,
  extractCustomNames,
} from '@/lib/reportConfig'

describe('reportConfig', () => {
  const LOCAL_STORAGE_KEY = 'monthly-report-section-names'

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    global.localStorage = localStorageMock as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('loadCustomNames', () => {
    it('should load custom names from localStorage', () => {
      const mockNames = {
        section1: { customChartName: 'Custom Category', customSectionName: 'Overview' },
      }
      ;(global.localStorage.getItem as any).mockReturnValue(
        JSON.stringify(mockNames)
      )

      const result = loadCustomNames()
      expect(result).toEqual(mockNames)
    })

    it('should return empty object if no custom names saved', () => {
      ;(global.localStorage.getItem as any).mockReturnValue(null)

      const result = loadCustomNames()
      expect(result).toEqual({})
    })

    it('should return empty object if localStorage is disabled', () => {
      ;(global.localStorage.getItem as any).mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      const result = loadCustomNames()
      expect(result).toEqual({})
    })
  })

  describe('saveCustomNames', () => {
    it('should save custom names to localStorage', () => {
      const mockNames = {
        section1: { customChartName: 'Custom Category', customSectionName: 'Overview' },
      }

      saveCustomNames(mockNames)

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify(mockNames)
      )
    })

    it('should return false when localStorage fails', () => {
      const mockNames = {
        section1: { customChartName: 'Custom Category', customSectionName: 'Overview' },
      }
      ;(global.localStorage.setItem as any).mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      const result = saveCustomNames(mockNames)
      expect(result).toBe(false)
    })
  })

  describe('resetCustomNames', () => {
    it('should clear custom names from localStorage', () => {
      resetCustomNames()

      expect(global.localStorage.removeItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY
      )
    })

    it('should handle localStorage errors gracefully', () => {
      ;(global.localStorage.removeItem as any).mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      expect(() => resetCustomNames()).not.toThrow()
    })
  })

  describe('getSectionDisplayName', () => {
    it('should return custom section name if available', () => {
      const config = {
        id: 'section1',
        name: 'Overall Ticket Summary',
        nameThai: 'ภาพรวม Ticket ทั้งหมด',
        description: '',
        enabled: true,
        order: 1,
        customSectionName: 'Overview',
      }

      const result = getSectionDisplayName(config)
      expect(result).toBe('Overview')
    })

    it('should return default section name if no custom name', () => {
      const config = {
        id: 'section1',
        name: 'Overall Ticket Summary',
        nameThai: 'ภาพรวม Ticket ทั้งหมด',
        description: '',
        enabled: true,
        order: 1,
      }

      const result = getSectionDisplayName(config)
      expect(result).toBe('ภาพรวม Ticket ทั้งหมด')
    })

    it('should handle array custom section name', () => {
      const config = {
        id: 'section1',
        name: 'Overall Ticket Summary',
        nameThai: 'ภาพรวม Ticket ทั้งหมด',
        description: '',
        enabled: true,
        order: 1,
        customSectionName: ['Hardware', 'Software'],
      }

      const result = getSectionDisplayName(config)
      expect(result).toBe('Hardware, Software')
    })
  })

  describe('getChartDisplayName', () => {
    it('should return custom chart name if available', () => {
      const config = {
        id: 'section1',
        name: 'Overall Ticket Summary',
        nameThai: 'ภาพรวม Ticket ทั้งหมด',
        description: '',
        enabled: true,
        order: 1,
        customChartName: 'Custom Category',
      }

      const result = getChartDisplayName(config)
      expect(result).toBe('Custom Category')
    })

    it('should return default chart name if no custom name', () => {
      const config = {
        id: 'section1',
        name: 'Overall Ticket Summary',
        nameThai: 'ภาพรวม Ticket ทั้งหมด',
        description: '',
        enabled: true,
        order: 1,
      }

      const result = getChartDisplayName(config)
      expect(result).toBe('Category')
    })

    it('should handle array custom chart name', () => {
      const config = {
        id: 'section1',
        name: 'Overall Ticket Summary',
        nameThai: 'ภาพรวม Ticket ทั้งหมด',
        description: '',
        enabled: true,
        order: 1,
        customChartName: ['Hardware', 'Software'],
      }

      const result = getChartDisplayName(config)
      expect(result).toBe('Hardware, Software')
    })
  })

  describe('mergeCustomNames', () => {
    it('should merge custom names into sections', () => {
      const sections = [
        {
          id: 'section1',
          name: 'Overall Ticket Summary',
          nameThai: 'ภาพรวม Ticket ทั้งหมด',
          description: '',
          enabled: true,
          order: 1,
          chartName: 'Software',
        },
        {
          id: 'section2',
          name: 'Software Deep Dive',
          nameThai: 'เจาะลึกหมวด Software',
          description: '',
          enabled: true,
          order: 2,
          chartName: 'Hardware',
        },
      ] as any
      const customNames = {
        section1: { customChartName: 'Custom Software' },
      }

      const result = mergeCustomNames(sections, customNames)

      expect(result[0].customChartName).toBe('Custom Software')
      expect(result[1].customChartName).toBeUndefined()
    })

    it('should handle empty custom names', () => {
      const sections = [
        {
          id: 'section1',
          name: 'Overall Ticket Summary',
          nameThai: 'ภาพรวม Ticket ทั้งหมด',
          description: '',
          enabled: true,
          order: 1,
          chartName: 'Software',
        },
      ] as any
      const customNames = {}

      const result = mergeCustomNames(sections, customNames)

      expect(result[0].customChartName).toBeUndefined()
    })
  })

  describe('extractCustomNames', () => {
    it('should extract custom names from sections', () => {
      const sections = [
        {
          id: 'section1',
          name: 'Overall Ticket Summary',
          nameThai: 'ภาพรวม Ticket ทั้งหมด',
          description: '',
          enabled: true,
          order: 1,
          customChartName: 'Custom Software',
        },
        {
          id: 'section2',
          name: 'Software Deep Dive',
          nameThai: 'เจาะลึกหมวด Software',
          description: '',
          enabled: true,
          order: 2,
          chartName: 'Hardware',
        },
      ] as any

      const result = extractCustomNames(sections)

      expect(result).toEqual({
        section1: { customChartName: 'Custom Software' },
      })
    })

    it('should return empty object if no custom names', () => {
      const sections = [
        {
          id: 'section1',
          name: 'Overall Ticket Summary',
          nameThai: 'ภาพรวม Ticket ทั้งหมด',
          description: '',
          enabled: true,
          order: 1,
          chartName: 'Software',
        },
        {
          id: 'section2',
          name: 'Software Deep Dive',
          nameThai: 'เจาะลึกหมวด Software',
          description: '',
          enabled: true,
          order: 2,
          chartName: 'Hardware',
        },
      ] as any

      const result = extractCustomNames(sections)

      expect(result).toEqual({})
    })
  })
})
