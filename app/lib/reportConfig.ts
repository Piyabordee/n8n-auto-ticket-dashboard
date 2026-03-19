/**
 * Report Custom Name Configuration
 * Manages custom section and chart names for monthly reports
 */

import type { ReportSectionConfig } from './reportSections'

const NAMES_STORAGE_KEY = 'monthly-report-section-names'

export interface CustomNamesConfig {
  [sectionId: string]: {
    customSectionName?: string | string[]
    customChartName?: string | string[]
  }
}

export const DEFAULT_CHART_TITLES: Record<string, string> = {
  section1: 'Category',
  section2: 'Software',
  section3: 'Sub Services',
  section4: 'Causes'
}

/**
 * Load custom names from localStorage
 * Returns empty object if none exist or on error
 */
export function loadCustomNames(): CustomNamesConfig {
  if (typeof window === 'undefined') return {}

  try {
    const saved = localStorage.getItem(NAMES_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load custom names:', error)
    // Clear corrupted data
    localStorage.removeItem(NAMES_STORAGE_KEY)
  }

  return {}
}

/**
 * Save custom names to localStorage
 * Returns false if save fails
 */
export function saveCustomNames(names: CustomNamesConfig): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names))
    return true
  } catch (error) {
    console.error('Failed to save custom names:', error)
    return false
  }
}

/**
 * Reset all custom names to defaults
 */
export function resetCustomNames(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(NAMES_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to reset custom names:', error)
  }
}

/**
 * Get display name for a section header
 * Priority: customSectionName > nameThai
 * Supports single string or array of strings
 */
export function getSectionDisplayName(config: ReportSectionConfig): string {
  const customName = config.customSectionName
  if (!customName) return config.nameThai

  if (Array.isArray(customName)) {
    return customName.length > 0 ? customName.join(', ') : config.nameThai
  }

  const trimmed = customName.trim()
  return trimmed.length > 0 ? trimmed : config.nameThai
}

/**
 * Get display name for a chart
 * Priority: customChartName > DEFAULT_CHART_TITLES
 * Supports single string or array of strings
 */
export function getChartDisplayName(config: ReportSectionConfig): string {
  const customName = config.customChartName
  if (!customName) {
    return DEFAULT_CHART_TITLES[config.id] || config.name
  }

  if (Array.isArray(customName)) {
    return customName.length > 0 ? customName.join(', ') : DEFAULT_CHART_TITLES[config.id] || config.name
  }

  const trimmed = customName.trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_CHART_TITLES[config.id] || config.name
}

/**
 * Merge custom names into section config
 */
export function mergeCustomNames(
  sections: ReportSectionConfig[],
  customNames: CustomNamesConfig
): ReportSectionConfig[] {
  return sections.map(section => ({
    ...section,
    customSectionName: customNames[section.id]?.customSectionName,
    customChartName: customNames[section.id]?.customChartName
  }))
}

/**
 * Extract custom names from section config for saving
 */
export function extractCustomNames(sections: ReportSectionConfig[]): CustomNamesConfig {
  return sections.reduce((acc, section) => {
    if (section.customSectionName || section.customChartName) {
      acc[section.id] = {
        ...(section.customSectionName && { customSectionName: section.customSectionName }),
        ...(section.customChartName && { customChartName: section.customChartName })
      }
    }
    return acc
  }, {} as CustomNamesConfig)
}
