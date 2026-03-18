# Monthly Report Customization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add customization for monthly report sections - allow users to select which sections to display, customize section header names, and customize pie chart titles independently.

**Architecture:** Configuration modal with 3 sections (visibility, section names, chart names), persisted to localStorage, integrated into existing print report page.

**Tech Stack:** Next.js 14, TypeScript, React hooks, localStorage, Tailwind CSS, shadcn/ui

---

## File Structure

```
app/
  components/
    dashboard/
      ReportConfigModal.tsx          # NEW - Main configuration modal
      report/
        PageHeader.tsx               # NEW - Extracted from print page
        PieChartSection.tsx          # NEW - Extracted from print page
  lib/
    reportConfig.ts                  # NEW - Config management utilities
    reportSections.ts                # MODIFY - Add custom name fields to interface
  report/
    print/
      page.tsx                       # MODIFY - Use custom settings, extract components
```

---

## Chunk 1: Foundation - Library and Type Updates

This chunk establishes the data structure and utility functions needed for the feature.

### Task 1: Update reportSections.ts type definitions

**Files:**
- Modify: `app/lib/reportSections.ts:6-13`

- [ ] **Step 1: Add custom name fields to ReportSectionConfig interface**

```typescript
// Update the interface to include:
export interface ReportSectionConfig {
  id: string
  name: string
  nameThai: string
  description: string
  enabled: boolean
  order: number

  // NEW: Custom names (optional)
  customSectionName?: string    // Custom header name
  customChartName?: string      // Custom pie chart title
}
```

- [ ] **Step 2: Run type check to verify changes**

Run: `npm run type-check` or `npx tsc --noEmit`
Expected: No type errors (customSectionName and customChartName are optional)

- [ ] **Step 3: Commit**

```bash
git add app/lib/reportSections.ts
git commit -m "feat: add custom name fields to ReportSectionConfig

Add optional customSectionName and customChartName fields
to support report customization feature."
```

### Task 2: Create reportConfig.ts utility library

**Files:**
- Create: `app/lib/reportConfig.ts`

- [ ] **Step 1: Create the file with utility functions**

```typescript
/**
 * Report Custom Name Configuration
 * Manages custom section and chart names for monthly reports
 */

import type { ReportSectionConfig } from './reportSections'

const NAMES_STORAGE_KEY = 'monthly-report-section-names'

export interface CustomNamesConfig {
  [sectionId: string]: {
    customSectionName?: string
    customChartName?: string
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
 */
export function saveCustomNames(names: CustomNamesConfig): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names))
  } catch (error) {
    console.error('Failed to save custom names:', error)
    throw error
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
 */
export function getSectionDisplayName(config: ReportSectionConfig): string {
  const customName = config.customSectionName?.trim()
  return customName && customName.length > 0 ? customName : config.nameThai
}

/**
 * Get display name for a chart
 * Priority: customChartName > DEFAULT_CHART_TITLES
 */
export function getChartDisplayName(config: ReportSectionConfig): string {
  const customName = config.customChartName?.trim()
  if (customName && customName.length > 0) {
    return customName
  }
  return DEFAULT_CHART_TITLES[config.id] || config.name
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
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit app/lib/reportConfig.ts`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/lib/reportConfig.ts
git commit -m "feat: add reportConfig utility library

Add functions for managing custom section and chart names:
- loadCustomNames/saveCustomNames for localStorage
- resetCustomNames to clear all custom names
- getSectionDisplayName/getChartDisplayName for display logic
- mergeCustomNames/extractCustomNames for data transformation"
```

---

## Chunk 2: Extracted Components

This chunk extracts inline components from the print page to make them reusable with custom title support.

### Task 3: Extract PageHeader component

**Files:**
- Create: `app/components/dashboard/report/PageHeader.tsx`

- [ ] **Step 1: Create PageHeader component with custom title support**

```typescript
'use client'

interface PageHeaderProps {
  title: string
  subtitle: string
  customTitle?: string
}

export default function PageHeader({ title, subtitle, customTitle }: PageHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h2>
      <p className="text-lg text-neutral-600">{customTitle || subtitle}</p>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit app/components/dashboard/report/PageHeader.tsx`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/report/PageHeader.tsx
git commit -m "feat: extract PageHeader component with custom title support

Extract from print page for reusability.
Supports optional customTitle prop for report customization."
```

### Task 4: Extract PieChartSection component

**Files:**
- Create: `app/components/dashboard/report/PieChartSection.tsx`

- [ ] **Step 1: Create PieChartSection component with custom title support**

```typescript
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface ReportSectionItem {
  id: string
  name: string
  count: number
}

interface PieChartSectionProps {
  title: string
  data: ReportSectionItem[]
  total: number
  customTitle?: string
}

const CHART_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'
]

export default function PieChartSection({ title, data, total, customTitle }: PieChartSectionProps) {
  const displayTitle = customTitle || title
  const chartData = data
    .filter(item => item.count > 0)
    .map((item, index) => ({
      name: item.name,
      value: item.count,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

  return (
    <div className="flex flex-col gap-8">
      {/* Pie Chart */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{displayTitle}</h3>
            <p className="text-4xl font-bold text-primary-600">{total} Tickets</p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-400">
              ไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-400">
              <th className="text-left py-3 px-4 font-bold text-neutral-900">No</th>
              <th className="text-left py-3 px-4 font-bold text-neutral-900">{displayTitle}</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-900">Count</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-900">%</th>
            </tr>
          </thead>
          <tbody>
            {data.filter(item => item.count > 0).map((item, index) => (
              <tr key={item.id} className="border-b border-neutral-300">
                <td className="py-3 px-4 text-neutral-700">{index + 1}</td>
                <td className="py-3 px-4 text-neutral-900">{item.name}</td>
                <td className="py-3 px-4 text-neutral-900 text-right">{item.count}</td>
                <td className="py-3 px-4 text-neutral-900 text-right">
                  {((item.count / total) * 100).toFixed(1)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-neutral-400 font-bold bg-neutral-50">
              <td className="py-3 px-4 text-neutral-900" colSpan={2}>Grand Total</td>
              <td className="py-3 px-4 text-neutral-900 text-right">{total}</td>
              <td className="py-3 px-4 text-neutral-900 text-right">100.0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit app/components/dashboard/report/PieChartSection.tsx`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/report/PieChartSection.tsx
git commit -m "feat: extract PieChartSection component with custom title support

Extract from print page for reusability.
Supports optional customTitle prop for chart title customization."
```

---

## Chunk 3: ReportConfigModal Component

This chunk creates the main configuration modal for users to customize their reports.

### Task 5: Create ReportConfigModal component

**Files:**
- Create: `app/components/dashboard/ReportConfigModal.tsx`

- [ ] **Step 1: Create the modal component**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReportSectionConfig } from '@/lib/reportSections'
import {
  loadCustomNames,
  saveCustomNames,
  resetCustomNames,
  extractCustomNames
} from '@/lib/reportConfig'

interface ReportConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ReportSectionConfig[]) => void
  sections: ReportSectionConfig[]
}

const MAX_NAME_LENGTH = 100

export default function ReportConfigModal({
  isOpen,
  onClose,
  onSave,
  sections: initialSections
}: ReportConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<ReportSectionConfig[]>(initialSections)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Load custom names when modal opens
  useEffect(() => {
    if (isOpen) {
      const customNames = loadCustomNames()
      const merged = initialSections.map(section => ({
        ...section,
        customSectionName: customNames[section.id]?.customSectionName,
        customChartName: customNames[section.id]?.customChartName
      }))
      setLocalConfig(merged)
    }
  }, [isOpen, initialSections])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showResetConfirm) {
          setShowResetConfirm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, showResetConfirm, onClose])

  const toggleSection = (sectionId: string) => {
    setLocalConfig(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    )
  }

  const updateSectionName = (sectionId: string, value: string) => {
    const trimmed = value.trim()
    setLocalConfig(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, customSectionName: trimmed || undefined } : s
      )
    )
  }

  const updateChartName = (sectionId: string, value: string) => {
    const trimmed = value.trim()
    setLocalConfig(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, customChartName: trimmed || undefined } : s
      )
    )
  }

  const canSave = () => {
    return localConfig.some(s => s.enabled)
  }

  const handleSave = () => {
    if (!canSave()) return

    // Save custom names to localStorage
    const customNames = extractCustomNames(localConfig)
    saveCustomNames(customNames)

    // Call parent callback with merged config
    onSave(localConfig)
    onClose()
  }

  const handleResetConfirm = () => {
    setShowResetConfirm(true)
  }

  const handleResetConfirmed = () => {
    resetCustomNames()
    // Clear custom names from local state
    setLocalConfig(prev =>
      prev.map(s => ({
        ...s,
        customSectionName: undefined,
        customChartName: undefined
      }))
    )
    setShowResetConfirm(false)
  }

  const enabledCount = localConfig.filter(s => s.enabled).length
  const enabledSections = localConfig.filter(s => s.enabled)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-neutral-900">
              ⚙️ ตั้งค่ารายงานประจำเดือน
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
              aria-label="ปิด"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Section 1: Visibility */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 pb-2 border-b">
                1. เลือกส่วนที่จะแสดงในรายงาน
              </h3>
              <div className="space-y-2">
                {localConfig.map((section) => (
                  <label
                    key={section.id}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer ${
                      enabledCount === 1 && section.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => toggleSection(section.id)}
                      disabled={enabledCount === 1 && section.enabled}
                      className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-neutral-900">{section.nameThai}</span>
                    {enabledCount === 1 && section.enabled && (
                      <span className="text-xs text-neutral-500">(ต้องเลือกอย่างน้อย 1 ส่วน)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Section 2: Custom Section Names */}
            {enabledSections.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 pb-2 border-b">
                  2. ชื่อหัวข้อแต่ละส่วน
                </h3>
                <div className="space-y-3">
                  {enabledSections.map((section) => (
                    <div key={`section-name-${section.id}`}>
                      <label className="block text-sm text-neutral-700 mb-1">
                        {section.nameThai}:
                      </label>
                      <input
                        type="text"
                        value={section.customSectionName || ''}
                        onChange={(e) => updateSectionName(section.id, e.target.value)}
                        placeholder={`ค่าเริ่มต้น: ${section.nameThai}`}
                        maxLength={MAX_NAME_LENGTH}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Custom Chart Names */}
            {enabledSections.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 pb-2 border-b">
                  3. ชื่อกราฟวงกลมแต่ละกราฟ
                </h3>
                <div className="space-y-3">
                  {enabledSections.map((section) => {
                    const defaultTitle = {
                      section1: 'Category',
                      section2: 'Software',
                      section3: 'Sub Services',
                      section4: 'Causes'
                    }[section.id] || section.name

                    return (
                      <div key={`chart-name-${section.id}`}>
                        <label className="block text-sm text-neutral-700 mb-1">
                          กราฟ {defaultTitle}:
                        </label>
                        <input
                          type="text"
                          value={section.customChartName || ''}
                          onChange={(e) => updateChartName(section.id, e.target.value)}
                          placeholder={`ค่าเริ่มต้น: ${defaultTitle}`}
                          maxLength={MAX_NAME_LENGTH}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t bg-neutral-50">
            <button
              onClick={handleResetConfirm}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
            >
              คืนค่าเริ่มต้น
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              ยืนยันการคืนค่า
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              คุณต้องการคืนค่าชื่อทั้งหมดเป็นค่าเริ่มต้นหรือไม่?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetConfirmed}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors text-sm"
              >
                คืนค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit app/components/dashboard/ReportConfigModal.tsx`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/ReportConfigModal.tsx
git commit -m "feat: add ReportConfigModal component

Modal for customizing monthly report:
- Section visibility checkboxes
- Custom section name inputs
- Custom chart name inputs
- Reset confirmation dialog
- Keyboard navigation (Escape to close)"
```

---

## Chunk 4: Print Page Integration

This chunk integrates all the new components into the print page and adds the configuration button.

### Task 6: Update print page to use extracted components

**Files:**
- Modify: `app/report/print/page.tsx`

- [ ] **Step 1: Add imports and state for custom configuration**

Replace lines 1-34 with:

```typescript
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadSectionPreferences, mergeCustomNames } from '@/lib/reportSections'
import { loadCustomNames, getSectionDisplayName, getChartDisplayName } from '@/lib/reportConfig'
import PageHeader from '@/components/dashboard/report/PageHeader'
import PieChartSection from '@/components/dashboard/report/PieChartSection'
import ReportConfigModal from '@/components/dashboard/ReportConfigModal'

interface ReportSectionItem {
  id: string
  name: string
  count: number
}

interface ReportData {
  year: number
  month: number
  monthNameThai: string
  monthNameEnglish: string
  totalTickets: number
  section1: ReportSectionItem[]
  section2: ReportSectionItem[]
  section3: ReportSectionItem[]
  section4: ReportSectionItem[]
  totals: {
    section1: number
    section2: number
    section3: number
    section4: number
  }
}

const CHART_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'
]
```

- [ ] **Step 2: Add state and load custom names in PrintReportContent**

Replace lines 36-60 with:

```typescript
function PrintReportContent() {
  const searchParams = useSearchParams()
  const year = Number(searchParams.get('year')) || new Date().getFullYear()
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [sectionConfig, setSectionConfig] = useState(loadSectionPreferences)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/dashboard/report?year=${year}&month=${month}`)
        if (!res.ok) throw new Error('Failed to fetch report')
        const data = await res.json()
        setReportData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [year, month])

  // Load custom names on mount
  useEffect(() => {
    const customNames = loadCustomNames()
    const merged = mergeCustomNames(sectionConfig, customNames)
    setSectionConfig(merged)
  }, [])

  const handleConfigSave = (newConfig: typeof sectionConfig) => {
    setSectionConfig(newConfig)
    // Trigger re-render by updating state
  }
```

- [ ] **Step 3: Add config button to header**

Replace the header div (lines 98-117) with:

```typescript
      {/* Header - no print */}
      <div className="no-print bg-neutral-100 p-4 text-center border-b sticky top-0 z-10">
        <p className="text-sm text-neutral-600 mb-2">
          หน้าต่างนี้จะปิดอัตโนมัติหลังจากพิมพ์เสร็จ หรือกดปุ่มด้านล่าง
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ตั้งค่ารายงาน
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            พิมพ์ / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Config Modal */}
      <ReportConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleConfigSave}
        sections={sectionConfig}
      />
```

- [ ] **Step 4: Update section rendering with AND logic and custom names**

Replace the sections rendering (lines 143-201) with:

```typescript
        {/* Section 1: Category */}
        {sectionConfig.find(s => s.id === 'section1')?.enabled && reportData.totals.section1 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Ticket ${reportData.monthNameEnglish} ${reportData.year}`}
              subtitle="ส่วนที่ 1: ภาพรวม Ticket ทั้งหมด"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section1')!)}
            />
            <PieChartSection
              title="Category"
              data={reportData.section1}
              total={reportData.totals.section1}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section1')!)}
            />
          </div>
        )}

        {/* Section 2: Software */}
        {sectionConfig.find(s => s.id === 'section2')?.enabled && reportData.totals.section2 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Software ${reportData.totals.section2} Tickets`}
              subtitle="ส่วนที่ 2: เจาะลึกหมวด Software"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section2')!)}
            />
            <PieChartSection
              title="Software"
              data={reportData.section2}
              total={reportData.totals.section2}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section2')!)}
            />
          </div>
        )}

        {/* Section 3: Sub Services */}
        {sectionConfig.find(s => s.id === 'section3')?.enabled && reportData.totals.section3 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Software ${reportData.totals.section3} Tickets`}
              subtitle="ส่วนที่ 3: การจัดกลุ่มปัญหา Software"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section3')!)}
            />
            <PieChartSection
              title="Sub Services"
              data={reportData.section3}
              total={reportData.totals.section3}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section3')!)}
            />
          </div>
        )}

        {/* Section 4: POS/RATE Causes */}
        {sectionConfig.find(s => s.id === 'section4')?.enabled && reportData.totals.section4 > 0 && (
          <div className="print-page">
            <PageHeader
              title={`POS/RATE Error ${reportData.section3.find((s: ReportSectionItem) => s.id === 'pos_rate_error')?.count || 0} Tickets`}
              subtitle="สาเหตุของ POS/RATE Error"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section4')!)}
            />
            <PieChartSection
              title="Causes"
              data={reportData.section4}
              total={reportData.totals.section4}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section4')!)}
            />
          </div>
        )}
```

- [ ] **Step 5: Remove inline components**

Delete lines 222-309 (the old inline PageHeader and PieChartSection functions) as they are now in separate files.

- [ ] **Step 6: Run type check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: No type errors, build succeeds

- [ ] **Step 7: Commit**

```bash
git add app/report/print/page.tsx
git commit -m "feat: integrate report customization into print page

- Add ReportConfigModal with settings button
- Load and merge custom names from localStorage
- Apply AND logic for section visibility (enabled AND has data)
- Use extracted PageHeader and PieChartSection components
- Support custom titles for sections and charts"
```

---

## Testing

### Manual Testing Checklist

- [ ] Open print page, click "⚙️ ตั้งค่ารายงาน" button
- [ ] Verify modal opens with all sections checked
- [ ] Uncheck a section, save, verify it doesn't appear
- [ ] Try to uncheck last section - verify it's disabled
- [ ] Set custom section name, save, verify it appears in report
- [ ] Set custom chart name, save, verify it appears in report
- [ ] Click "คืนค่าเริ่มต้น", confirm, verify names reset
- [ ] Set empty name, verify default is used
- [ ] Reload page, verify settings persist
- [ ] Test keyboard: Escape closes modal, Tab navigates fields

### Browser Testing

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari (if available)
- [ ] Test on mobile viewport

---

## Post-Implementation

- [ ] Update CLAUDE.md with new feature reference
- [ ] Test with actual report data
- [ ] Verify PDF export works with custom names
