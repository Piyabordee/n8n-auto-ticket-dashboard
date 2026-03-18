/**
 * Report Section Configuration
 * Defines available sections for the monthly report
 */

export interface ReportSectionConfig {
  id: string
  name: string
  nameThai: string
  description: string
  enabled: boolean
  order: number

  // NEW: Custom names (optional) - now support multiple values as arrays
  customSectionName?: string | string[]    // Custom header name(s) - single value or array
  customChartName?: string | string[]      // Custom pie chart title(s) - single value or array
}

export type ReportSectionId = 'section1' | 'section2' | 'section3' | 'section4'

export const DEFAULT_SECTIONS: ReportSectionConfig[] = [
  {
    id: 'section1',
    name: 'Overall Ticket Summary',
    nameThai: 'ภาพรวม Ticket ทั้งหมด',
    description: 'Summary of all tickets by category',
    enabled: true,
    order: 1
  },
  {
    id: 'section2',
    name: 'Software Deep Dive',
    nameThai: 'เจาะลึกหมวด Software',
    description: 'Detailed breakdown of software tickets',
    enabled: true,
    order: 2
  },
  {
    id: 'section3',
    name: 'Software Problem Grouping',
    nameThai: 'การจัดกลุ่มปัญหา Software',
    description: 'Software problems grouped by type',
    enabled: true,
    order: 3
  },
  {
    id: 'section4',
    name: 'POS/RATE Error Causes',
    nameThai: 'สาเหตุของ POS/RATE Error',
    description: 'Causes of POS/RATE errors',
    enabled: true,
    order: 4
  }
]

const STORAGE_KEY = 'monthly-report-sections'

/**
 * Load saved section preferences from localStorage
 */
export function loadSectionPreferences(): ReportSectionConfig[] {
  if (typeof window === 'undefined') return DEFAULT_SECTIONS

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return DEFAULT_SECTIONS.map(section => ({
        ...section,
        enabled: parsed[section.id]?.enabled ?? section.enabled
      }))
    }
  } catch (error) {
    console.error('Failed to load section preferences:', error)
  }

  return DEFAULT_SECTIONS
}

/**
 * Save section preferences to localStorage
 */
export function saveSectionPreferences(sections: ReportSectionConfig[]): void {
  if (typeof window === 'undefined') return

  try {
    const toSave = sections.reduce((acc, section) => {
      acc[section.id] = { enabled: section.enabled }
      return acc
    }, {} as Record<string, { enabled: boolean }>)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('Failed to save section preferences:', error)
  }
}

/**
 * Get enabled sections only
 */
export function getEnabledSections(sections: ReportSectionConfig[]): ReportSectionConfig[] {
  return sections.filter(s => s.enabled).sort((a, b) => a.order - b.order)
}
