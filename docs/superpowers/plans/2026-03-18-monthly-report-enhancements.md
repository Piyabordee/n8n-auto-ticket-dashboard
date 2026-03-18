# Monthly Report Modal Enhancements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the MonthlyReportModal with proper button styling, section selection dropdown, and improved PDF export functionality.

**Architecture:**
- Add SectionSelectorDropdown component for selecting which report sections to display
- Fix button styling by using correct Tailwind color scale classes (bg-primary-600 instead of bg-primary)
- Implement improved PDF export using jsPDF library for proper multi-page PDF generation with pie charts
- Store user's section selection in localStorage for persistence

**Tech Stack:**
- React hooks (useState, useEffect, useRef)
- Tailwind CSS for styling
- jsPDF + html2canvas for PDF generation
- localStorage for persistence

**Reference:**
- Current implementation: `app/components/dashboard/MonthlyReportModal.tsx`
- Reference PDF: `data/env/ref_graph.pdf`
- Reference images: `data/env/ref_graph_page-*.jpg`

---

## Chunk 1: Fix Button Styling and Setup

### Task 1: Fix Export Button Styling

**Files:**
- Modify: `app/components/dashboard/MonthlyReportModal.tsx:245-267`

- [ ] **Step 1: Update Export PDF button className**

Change `bg-primary` to `bg-primary-600` and `hover:bg-primary-700` to ensure the button shows the correct blue color by default.

```tsx
// OLD (line 248):
className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-1.5"

// NEW:
className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-1.5"
```

- [ ] **Step 2: Test the button color**

Run: `npm run dev`
Expected: Export PDF button shows blue color (primary-600) by default, without hover

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/MonthlyReportModal.tsx
git commit -m "fix: correct export button to use bg-primary-600 for proper blue color display"
```

---

## Chunk 2: Section Selection Feature

### Task 2: Add Section Selection Types and Constants

**Files:**
- Create: `app/lib/reportSections.ts`

- [ ] **Step 1: Create section configuration file**

Define the available report sections and their properties.

```typescript
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
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/lib/reportSections.ts
git commit -m "feat: add report section configuration with localStorage persistence"
```

---

### Task 3: Create SectionSelectorDropdown Component

**Files:**
- Create: `app/components/dashboard/SectionSelectorDropdown.tsx`

- [ ] **Step 1: Create the dropdown component**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReportSectionConfig } from '@/lib/reportSections'

interface SectionSelectorDropdownProps {
  sections: ReportSectionConfig[]
  onSectionsChange: (sections: ReportSectionConfig[]) => void
}

export default function SectionSelectorDropdown({
  sections,
  onSectionsChange
}: SectionSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSection = (sectionId: string) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    )
    onSectionsChange(updated)
  }

  const enabledCount = sections.filter(s => s.enabled).length
  const totalCount = sections.length

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="เลือกส่วนของรายงาน"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="hidden sm:inline">
          เลือกส่วน ({enabledCount}/{totalCount})
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-elevated border border-neutral-200 py-2 z-50"
          role="listbox"
          aria-label="เลือกส่วนของรายงาน"
        >
          <div className="px-3 py-2 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900">
              เลือกส่วนที่ต้องการแสดง
            </p>
            <p className="text-xs text-neutral-500">
              เลือกอย่างน้อย 1 ส่วน
            </p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {sections.map((section) => (
              <label
                key={section.id}
                className="flex items-start gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => toggleSection(section.id)}
                  disabled={enabledCount === 1 && section.enabled}
                  className="mt-0.5 w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {section.nameThai}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {section.name}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-neutral-100">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/SectionSelectorDropdown.tsx
git commit -m "feat: add SectionSelectorDropdown component for selecting report sections"
```

---

### Task 4: Integrate Section Selector into MonthlyReportModal

**Files:**
- Modify: `app/components/dashboard/MonthlyReportModal.tsx`
- Modify: `app/components/dashboard/MonthlyReportModal.tsx:299-353` (ReportContent component)

- [ ] **Step 1: Add imports and state for section selection**

Add at the top of the file after existing imports:

```typescript
import SectionSelectorDropdown from './SectionSelectorDropdown'
import {
  DEFAULT_SECTIONS,
  loadSectionPreferences,
  saveSectionPreferences,
  getEnabledSections,
  type ReportSectionConfig
} from '@/lib/reportSections'
```

- [ ] **Step 2: Add state for sections in MonthlyReportModal component**

Add after existing state declarations (around line 67):

```typescript
const [sections, setSections] = useState<ReportSectionConfig[]>(DEFAULT_SECTIONS)
```

- [ ] **Step 3: Load saved preferences on mount**

Add after the existing useEffect for animation (around line 78):

```typescript
// Load saved section preferences
useEffect(() => {
  const saved = loadSectionPreferences()
  setSections(saved)
}, [])
```

- [ ] **Step 4: Update header to include section selector**

Replace the header section (lines 235-279) with:

```tsx
{/* Header */}
<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between gap-2 no-print">
  <div className="min-w-0 flex-1">
    <h2 id={titleId} className="text-base sm:text-xl font-semibold text-neutral-900 truncate">
      รายงานประจำเดือน{reportData?.monthNameThai || ''} {year}
    </h2>
    <p id={descId} className="text-xs sm:text-sm text-neutral-500 mt-1">
      สรุปปริมาณงานและการแจกแจงตามหมวดหมู่
    </p>
  </div>
  <div className="flex items-center gap-2 flex-shrink-0">
    <SectionSelectorDropdown
      sections={sections}
      onSectionsChange={(updated) => {
        setSections(updated)
        saveSectionPreferences(updated)
      }}
    />
    <button
      onClick={handleExportPDF}
      disabled={loading || !reportData || isExporting}
      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-1.5"
      aria-label="Export to PDF"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="hidden sm:inline">กำลัง Export...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Export PDF</span>
        </>
      )}
    </button>
    <button
      ref={closeButtonRef}
      onClick={onClose}
      className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label="ปิดหน้าต่าง"
    >
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>
```

- [ ] **Step 5: Update ReportContent to use sections**

Replace the ReportContent component (lines 299-353) with:

```tsx
function ReportContent({ data, sections }: { data: ReportData; sections: ReportSectionConfig[] }) {
  const enabledSections = getEnabledSections(sections)

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'section1':
        return (
          <ReportPage
            key="section1"
            title={`Ticket ${data.monthNameEnglish} ${data.year}`}
            subtitle="ส่วนที่ 1: ภาพรวม Ticket ทั้งหมด"
          >
            <PieChartSection
              title="Category"
              data={data.section1}
              total={data.totals.section1}
            />
          </ReportPage>
        )

      case 'section2':
        return (
          <ReportPage
            key="section2"
            title={`Software ${data.totals.section2} Tickets`}
            subtitle="ส่วนที่ 2: เจาะลึกหมวด Software"
          >
            <PieChartSection
              title="Software"
              data={data.section2}
              total={data.totals.section2}
            />
          </ReportPage>
        )

      case 'section3':
        return (
          <ReportPage
            key="section3"
            title={`Software ${data.totals.section3} Tickets`}
            subtitle="ส่วนที่ 3: การจัดกลุ่มปัญหา Software"
          >
            <PieChartSection
              title="Sub Services"
              data={data.section3}
              total={data.totals.section3}
            />
          </ReportPage>
        )

      case 'section4':
        const posRateCount = data.section3.find(s => s.id === 'pos_rate_error')?.count || 0
        return (
          <ReportPage
            key="section4"
            title={`POS/RATE Error ${posRateCount} Tickets`}
            subtitle="ส่วนที่ 4: สาเหตุของ POS/RATE Error"
          >
            <PieChartSection
              title="Causes"
              data={data.section4}
              total={data.totals.section4}
            />
          </ReportPage>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {enabledSections.map(section => renderSection(section.id))}
    </div>
  )
}
```

- [ ] **Step 6: Update the render call in the modal**

Find and update the ReportContent usage (around line 291):

```tsx
// OLD:
<ReportContent data={reportData} />

// NEW:
<ReportContent data={reportData} sections={sections} />
```

- [ ] **Step 7: Test the functionality**

Run: `npm run dev`
Expected:
1. Section selector button shows in header with blue background
2. Clicking opens dropdown with 4 sections
3. Toggling sections shows/hides them in the report
4. At least 1 section must remain enabled
5. Selection persists after closing and reopening modal

- [ ] **Step 8: Commit**

```bash
git add app/components/dashboard/MonthlyReportModal.tsx
git commit -m "feat: integrate section selector dropdown into monthly report modal"
```

---

## Chunk 3: Enhanced PDF Export

### Task 5: Install jsPDF and html2canvas

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

Run: `npm install jspdf html2canvas`
Expected: Packages installed successfully

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add jspdf and html2canvas for PDF export"
```

---

### Task 6: Create PDF Export Utility

**Files:**
- Create: `app/lib/pdfExport.ts`

- [ ] **Step 1: Create PDF export utility**

```typescript
/**
 * PDF Export Utility for Monthly Report
 * Uses jsPDF and html2canvas to generate multi-page PDFs
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PdfExportOptions {
  filename: string
  onProgress?: (progress: number) => void
}

const A4_WIDTH = 210 // mm
const A4_HEIGHT = 297 // mm
const MARGIN = 10 // mm

/**
 * Export the report content to PDF
 */
export async function exportToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const { filename, onProgress } = options

  // Get all report pages
  const pages = element.querySelectorAll('.report-page')
  const totalPages = pages.length

  if (totalPages === 0) {
    throw new Error('No report pages to export')
  }

  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Process each page
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i] as HTMLElement

    // Report progress
    onProgress?.(Math.round(((i + 1) / totalPages) * 100))

    // Create canvas from the page element
    const canvas = await html2canvas(page, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgWidth = A4_WIDTH - (2 * MARGIN)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Add new page (except for the first one)
    if (i > 0) {
      pdf.addPage()
    }

    // Add the image to the PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight)
  }

  // Save the PDF
  pdf.save(filename)
}

/**
 * Generate filename based on year and month
 */
export function generateReportFilename(year: number, month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthName = monthNames[month - 1]
  const date = new Date()
  const timestamp = date.toISOString().split('T')[0] // YYYY-MM-DD

  return `monthly-report-${monthName}-${year}-${timestamp}.pdf`
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/lib/pdfExport.ts
git commit -m "feat: add PDF export utility using jsPDF and html2canvas"
```

---

### Task 7: Update MonthlyReportModal to use new PDF export

**Files:**
- Modify: `app/components/dashboard/MonthlyReportModal.tsx:62-67` (state)
- Modify: `app/components/dashboard/MonthlyReportModal.tsx:163-208` (handleExportPDF)

- [ ] **Step 1: Add import for PDF export**

Add at the top with other imports:

```typescript
import { exportToPdf, generateReportFilename } from '@/lib/pdfExport'
```

- [ ] **Step 2: Add progress state**

Add after the existing state declarations:

```typescript
const [exportProgress, setExportProgress] = useState(0)
```

- [ ] **Step 3: Update handleExportPDF function**

Replace the existing handleExportPDF function (lines 163-208) with:

```typescript
// Handle PDF export using jsPDF
const handleExportPDF = useCallback(async () => {
  if (!reportContentRef.current || isExporting) return

  setIsExporting(true)
  setExportProgress(0)

  try {
    const filename = generateReportFilename(year, month)

    await exportToPdf(reportContentRef.current, {
      filename,
      onProgress: (progress) => {
        setExportProgress(progress)
      }
    })
  } catch (err) {
    console.error('Export error:', err)
    // Show error to user
    alert('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง')
  } finally {
    setIsExporting(false)
    setExportProgress(0)
  }
}, [isExporting, year, month])
```

- [ ] **Step 4: Update export button to show progress**

Update the export button to show progress when exporting:

```tsx
<button
  onClick={handleExportPDF}
  disabled={loading || !reportData || isExporting}
  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-1.5"
  aria-label="Export to PDF"
>
  {isExporting ? (
    <>
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="hidden sm:inline">
        กำลัง Export {exportProgress > 0 ? `(${exportProgress}%)` : '...'}
      </span>
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Export PDF</span>
    </>
  )}
</button>
```

- [ ] **Step 5: Test PDF export**

Run: `npm run dev`
Expected:
1. Click "Export PDF" button
2. Progress indicator shows (0% → 100%)
3. PDF file is downloaded with correct filename
4. PDF contains all enabled sections, each on its own page
5. Pie charts and tables are rendered correctly

- [ ] **Step 6: Remove old print styles from globals.css**

The old print styles (lines 178-256 in globals.css) are no longer needed with jsPDF. Remove them:

```css
/* Remove the entire @media print block */
```

- [ ] **Step 7: Commit**

```bash
git add app/components/dashboard/MonthlyReportModal.tsx app/globals.css
git commit -m "feat: implement enhanced PDF export with jsPDF and progress indicator"
```

---

## Chunk 4: Testing and Documentation

### Task 8: Update Component Documentation

**Files:**
- Create: `docs/monthly-report.md`

- [ ] **Step 1: Create documentation**

```markdown
# Monthly Report Feature Documentation

## Overview
The Monthly Report feature provides a comprehensive summary of IT Helpdesk tickets with customizable sections and PDF export capability.

## Features

### 1. Section Selection
- Users can select which sections to include in the report
- Available sections:
  - **Section 1**: Overall Ticket Summary (ภาพรวม Ticket ทั้งหมด)
  - **Section 2**: Software Deep Dive (เจาะลึกหมวด Software)
  - **Section 3**: Software Problem Grouping (การจัดกลุ่มปัญหา Software)
  - **Section 4**: POS/RATE Error Causes (สาเหตุของ POS/RATE Error)

- Selection is persisted in localStorage
- At least one section must be enabled

### 2. PDF Export
- Exports selected sections to a multi-page PDF
- Includes pie charts and tables
- Shows progress during export
- Filename format: `monthly-report-{month}-{year}-{date}.pdf`

### 3. Visual Design
- Blue primary buttons (bg-primary-600) for proper visibility
- Responsive design for mobile and desktop
- Accessible with keyboard navigation and ARIA labels

## Usage

### Opening the Report
1. Navigate to the Dashboard
2. Click the "รายงานประจำเดือน" button
3. Select the desired year and month

### Customizing Sections
1. Click the "เลือกส่วน" button in the modal header
2. Check/uncheck sections to include/exclude
3. Click "ยืนยัน" to apply changes

### Exporting to PDF
1. Customize sections as desired
2. Click the "Export PDF" button
3. Wait for the export to complete (progress indicator shown)
4. PDF will be automatically downloaded

## Technical Details

### Components
- `MonthlyReportModal.tsx`: Main modal component
- `SectionSelectorDropdown.tsx`: Dropdown for section selection
- `reportDataMapping.ts`: Maps database tickets to fixed categories

### Utilities
- `reportSections.ts`: Section configuration and localStorage management
- `pdfExport.ts`: PDF generation using jsPDF and html2canvas

### Data Flow
1. User opens modal → API fetches tickets for selected month
2. `reportDataMapping.ts` categorizes tickets into fixed sections
3. Component renders sections based on user selection
4. PDF export captures rendered sections and creates PDF
```

- [ ] **Step 2: Commit**

```bash
git add docs/monthly-report.md
git commit -m "docs: add monthly report feature documentation"
```

---

### Task 9: Final Testing

**Files:**
- Test all components end-to-end

- [ ] **Step 1: Test button styling**

1. Open the monthly report modal
2. Verify both "เลือกส่วน" and "Export PDF" buttons show blue color (primary-600) by default
3. Hover over buttons and verify color change to primary-700
4. Check keyboard navigation (Tab, Enter)

- [ ] **Step 2: Test section selection**

1. Click "เลือกส่วน" button
2. Verify dropdown opens with all 4 sections
3. Uncheck sections and verify report updates
4. Verify at least 1 section must remain enabled
5. Close and reopen modal - verify selection persists

- [ ] **Step 3: Test PDF export**

1. Select all 4 sections
2. Click "Export PDF"
3. Verify progress indicator shows
4. Verify PDF is downloaded
5. Open PDF and verify:
   - All 4 pages are present
   - Pie charts render correctly
   - Tables are readable
   - Thai text displays properly
6. Test with 1 section only
7. Test with 2 sections

- [ ] **Step 4: Test responsive design**

1. Test on mobile (< 640px)
2. Test on tablet (sm: 640px+)
3. Test on desktop (lg: 1024px+)

- [ ] **Step 5: Test accessibility**

1. Test keyboard navigation (Tab, Shift+Tab)
2. Test screen reader compatibility
3. Test focus visible states
4. Test ARIA labels

- [ ] **Step 6: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 7: Run linter**

Run: `npm run lint` (if available)
Expected: No linting errors

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "test: complete monthly report enhancements testing"
```

---

## Summary

This plan implements the following enhancements:

1. **Fixed button styling**: Changed `bg-primary` to `bg-primary-600` for proper blue color display
2. **Section selection dropdown**: Added `SectionSelectorDropdown` component with localStorage persistence
3. **Enhanced PDF export**: Implemented jsPDF-based export with progress indicator
4. **Documentation**: Added feature documentation

### Files Modified:
- `app/components/dashboard/MonthlyReportModal.tsx`
- `app/globals.css`

### Files Created:
- `app/lib/reportSections.ts`
- `app/lib/pdfExport.ts`
- `app/components/dashboard/SectionSelectorDropdown.tsx`
- `docs/monthly-report.md`

### Dependencies Added:
- `jspdf`
- `html2canvas`
