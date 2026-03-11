# Outlier Explanation Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable modal explaining the "Median + 15×MAD" outlier detection method with ELI5 explanation, technical details, and per-person statistics table

**Architecture:** Create new OutlierExplanationModal component, update API to include median/MAD/threshold fields, add click handler to StatsCards, integrate modal in main dashboard page

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, MSSQL

---

## Chunk 1: Update Types

### Task 1: Extend StaffStats interface with outlier calculation fields

**Files:**
- Modify: `types/outlier.ts:24-36`

- [ ] **Step 1: Add new optional fields to StaffStats interface**

Update the interface (around lines 24-36) to include personal median, MAD, and threshold:

```typescript
export interface StaffStats {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  totalPending: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierCount: number
  // ADD THESE NEW FIELDS:
  personalMedian?: number
  personalMAD?: number
  personalThreshold?: number
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors (fields are optional so existing code unaffected)

- [ ] **Step 3: Commit**

```bash
git add types/outlier.ts
git commit -m "feat: add personalMedian, personalMAD, personalThreshold to StaffStats"
```

---

## Chunk 2: Update API Route

### Task 2: Modify staff API to return outlier calculation fields

**Files:**
- Modify: `app/api/dashboard/staff/route.ts`

- [ ] **Step 1: Read current API implementation**

```bash
cat app/api/dashboard/staff/route.ts
```

Familiarize yourself with the SQL query structure around lines 320-421.

- [ ] **Step 2: Update SQL CTE to include personal stats**

Find the `per_person_stats` CTE section (around line 365-375) and ensure it includes:
```sql
per_person_stats AS (
  SELECT
    m.assigned_to,
    m.personal_median,
    mad.personal_mad,
    m.personal_median + (15 * mad.personal_mad) AS personal_threshold
  FROM per_person_median m
  INNER JOIN per_person_mad mad ON m.assigned_to = mad.assigned_to
  WHERE m.ticket_count >= 2
)
```

- [ ] **Step 3: Add personal stats fields to main SELECT**

Update the main SELECT statement (around line 409-420) to include the new fields:

```sql
SELECT
  CAST(assigned_to AS NVARCHAR(MAX)) as assigned_to,
  COUNT(*) as totalAssigned,
  SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
  SUM(CASE WHEN status != 'closed' THEN 1 ELSE 0 END) as totalPending,
  AVG(CASE WHEN diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeAll,
  AVG(CASE WHEN is_outlier = 0 AND diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeNormal,
  AVG(CASE WHEN is_outlier = 1 AND diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeOutlier,
  SUM(is_outlier) as outlierCount,
  -- ADD THESE NEW FIELDS:
  s.personal_median,
  s.personal_mad,
  s.personal_threshold
FROM classified b
LEFT JOIN per_person_stats s ON b.assigned_to = s.assigned_to
GROUP BY CAST(assigned_to AS NVARCHAR(MAX)), s.personal_median, s.personal_mad, s.personal_threshold
ORDER BY totalAssigned DESC
```

- [ ] **Step 4: Update type mapping in response handler**

Find where StaffStats objects are created (around line 514-524) and add the new fields:

```typescript
const staffData: StaffStats[] = staffResult.recordset.map((row: any, index: number) => ({
  rank: index + 1,
  name: normalizeStylizedText(row.assigned_to),
  totalAssigned: row.totalAssigned,
  totalClosed: row.totalClosed,
  totalPending: row.totalPending || 0,
  avgTimeAll: row.avgTimeAll ? Math.round(row.avgTimeAll * 10) / 10 : 0,
  avgTimeNormal: row.avgTimeNormal ? Math.round(row.avgTimeNormal * 10) / 10 : 0,
  avgTimeOutlier: row.avgTimeOutlier ? Math.round(row.avgTimeOutlier * 10) / 10 : 0,
  outlierCount: row.outlierCount || 0,
  // ADD THESE NEW FIELDS:
  personalMedian: row.personal_median || undefined,
  personalMAD: row.personal_mad || undefined,
  personalThreshold: row.personal_threshold || undefined
}))
```

- [ ] **Step 5: Test API response**

```bash
# Start dev server if not running
npm run dev

# Test the endpoint (in another terminal)
curl "http://localhost:3000/api/dashboard/staff?year=2026"
```

Expected: JSON response includes `personalMedian`, `personalMAD`, `personalThreshold` for each staff member

- [ ] **Step 6: Commit**

```bash
git add app/api/dashboard/staff/route.ts
git commit -m "feat: add personalMedian, personalMAD, personalThreshold to staff API"
```

---

## Chunk 3: Create OutlierExplanationModal Component

### Task 3: Create base modal structure

**Files:**
- Create: `app/components/dashboard/OutlierExplanationModal.tsx`

- [ ] **Step 1: Create modal component with basic structure**

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { StaffStats } from '@/types/outlier'

interface OutlierExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
}

export default function OutlierExplanationModal({
  isOpen,
  onClose,
  year
}: OutlierExplanationModalProps) {
  const [staffStats, setStaffStats] = useState<StaffStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dashboard/staff?year=${year}`)
        if (!res.ok) throw new Error('Failed to fetch data')
        const data = await res.json()
        setStaffStats(data.staff || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, year])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            📊 คำอธิบายวิธีคำนวณ Outlier (Median + 15×MAD)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <>
              <ELI5Section />
              <TechnicalSection />
              <StaffDataTable staffStats={staffStats} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-components will be added in next tasks
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-red-600 mb-4">❌ {message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        ลองใหม่
      </button>
    </div>
  )
}

function LoadingState() {
  return <p className="text-center py-8 text-gray-600">⏳ กำลังโหลดข้อมูล...</p>
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors (placeholder components cause no issues)

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/OutlierExplanationModal.tsx
git commit -m "feat: create OutlierExplanationModal base structure"
```

### Task 4: Implement ELI5 section

**Files:**
- Modify: `app/components/dashboard/OutlierExplanationModal.tsx`

- [ ] **Step 1: Add ELI5Section component**

Add after the LoadingState component:

```typescript
function ELI5Section() {
  return (
    <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        📖 Outlier คืออะไร? (ELI5)
      </h3>
      <div className="space-y-3 text-sm sm:text-base text-gray-700">
        <p>
          Outlier คือ <strong>"งานที่ใช้เวลานานผิดปกติ"</strong> เมื่อเทียบกับเวลาที่ตัวเองปกติทำ
        </p>
        <div className="bg-white rounded p-3 border border-blue-100">
          <p className="font-medium mb-2">ตัวอย่าง:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>คุณ A ปกติปิดงาน 1-2 ชม. → งาน 3 วัน = Outlier</li>
            <li>คุณ B ปกติปิดงาน 2-3 วัน → งาน 1 สัปดาห์ = Outlier</li>
          </ul>
        </div>
        <p className="italic text-gray-600">
          ทุกคนมีเกณฑ์ของตัวเอง เพราะงานแต่ละประเภทต่างกัน!
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/OutlierExplanationModal.tsx
git commit -m "feat: add ELI5 explanation section to modal"
```

### Task 5: Implement Technical section

**Files:**
- Modify: `app/components/dashboard/OutlierExplanationModal.tsx`

- [ ] **Step 1: Add TechnicalSection component**

Add after ELI5Section:

```typescript
function TechnicalSection() {
  return (
    <section className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        🔧 วิธีคำนวณ (Technical)
      </h3>
      <div className="space-y-3 text-sm sm:text-base text-gray-700">
        <div>
          <p className="font-medium mb-1">Step 1: หาค่ามัธยฐาน (Median) ของเวลาปิดงานทั้งปี</p>
          <p className="font-medium mb-1">Step 2: หาค่า MAD (Median Absolute Deviation)</p>
          <p className="font-medium">Step 3: Threshold = Median + (15 × MAD)</p>
        </div>

        <div className="bg-white rounded p-3 border border-orange-100">
          <p className="font-medium mb-1">สูตร MAD:</p>
          <code className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono">
            MAD = Median(|Xi - Median|)
          </code>
        </div>

        <div>
          <p className="font-medium mb-2">ทำไมใช้ 15×MAD?</p>
          <ul className="space-y-1 list-disc list-inside text-sm">
            <li>MAD ทนทานต่อค่าผิดปกติ (robust)</li>
            <li>15× เป็นค่าที่เหมาะสมจากการทดลองกับข้อมูลจริง</li>
            <li>ระบุเฉพาะงานที่ผิดปกติ "จริงๆ" เท่านั้น</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/OutlierExplanationModal.tsx
git commit -m "feat: add technical explanation section to modal"
```

### Task 6: Implement Staff Data Table section

**Files:**
- Modify: `app/components/dashboard/OutlierExplanationModal.tsx`

- [ ] **Step 1: Add formatMinutes utility function**

Add at the top of the file after imports:

```typescript
const formatMinutes = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null) return '-'
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440)
    const remainingMinutes = minutes % 1440
    const hours = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60
    let result = `${days} วัน`
    if (hours > 0) result += ` ${hours} ชม.`
    if (mins > 0) result += ` ${mins} นาที`
    return result
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชม.`
  }
  return `${minutes} นาที`
}
```

- [ ] **Step 2: Add StaffDataTable component with desktop table view**

Add after TechnicalSection:

```typescript
function StaffDataTable({ staffStats }: { staffStats: StaffStats[] }) {
  return (
    <section className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        👥 ข้อมูลเฉพาะบุคคล (Per-Person Stats)
      </h3>

      {staffStats.length === 0 ? (
        <p className="text-gray-600 text-center py-4">ไม่มีข้อมูลพนักงาน</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Staff</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Median</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">MAD</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Threshold</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffStats.map((staff) => (
                  <tr key={staff.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{staff.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-700">
                      {formatMinutes(staff.personalMedian)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-700">
                      {formatMinutes(staff.personalMAD)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-orange-600">
                      {formatMinutes(staff.personalThreshold)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-red-600">
                      {staff.outlierCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {staffStats.map((staff) => (
              <div key={staff.name} className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{staff.name}</span>
                  <span className="text-sm font-semibold text-red-600">
                    Outliers: {staff.outlierCount}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Median</span>
                    <p className="text-gray-900">{formatMinutes(staff.personalMedian)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">MAD</span>
                    <p className="text-gray-900">{formatMinutes(staff.personalMAD)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Threshold</span>
                    <p className="text-orange-600 font-medium">
                      {formatMinutes(staff.personalThreshold)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/OutlierExplanationModal.tsx
git commit -m "feat: add staff data table section with mobile responsive design"
```

---

## Chunk 4: Update StatsCards Component

### Task 7: Make Avg Time card clickable

**Files:**
- Modify: `app/components/dashboard/StatsCards.tsx`

- [ ] **Step 1: Update FilterType to include 'outlier-explanation'**

Update line 3:

```typescript
type FilterType = 'all' | 'pending' | 'closed' | 'outliers' | 'outlier-explanation'
```

- [ ] **Step 2: Add click handler to Avg Time card**

Update the Avg Time card (lines 92-113) to make it clickable:

```typescript
{/* Avg Resolution Time - Normal vs Outlier breakdown */}
<div
  onClick={() => hasOutlierData && onCardClick?.('outlier-explanation')}
  className={`bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 relative ${
    hasOutlierData && onCardClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
  }`}
>
  {hasOutlierData && onCardClick && (
    <div className="absolute top-2 right-2 text-xs opacity-50">👆</div>
  )}
  {hasOutlierData ? (
    <>
      <div className="text-xs sm:text-sm text-gray-600 mb-1">เวลาเฉลี่ย (ปกติ / Outlier)</div>
      <div className="text-lg sm:text-xl font-bold text-orange-600">
        {avgTimeNormal > 0 ? formatMinutes(Math.round(avgTimeNormal)) : '-'}
        <span className="text-red-600"> / </span>
        <span className="text-red-600">{avgTimeOutlier > 0 ? formatMinutes(Math.round(avgTimeOutlier)) : '-'}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">ค่ามัธยฐาน + 15×MAD</div>
    </>
  ) : (
    <>
      <div className="text-xs sm:text-sm text-gray-600 mb-1">เวลาเฉลี่ย</div>
      <div className="text-2xl sm:text-3xl font-bold text-orange-600">
        {avgTime > 0 ? formatMinutes(Math.round(avgTime)) : '-'}
      </div>
      <div className="text-xs text-gray-500 mt-1">ต่อ Ticket</div>
    </>
  )}
</div>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/StatsCards.tsx
git commit -m "feat: make Avg Time card clickable to open outlier explanation modal"
```

---

## Chunk 5: Integrate Modal in Main Dashboard Page

### Task 8: Add modal state and handler to dashboard page

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Read current page implementation**

```bash
cat app/dashboard/page.tsx
```

Find where other modals are handled (TicketListModal).

- [ ] **Step 2: Add state for outlier explanation modal**

Add near other state declarations:

```typescript
const [showOutlierExplanation, setShowOutlierExplanation] = useState(false)
```

- [ ] **Step 3: Add handler for card click**

Update or add the handleCardClick function to include the new filter type:

```typescript
const handleCardClick = (filterType: FilterType) => {
  if (filterType === 'outlier-explanation') {
    setShowOutlierExplanation(true)
  } else {
    setSelectedFilter(filterType)
    setShowTicketModal(true)
  }
}
```

- [ ] **Step 4: Add OutlierExplanationModal component**

Add after TicketListModal in the JSX:

```typescript
<OutlierExplanationModal
  isOpen={showOutlierExplanation}
  onClose={() => setShowOutlierExplanation(false)}
  year={year}
/>
```

- [ ] **Step 5: Add import for OutlierExplanationModal**

Add to imports:

```typescript
import OutlierExplanationModal from '@/components/dashboard/OutlierExplanationModal'
```

- [ ] **Step 6: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 7: Test the flow manually**

```bash
# Ensure dev server is running
npm run dev
```

1. Open http://localhost:3000
2. Click on "เวลาเฉลี่ย (ปกติ / Outlier)" card
3. Verify modal opens with all sections
4. Verify staff data table shows correct values
5. Test mobile responsive view

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: integrate OutlierExplanationModal in dashboard page"
```

---

## Chunk 6: Testing

### Task 9: Write unit tests for OutlierExplanationModal

**Files:**
- Create: `__tests__/components/dashboard/OutlierExplanationModal.test.tsx`

- [ ] **Step 1: Create test file with basic render test**

```typescript
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OutlierExplanationModal from '@/app/components/dashboard/OutlierExplanationModal'

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      staff: [
        {
          rank: 1,
          name: 'Test Staff',
          totalAssigned: 10,
          totalClosed: 8,
          totalPending: 2,
          avgTimeAll: 120,
          avgTimeNormal: 60,
          avgTimeOutlier: 300,
          outlierCount: 2,
          personalMedian: 90,
          personalMAD: 8,
          personalThreshold: 210
        }
      ]
    })
  })
) as jest.Mock

describe('OutlierExplanationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <OutlierExplanationModal isOpen={false} onClose={() => {}} year={2026} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/คำอธิบายวิธีคำนวณ Outlier/)).toBeInTheDocument()
  })

  it('should render ELI5 section', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/Outlier คืออะไร/)).toBeInTheDocument()
    expect(screen.getByText(/งานที่ใช้เวลานานผิดปกติ/)).toBeInTheDocument()
  })

  it('should render Technical section', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/วิธีคำนวน/)).toBeInTheDocument()
    expect(screen.getByText(/Median/)).toBeInTheDocument()
    expect(screen.getByText(/MAD/)).toBeInTheDocument()
  })

  it('should render staff data table', async () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    await waitFor(() => {
      expect(screen.getByText(/Test Staff/)).toBeInTheDocument()
      expect(screen.getByText('210')).toBeInTheDocument() // threshold
    })
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <OutlierExplanationModal isOpen={true} onClose={onClose} year={2026} />
    )

    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading state', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/กำลังโหลด/)).toBeInTheDocument()
  })

  it('should show error state when API fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      })
    )

    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    await waitFor(() => {
      expect(screen.getByText(/ไม่สามารถโหลด/)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test __tests__/components/dashboard/OutlierExplanationModal.test.tsx
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/dashboard/OutlierExplanationModal.test.tsx
git commit -m "test: add unit tests for OutlierExplanationModal"
```

### Task 10: Update StatsCards tests

**Files:**
- Modify: `__tests__/components/dashboard/StatsCards.test.tsx`

- [ ] **Step 1: Read existing tests**

```bash
cat __tests__/components/dashboard/StatsCards.test.tsx
```

- [ ] **Step 2: Add test for outlier-explanation click**

Add to existing test file:

```typescript
it('should call onCardClick with outlier-explanation when avg time card is clicked (with outlier data)', () => {
  const handleClick = jest.fn()
  render(
    <StatsCards
      total={100}
      closed={90}
      closeRate={90}
      avgTime={120}
      pending={10}
      avgTimeNormal={60}
      avgTimeOutlier={300}
      outlierCount={5}
      onCardClick={handleClick}
    />
  )

  // Find and click the avg time card (4th card)
  const cards = screen.getAllByText(/เวลาเฉลี่ย/)
  const avgTimeCard = cards.find(card =>
    card.closest('div')?.querySelector('.text-orange-600')
  )

  fireEvent.click(avgTimeCard!.closest('div.bg-white')!)

  expect(handleClick).toHaveBeenCalledWith('outlier-explanation')
})

it('should not be clickable when outlier data is not available', () => {
  const handleClick = jest.fn()
  render(
    <StatsCards
      total={100}
      closed={90}
      closeRate={90}
      avgTime={120}
      pending={10}
      onCardClick={handleClick}
    />
  )

  // Find the avg time card
  const cards = screen.getAllByText(/เวลาเฉลี่ย/)
  const avgTimeCard = cards[0].closest('div.bg-white')

  fireEvent.click(avgTimeCard!)

  // Should not trigger click (no outlier data)
  expect(handleClick).not.toHaveBeenCalledWith('outlier-explanation')
})
```

- [ ] **Step 3: Run tests**

```bash
npm test __tests__/components/dashboard/StatsCards.test.tsx
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add __tests__/components/dashboard/StatsCards.test.tsx
git commit -m "test: add click handler tests for outlier explanation in StatsCards"
```

---

## Chunk 7: Final Verification

### Task 11: Final integration test and documentation

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Manual smoke test**

1. Start dev server: `npm run dev`
2. Open dashboard
3. Click "เวลาเฉลี่ย (ปกติ / Outlier)" card
4. Verify modal opens
5. Check ELI5 section displays correctly
6. Check Technical section displays correctly
7. Verify staff table shows all staff with correct values
8. Test mobile view (resize browser or use devtools)
9. Test close button
10. Test with API error (temporarily break API)

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Outlier Explanation Modal implementation

- Add ELI5 explanation for outlier detection
- Add technical details with formulas
- Display per-person stats table (median, MAD, threshold)
- Mobile responsive design with card view for small screens
- Full test coverage"
```

---

## Summary

**Files Created:**
- `app/components/dashboard/OutlierExplanationModal.tsx`
- `__tests__/components/dashboard/OutlierExplanationModal.test.tsx`

**Files Modified:**
- `types/outlier.ts`
- `app/api/dashboard/staff/route.ts`
- `app/components/dashboard/StatsCards.tsx`
- `app/dashboard/page.tsx`
- `__tests__/components/dashboard/StatsCards.test.tsx`

**Key Features:**
1. Clickable "เวลาเฉลี่ย" card opens explanation modal
2. ELI5 section for easy understanding
3. Technical section with formulas and rationale
4. Per-person stats table showing median, MAD, threshold for all staff
5. Mobile responsive with card view on small screens
6. Error handling and loading states
7. Full test coverage
