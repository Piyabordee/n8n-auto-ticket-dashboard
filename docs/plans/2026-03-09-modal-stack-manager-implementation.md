# Modal Stack Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a global modal manager system that enables stacked modals, specifically to allow clicking on day bars in DailyBarChart to open TicketListModal while keeping DailyBarChart open.

**Architecture:** Create a ModalProvider context that manages a stack of modal instances with automatic z-index layering. Components use useModal hook to open/close modals. ModalProvider renders active modals with proper z-index wrapping.

**Tech Stack:** Next.js 14 App Router, TypeScript, React Context API, Recharts

---

## Task 1: Create Modal Types

**Files:**
- Create: `types/modal.ts`

**Step 1: Create modal types file**

Create `types/modal.ts` with these types:

```typescript
import { ReactNode } from 'react'

export type ModalComponent<T = any> = React.ComponentType<T>

export interface ModalInstance {
  id: string
  component: ModalComponent
  props: any
  zIndex: number
}

export interface ModalContextType {
  modals: ModalInstance[]
  openModal: <T>(component: ModalComponent<T>, props: T) => void
  closeModal: () => void
  closeAll: () => void
}
```

**Step 2: Commit**

```bash
git add types/modal.ts
git commit -m "feat: add modal types

- Define ModalInstance, ModalComponent, and ModalContextType
- Support generic props for type safety
- Base types for modal stack management

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create ModalProvider Component

**Files:**
- Create: `app/components/modals/ModalProvider.tsx`

**Step 1: Create ModalProvider component**

Create `app/components/modals/ModalProvider.tsx`:

```typescript
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ModalContextType, ModalInstance, ModalComponent } from '@/types/modal'

const ModalContext = createContext<ModalContextType | undefined>(undefined)

const Z_INDEX_BASE = 50
const Z_INDEX_STEP = 10

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalInstance[]>([])

  const openModal = useCallback(<T,>(component: ModalComponent<T>, props: T) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const zIndex = Z_INDEX_BASE + (modals.length * Z_INDEX_STEP)

    setModals(prev => [...prev, { id, component, props, zIndex }])
  }, [modals.length])

  const closeModal = useCallback(() => {
    setModals(prev => prev.slice(0, -1))
  }, [])

  const closeAll = useCallback(() => {
    setModals([])
  }, [])

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAll }}>
      {children}
      <ModalRenderer modals={modals} />
    </ModalContext.Provider>
  )
}

function ModalRenderer({ modals }: { modals: ModalInstance[] }) {
  return (
    <>
      {modals.map(({ id, component: Component, props, zIndex }) => (
        <div key={id} style={{ zIndex }} className="relative">
          <Component {...props} />
        </div>
      ))}
    </>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}
```

**Step 2: Commit**

```bash
git add app/components/modals/ModalProvider.tsx
git commit -m "feat: create ModalProvider with stack management

- Implement ModalProvider context for modal stack
- Add openModal, closeModal, closeAll methods
- Create ModalRenderer for rendering modals with z-index
- Export useModal hook for component access
- Base z-index 50, increment by 10 per modal level

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Wrap App with ModalProvider

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Import ModalProvider**

Add import after existing imports (around line 4):

```typescript
import { ModalProvider } from './components/modals/ModalProvider'
```

**Step 2: Wrap children with ModalProvider**

Find the root `<div>` or `html` element that wraps `{children}` and wrap it with ModalProvider.

If your layout looks like:
```typescript
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
```

Change to:
```typescript
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        <ModalProvider>
          {children}
        </ModalProvider>
      </body>
    </html>
  )
}
```

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app with ModalProvider

- Add ModalProvider to root layout
- Enable useModal hook throughout app
- Required for modal stack functionality

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add onDayClick to DailyBarChart

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx`

**Step 1: Add onDayClick prop to interface**

Update the `DailyBarChartProps` interface (lines 34-42):

```typescript
interface DailyBarChartProps {
  data: DailyData[]
  monthName: string
  year: number
  monthIndex?: number
  staffData: StaffData[]
  onClose: () => void
  loading?: boolean
  onDayClick?: (day: string) => void
}
```

**Step 2: Destructure onDayClick from props**

Update the component function signature (line 44):

```typescript
export default function DailyBarChart({ data, monthName, year, monthIndex, staffData, onClose, loading, onDayClick }: DailyBarChartProps) {
```

**Step 3: Add cursor-pointer style to chart container when clickable**

Update the ResponsiveContainer parent div className (around line 138):

Find:
```typescript
<ResponsiveContainer width="100%" height={300}>
```

Change the wrapping div before it (around line 136-138):
```typescript
<div className={`p-6 border-b border-gray-200 ${onDayClick ? 'cursor-pointer' : ''}`}>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 กราฟรายวัน</h3>
  <ResponsiveContainer width="100%" height={300}>
```

**Step 4: Add click handlers to Bar components**

Update the Bar components (lines 149-150):

Find:
```typescript
<Bar dataKey="closed" fill="#3b82f6" name="ปิดแล้ว" stackId="1" />
<Bar dataKey="pending" fill="#ef4444" name="ยังไม่ปิด" stackId="1" />
```

Change to:
```typescript
<Bar
  dataKey="closed"
  fill="#3b82f6"
  name="ปิดแล้ว"
  stackId="1"
  cursor="pointer"
  onClick={(data) => onDayClick?.(data.payload?.day)}
/>
<Bar
  dataKey="pending"
  fill="#ef4444"
  name="ยังไม่ปิด"
  stackId="1"
  cursor="pointer"
  onClick={(data) => onDayClick?.(data.payload?.day)}
/>
```

**Step 5: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat: add onDayClick prop to DailyBarChart

- Add onDayClick optional prop to component interface
- Add onClick handlers to both Bar components (closed, pending)
- Access day from payload.data in Recharts onClick
- Add cursor-pointer style when onDayClick provided

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add Modal Handler to page.tsx

**Files:**
- Modify: `app/page.tsx`

**Step 1: Import useModal hook**

Add import at the top with other imports (around line 12):

```typescript
import { useModal } from './components/modals/ModalProvider'
```

**Step 2: Call useModal hook in component**

Add after the useState declarations (around line 113, after `const [loading, setLoading] = useState(true)`):

```typescript
const { openModal, closeModal } = useModal()
```

**Step 6: Add handleDayClickForModal function**

Add after the `handleDayClick` function (after line 238):

```typescript
// Handle day click from DailyBarChart modal - open TicketListModal
const handleDayClickForModal = (day: string) => {
  openModal(TicketListModal, {
    isOpen: true,
    onClose: closeModal,
    year: year,
    month: month,
    day: day,
    filterType: 'all',
    title: FILTER_TITLES.all
  })
}
```

**Step 7: Pass onDayClick to DailyBarChart**

Update the DailyBarChart component (around line 348-351):

Find:
```typescript
<DailyBarChart
  data={dailyData}
  monthName={selectedMonthName}
  year={year}
```

Add onDayClick prop:
```typescript
<DailyBarChart
  data={dailyData}
  monthName={selectedMonthName}
  year={year}
  onDayClick={handleDayClickForModal}
```

**Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add modal click handler for DailyBarChart

- Import and use useModal hook
- Add handleDayClickForModal function
- Use openModal to show TicketListModal on day click
- Pass closeModal as onClose to TicketListModal
- Pass onDayClick prop to DailyBarChart component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Write Tests for ModalProvider

**Files:**
- Create: `__tests__/components/modals/ModalProvider.test.tsx`

**Step 1: Create test file**

Create `__tests__/components/modals/ModalProvider.test.tsx`:

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalProvider, useModal } from '@/components/modals/ModalProvider'

// Test component that uses useModal
function TestComponent() {
  const { modals, openModal, closeModal, closeAll } = useModal()

  const TestModal = ({ title }: { title: string }) => (
    <div data-testid="test-modal">{title}</div>
  )

  return (
    <div>
      <span data-testid="modal-count">{modals.length}</span>
      <button onClick={() => openModal(TestModal, { title: 'Modal 1' })}>
        Open Modal 1
      </button>
      <button onClick={() => openModal(TestModal, { title: 'Modal 2' })}>
        Open Modal 2
      </button>
      <button onClick={closeModal}>Close Top</button>
      <button onClick={closeAll}>Close All</button>
    </div>
  )
}

describe('ModalProvider', () => {
  it('should render children and provide useModal hook', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    expect(screen.getByTestId('modal-count')).toHaveTextContent('0')
  })

  it('should open a modal when openModal is called', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('1')
    expect(screen.getByTestId('test-modal')).toHaveTextContent('Modal 1')
  })

  it('should stack multiple modals', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('1')

    fireEvent.click(screen.getByText('Open Modal 2'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('2')
  })

  it('should close top modal when closeModal is called', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    fireEvent.click(screen.getByText('Open Modal 2'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('2')

    fireEvent.click(screen.getByText('Close Top'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('1')
  })

  it('should close all modals when closeAll is called', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Open Modal 1'))
    fireEvent.click(screen.getByText('Open Modal 2'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('2')

    fireEvent.click(screen.getByText('Close All'))
    expect(screen.getByTestId('modal-count')).toHaveTextContent('0')
  })

  it('should throw error when useModal is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useModal must be used within ModalProvider')

    console.error = consoleError
  })
})
```

**Step 2: Run tests**

```bash
npm test -- __tests__/components/modals/ModalProvider.test.tsx
```

Expected: All tests pass (6 passed)

**Step 3: Commit**

```bash
git add __tests__/components/modals/ModalProvider.test.tsx
git commit -m "test: add ModalProvider unit tests

- Test useModal hook functionality
- Test openModal, closeModal, closeAll methods
- Test modal stacking behavior
- Test error when used outside provider

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Add E2E Test for Modal Stacking

**Files:**
- Create: `tests/e2e/modal-stacking.spec.ts`

**Step 1: Create E2E test file**

Create `tests/e2e/modal-stacking.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Modal Stacking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open TicketListModal when clicking day in DailyBarChart', async ({ page }) => {
    // Click on a month in MonthlyBarChart
    await page.click('text=[1-12]') // Click first month bar

    // Wait for DailyBarChart modal to appear
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()

    // Click on a day bar in the daily chart
    await page.click('[data-testid="daily-chart"] .recharts-bar rect')

    // TicketListModal should open
    await expect(page.locator('text=งานทั้งหมด')).toBeVisible()
    await expect(page.locator('text=[1-31] งาน')).toBeVisible() // Day number in title
  })

  test('should return to DailyBarChart when closing TicketListModal', async ({ page }) => {
    // Open month modal
    await page.click('text=[1-12]')
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()

    // Open day modal
    await page.click('[data-testid="daily-chart"] .recharts-bar rect')
    await expect(page.locator('text=งานทั้งหมด')).toBeVisible()

    // Close day modal
    await page.click('[aria-label="Close"]')

    // DailyBarChart should still be visible
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()
  })
})
```

**Note:** Add `data-testid="daily-chart"` to the ResponsiveContainer or parent div in DailyBarChart if needed for E2E testing.

**Step 2: Run E2E test**

```bash
npm run test:e2e tests/e2e/modal-stacking.spec.ts
```

Expected: Tests may fail initially (needs test IDs added), but validates flow

**Step 3: Commit**

```bash
git add tests/e2e/modal-stacking.spec.ts
git commit -m "test: add E2E test for modal stacking

- Test clicking day in DailyBarChart opens TicketListModal
- Test closing TicketListModal returns to DailyBarChart
- Validate modal stacking UX flow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Manual Testing

**Test Cases:**

1. **Click on day with tickets**
   - Go to dashboard
   - Click on a month bar in "ปริมาณงานรายเดือน"
   - DailyBarChart modal opens
   - Click on any day bar with tickets
   - Expected: TicketListModal opens on top showing tickets for that day

2. **Click on day with no tickets**
   - Open DailyBarChart modal
   - Click on a day with 0 tickets
   - Expected: TicketListModal opens showing "ไม่มีงานในวันนี้" or 0 งาน

3. **Modal stacking**
   - Open DailyBarChart (click month)
   - Click on a day
   - Expected: Two modals visible (check z-index layering)

4. **Close top modal only**
   - With two modals open
   - Click X on TicketListModal
   - Expected: TicketListModal closes, DailyBarChart remains open

5. **Escape key**
   - With two modals open
   - Press Escape
   - Expected: Top modal closes, DailyBarChart remains

6. **Multiple day clicks**
   - Open DailyBarChart
   - Click day 15
   - Close TicketListModal
   - Click day 20
   - Expected: Each click shows correct day's tickets

---

## Summary

**Files Created:**
1. `types/modal.ts` - Modal type definitions
2. `app/components/modals/ModalProvider.tsx` - Modal context and provider
3. `__tests__/components/modals/ModalProvider.test.tsx` - Unit tests
4. `tests/e2e/modal-stacking.spec.ts` - E2E tests

**Files Modified:**
1. `app/layout.tsx` - Add ModalProvider wrapper
2. `app/components/dashboard/DailyBarChart.tsx` - Add onDayClick prop
3. `app/page.tsx` - Add modal handler

**Total Estimated Time:** 60-90 minutes

**References:**
- Design document: `docs/plans/2026-03-09-modal-stack-manager-design.md`
- Related design: `docs/plans/2026-03-09-daily-chart-click-design.md`
