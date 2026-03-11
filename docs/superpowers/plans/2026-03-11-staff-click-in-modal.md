# Staff Click in Monthly Modal + Pending Column Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable clicking on staff names in the monthly detail modal to view their tickets, and add a "Pending" column to the modal's staff table.

**Architecture:**
1. Modify `DailyBarChart` component to add `totalPending` column and `onStaffClick` functionality to its inline staff table
2. Update main `page.tsx` to handle staff clicks from the modal and open ticket list modal with staff filter
3. Reuse existing `TicketListModal` component which already supports `staffName` filtering

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS

---

## Chunk 1: Update DailyBarChart Component

### Task 1: Update StaffData interface and add onStaffClick prop

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx`

- [ ] **Step 1: Update the StaffData interface to include totalPending**

```typescript
// Update lines 13-19 to add totalPending field
interface StaffData {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  totalPending: number  // ADD THIS LINE
  avgTimeAll: number
}
```

- [ ] **Step 2: Add onStaffClick prop to DailyBarChartProps interface**

```typescript
// Update lines 34-43 to add onStaffClick prop
interface DailyBarChartProps {
  data: DailyData[]
  monthName: string
  year: number
  monthIndex?: number
  staffData: StaffData[]
  onClose: () => void
  loading?: boolean
  onDayClick?: (day: string) => void
  onStaffClick?: (staffName: string) => void  // ADD THIS LINE
}
```

- [ ] **Step 3: Update component function signature to accept onStaffClick**

```typescript
// Update line 45 to destructure onStaffClick from props
export default function DailyBarChart({ data, monthName, year, monthIndex, staffData, onClose, loading, onDayClick, onStaffClick }: DailyBarChartProps) {
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat: update DailyBarChart interfaces to support staff click and pending column"
```

### Task 2: Add Pending column to staff table in DailyBarChart

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx`

- [ ] **Step 1: Update the table header to add "ยังไม่ปิด" column**

Find the `<thead>` section (around lines 200-207) and update:

```typescript
<thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">อันดับ</th>
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อพนักงาน</th>
    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">รับงาน</th>
    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ยังไม่ปิด</th>
    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ปิดแล้ว</th>
    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">เวลาเฉลี่ย</th>
  </tr>
</thead>
```

- [ ] **Step 2: Update the table body to render pending count**

Find the `<tbody>` section (around lines 209-231) and update:

```typescript
<tbody className="bg-white divide-y divide-gray-200">
  {staffData.map((person) => (
    <tr key={person.name} className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankBadge(person.rank)}`}>
          {getRankIcon(person.rank)}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
        {onStaffClick ? (
          <button
            onClick={() => onStaffClick(person.name)}
            className="text-blue-600 hover:text-blue-800 hover:underline"
            title={`ดูงานทั้งหมดของ ${person.name}`}
          >
            {person.name}
          </button>
        ) : (
          <span className="text-gray-900">{person.name}</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
        {person.totalAssigned}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
        <span className="text-red-600 font-semibold">{person.totalPending}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
        <span className="text-green-600 font-semibold">{person.totalClosed}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
        {person.avgTimeAll > 0 ? formatMinutes(Math.round(person.avgTimeAll)) : '-'}
      </td>
    </tr>
  ))}
</tbody>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat: add pending column and clickable staff names to DailyBarChart staff table"
```

---

## Chunk 2: Update Main Page to Handle Staff Clicks

### Task 3: Add staff ticket modal state to main page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add state for monthly modal staff ticket filter**

Add near line 109 (after `selectedStaffName` state):

```typescript
// Monthly modal staff tickets state
const [monthlyStaffTicketModalOpen, setMonthlyStaffTicketModalOpen] = useState(false)
const [monthlySelectedStaffName, setMonthlySelectedStaffName] = useState<string>('')
```

- [ ] **Step 2: Add handler for staff click from monthly modal**

Add after `handleStaffClick` function (around line 217):

```typescript
// Handle staff name click from monthly modal - open modal with all tickets for that staff in the selected month
const handleStaffClickFromModal = (staffName: string) => {
  setMonthlySelectedStaffName(staffName)
  setMonthlyStaffTicketModalOpen(true)
}
```

- [ ] **Step 3: Add handler to close monthly staff ticket modal**

Add after `handleCloseStaffTicketModal` function (around line 292):

```typescript
// Close monthly staff ticket modal
const handleCloseMonthlyStaffTicketModal = () => {
  setMonthlyStaffTicketModalOpen(false)
  setMonthlySelectedStaffName('')
}
```

- [ ] **Step 4: Update DailyBarChart component call to pass onStaffClick**

Find the `DailyBarChart` component usage (around line 376-387) and update:

```typescript
<DailyBarChart
  data={dailyData}
  monthName={selectedMonthName}
  year={year}
  monthIndex={selectedMonth}
  staffData={monthlyStaffData}
  onClose={handleCloseModal}
  loading={loadingModal}
  onDayClick={handleDayClickForModal}
  onStaffClick={handleStaffClickFromModal}
/>
```

- [ ] **Step 5: Add monthly staff ticket modal to JSX**

Add before the closing `</div>` of the component (around line 409):

```typescript
{/* Monthly Staff Tickets Modal */}
<TicketListModal
  isOpen={monthlyStaffTicketModalOpen}
  onClose={handleCloseMonthlyStaffTicketModal}
  year={year}
  month={selectedMonth}
  filterType="all"
  title={`งานของ ${monthlySelectedStaffName} - ${selectedMonthName} ${year + 543}`}
  staffName={monthlySelectedStaffName}
/>
```

- [ ] **Step 6: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 7: Run the dev server**

```bash
npm run dev
```

Expected: Server starts without errors

- [ ] **Step 8: Test the functionality manually**

1. Click on a month bar in the monthly chart
2. Verify the modal opens with daily chart and staff table
3. Verify the staff table has the new "ยังไม่ปิด" column
4. Click on a staff name
5. Verify the ticket list modal opens with that staff's tickets filtered

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add staff click handler and modal for monthly detail view"
```

---

## Chunk 3: Add Tests

### Task 4: Create tests for DailyBarChart staff table changes

**Files:**
- Create: `__tests__/components/dashboard/DailyBarChart.test.tsx`

- [ ] **Step 1: Create the test file with basic setup**

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import DailyBarChart from '@/app/components/dashboard/DailyBarChart'

const mockDailyData = [
  { day: '01', total: 10, closed: 8 },
  { day: '02', total: 15, closed: 12 },
  { day: '03', total: 12, closed: 10 },
]

const mockStaffData = [
  {
    rank: 1,
    name: 'สมชาย ใจดี',
    totalAssigned: 50,
    totalClosed: 45,
    totalPending: 5,
    avgTimeAll: 35,
  },
  {
    rank: 2,
    name: 'วิภา สุขสันต์',
    totalAssigned: 45,
    totalClosed: 42,
    totalPending: 3,
    avgTimeAll: 30,
  },
]

describe('DailyBarChart', () => {
  describe('staff table rendering', () => {
    it('should render staff table header with pending column', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByText('อันดับ')).toBeInTheDocument()
      expect(screen.getByText('ชื่อพนักงาน')).toBeInTheDocument()
      expect(screen.getByText('รับงาน')).toBeInTheDocument()
      expect(screen.getByText('ยังไม่ปิด')).toBeInTheDocument()
      expect(screen.getByText('ปิดแล้ว')).toBeInTheDocument()
      expect(screen.getByText('เวลาเฉลี่ย')).toBeInTheDocument()
    })

    it('should render staff data with pending counts', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      expect(screen.getByText('วิภา สุขสันต์')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument() // totalAssigned
      expect(screen.getByText('5')).toBeInTheDocument() // totalPending for rank 1
      expect(screen.getByText('3')).toBeInTheDocument() // totalPending for rank 2
    })

    it('should display pending count in red', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      const pendingValues = screen.getAllByText('5')
      const redPending = pendingValues.find(el => el.className.includes('text-red-600'))
      expect(redPending).toBeInTheDocument()
    })
  })

  describe('staff name click handling', () => {
    it('should call onStaffClick when staff name is clicked', () => {
      const mockClick = jest.fn()
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
          onStaffClick={mockClick}
        />
      )

      const staffName = screen.getByText('สมชาย ใจดี')
      fireEvent.click(staffName)

      expect(mockClick).toHaveBeenCalledWith('สมชาย ใจดี')
    })

    it('should not make name clickable when onStaffClick is not provided', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      const staffName = screen.getByText('สมชาย ใจดี')
      expect(staffName.tagName).toBe('SPAN')
    })
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- __tests__/components/dashboard/DailyBarChart.test.tsx
```

Expected: All tests pass

- [ ] **Step 3: Run all tests to ensure no regressions**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add __tests__/components/dashboard/DailyBarChart.test.tsx
git commit -m "test: add tests for DailyBarChart staff table with pending column and click handler"
```

---

## Chunk 4: Final Verification

### Task 5: Final testing and verification

**Files:**
- All modified files

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --coverage
```

Expected: All tests pass, no significant coverage decrease

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Run linter**

```bash
npm run lint
```

Expected: No lint errors

- [ ] **Step 4: Build the application**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 5: Manual end-to-end testing**

1. Start the dev server: `npm run dev`
2. Navigate to the dashboard
3. Click on a month bar in the monthly chart
4. Verify the modal opens with:
   - Daily bar chart
   - Staff performance table with columns: อันดับ, ชื่อพนักงาน, รับงาน, ยังไม่ปิด, ปิดแล้ว, เวลาเฉลี่ย
5. Click on a staff name (should be blue/underlined)
6. Verify the ticket list modal opens with that staff's tickets for the selected month
7. Verify tickets are filtered by the selected staff
8. Test the close functionality

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete staff click in monthly modal with pending column"
```

---

## Summary

This plan implements the following features:

1. **Pending Column in Monthly Modal**: Added "ยังไม่ปิด" (Pending) column to the staff table in the monthly detail modal (`DailyBarChart`)

2. **Clickable Staff Names**: Staff names in the monthly modal are now clickable, opening a ticket list modal filtered to show that staff's tickets for the selected month

3. **Reusable Modal**: The existing `TicketListModal` component is reused, passing the `staffName` and `month` props for filtering

**Files Modified:**
- `app/components/dashboard/DailyBarChart.tsx` - Added pending column and staff click functionality
- `app/page.tsx` - Added state and handlers for staff clicks from monthly modal

**Files Created:**
- `__tests__/components/dashboard/DailyBarChart.test.tsx` - Tests for new functionality
