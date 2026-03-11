# Clickable Stat Numbers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable clicking on numbers in "รับงาน", "ยังไม่ปิด", "ปิดแล้ว" columns to open filtered ticket lists

**Architecture:** Add `onStatClick` callback to both staff table components, wrap numbers in clickable buttons with appropriate styling, handle clicks in main page to open TicketListModal with correct filter

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS

---

## Chunk 1: Update DailyBarChart Component

### Task 1: Add onStatClick prop to DailyBarChart interface

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx:34-44`

- [ ] **Step 1: Update DailyBarChartProps interface to add onStatClick prop**

```typescript
// Update lines 34-44 to add onStatClick prop
interface DailyBarChartProps {
  data: DailyData[]
  monthName: string
  year: number
  monthIndex?: number
  staffData: StaffData[]
  onClose: () => void
  loading?: boolean
  onDayClick?: (day: string) => void
  onStaffClick?: (staffName: string) => void
  onStatClick?: (staffName: string, filterType: 'all' | 'pending' | 'closed') => void  // ADD THIS LINE
}
```

- [ ] **Step 2: Update component function signature to accept onStatClick**

```typescript
// Update line 46 to destructure onStatClick from props
export default function DailyBarChart({ data, monthName, year, monthIndex, staffData, onClose, loading, onDayClick, onStaffClick, onStatClick }: DailyBarChartProps) {
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat: add onStatClick prop to DailyBarChart interface"
```

### Task 2: Wrap table numbers in clickable buttons

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx:231-242`

- [ ] **Step 1: Replace totalAssigned number with clickable button**

Find the table body cell for "รับงาน" (around line 231-233) and update:

```tsx
<td className="px-4 py-3 whitespace-nowrap text-sm text-center">
  {onStatClick ? (
    <button
      onClick={() => onStatClick(person.name, 'all')}
      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
      title={`ดูงานทั้งหมดของ ${person.name}`}
    >
      {person.totalAssigned}
    </button>
  ) : (
    <span className="text-gray-900">{person.totalAssigned}</span>
  )}
</td>
```

- [ ] **Step 2: Replace totalPending number with clickable button**

Find the table body cell for "ยังไม่ปิด" (around line 234-236) and update:

```tsx
<td className="px-4 py-3 whitespace-nowrap text-sm text-center">
  {onStatClick ? (
    <button
      onClick={() => onStatClick(person.name, 'pending')}
      className="text-red-600 hover:text-red-800 hover:underline cursor-pointer font-semibold"
      title={`ดูงานที่ยังไม่ปิดของ ${person.name}`}
    >
      {person.totalPending}
    </button>
  ) : (
    <span className="text-red-600 font-semibold">{person.totalPending}</span>
  )}
</td>
```

- [ ] **Step 3: Replace totalClosed number with clickable button**

Find the table body cell for "ปิดแล้ว" (around line 237-239) and update:

```tsx
<td className="px-4 py-3 whitespace-nowrap text-sm text-center">
  {onStatClick ? (
    <button
      onClick={() => onStatClick(person.name, 'closed')}
      className="text-green-600 hover:text-green-800 hover:underline cursor-pointer font-semibold"
      title={`ดูงานที่ปิดแล้วของ ${person.name}`}
    >
      {person.totalClosed}
    </button>
  ) : (
    <span className="text-green-600 font-semibold">{person.totalClosed}</span>
  )}
</td>
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat: make stat numbers clickable in DailyBarChart"
```

---

## Chunk 2: Update StaffPerformanceTable Component

### Task 3: Add onStatClick prop to StaffPerformanceTable

**Files:**
- Modify: `app/components/dashboard/StaffPerformanceTable.tsx:15-20`

- [ ] **Step 1: Update StaffPerformanceTableProps interface to add onStatClick prop**

```typescript
// Update lines 15-20 to add onStatClick prop
interface StaffPerformanceTableProps {
  staff?: StaffData[]
  showOutlierColumns?: boolean
  onOutlierClick?: (staffName: string) => void
  onStaffClick?: (staffName: string) => void
  onStatClick?: (staffName: string, filterType: 'all' | 'pending' | 'closed') => void  // ADD THIS LINE
}
```

- [ ] **Step 2: Update component function signature to accept onStatClick**

```typescript
// Update line 22 to destructure onStatClick from props
export default function StaffPerformanceTable({ staff, showOutlierColumns = false, onOutlierClick, onStaffClick, onStatClick }: StaffPerformanceTableProps) {
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat: add onStatClick prop to StaffPerformanceTable interface"
```

### Task 4: Wrap mobile view stat numbers in clickable buttons

**Files:**
- Modify: `app/components/dashboard/StaffPerformanceTable.tsx:93-101`

- [ ] **Step 1: Replace mobile view stat numbers with clickable buttons**

Find the mobile card view stat section (around lines 93-101) and update:

```tsx
<div className="grid grid-cols-3 gap-2 text-xs">
  <div>
    <div className="text-gray-500">รับงาน</div>
    <div className="font-semibold">
      {onStatClick ? (
        <button
          onClick={() => onStatClick(person.name, 'all')}
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          title={`ดูงานทั้งหมดของ ${person.name}`}
        >
          {person.totalAssigned}
        </button>
      ) : (
        <span className="text-gray-900">{person.totalAssigned}</span>
      )}
    </div>
  </div>
  <div>
    <div className="text-gray-500">ยังไม่ปิด</div>
    <div className="font-semibold">
      {onStatClick ? (
        <button
          onClick={() => onStatClick(person.name, 'pending')}
          className="text-red-600 hover:text-red-800 hover:underline cursor-pointer"
          title={`ดูงานที่ยังไม่ปิดของ ${person.name}`}
        >
          {person.totalPending}
        </button>
      ) : (
        <span className="text-red-600">{person.totalPending}</span>
      )}
    </div>
  </div>
  {hasOutlierData && (
    <div>
      <div className="text-gray-500">Outliers</div>
      <div className="font-semibold">
        <button
          onClick={() => person.outlierCount && person.outlierCount > 0 && onOutlierClick?.(person.name)}
          disabled={!person.outlierCount || person.outlierCount === 0}
          className={`text-xs font-medium ${getOutlierBadgeClass(person.outlierCount || 0)} ${
            person.outlierCount && person.outlierCount > 0 && onOutlierClick ? 'cursor-pointer' : ''
          }`}
        >
          {person.outlierCount || 0}
        </button>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat: make stat numbers clickable in mobile view of StaffPerformanceTable"
```

### Task 5: Wrap desktop view stat numbers in clickable buttons

**Files:**
- Modify: `app/components/dashboard/StaffPerformanceTable.tsx:174-179`

- [ ] **Step 1: Replace desktop view stat numbers with clickable buttons**

Find the desktop table body cells for "รับงาน" and "ยังไม่ปิด" (around lines 174-179) and update:

```tsx
<td className="px-6 py-4 whitespace-nowrap text-sm text-center">
  {onStatClick ? (
    <button
      onClick={() => onStatClick(person.name, 'all')}
      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
      title={`ดูงานทั้งหมดของ ${person.name}`}
    >
      {person.totalAssigned}
    </button>
  ) : (
    <span className="text-gray-900">{person.totalAssigned}</span>
  )}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-center">
  {onStatClick ? (
    <button
      onClick={() => onStatClick(person.name, 'pending')}
      className="text-red-600 hover:text-red-800 hover:underline cursor-pointer font-semibold"
      title={`ดูงานที่ยังไม่ปิดของ ${person.name}`}
    >
      {person.totalPending}
    </button>
  ) : (
    <span className="text-red-600 font-semibold">{person.totalPending}</span>
  )}
</td>
```

- [ ] **Step 2: Also add "ปิดแล้ว" column if not present**

Check if there's a "ปิดแล้ว" column. If not, add it after "ยังไม่ปิด":

```tsx
<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ปิดแล้ว</th>
```

And in the body:
```tsx
<td className="px-6 py-4 whitespace-nowrap text-sm text-center">
  {onStatClick ? (
    <button
      onClick={() => onStatClick(person.name, 'closed')}
      className="text-green-600 hover:text-green-800 hover:underline cursor-pointer font-semibold"
      title={`ดูงานที่ปิดแล้วของ ${person.name}`}
    >
      {person.totalClosed}
    </button>
  ) : (
    <span className="text-green-600 font-semibold">{person.totalClosed}</span>
  )}
</td>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat: make stat numbers clickable in desktop view of StaffPerformanceTable"
```

---

## Chunk 3: Update Main Page with Handlers

### Task 6: Add monthlyFilterType state to main page

**Files:**
- Modify: `app/page.tsx:111-113`

- [ ] **Step 1: Add monthlyFilterType state**

Add after line 113 (after `monthlySelectedStaffName` state):

```typescript
// Monthly modal staff tickets state
const [monthlyStaffTicketModalOpen, setMonthlyStaffTicketModalOpen] = useState(false)
const [monthlySelectedStaffName, setMonthlySelectedStaffName] = useState<string>('')
const [monthlyFilterType, setMonthlyFilterType] = useState<FilterType>('all')  // ADD THIS LINE
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add monthlyFilterType state for stat click filtering"
```

### Task 7: Add handleStatClick handler for main table

**Files:**
- Modify: `app/page.tsx:220-223`

- [ ] **Step 1: Add handleStatClick handler**

Add after `handleStaffClick` function (around line 217):

```typescript
// Handle staff name click - open modal with all tickets for that staff
const handleStaffClick = (staffName: string) => {
  setSelectedStaffName(staffName)
  setStaffTicketModalOpen(true)
}

// Handle stat click from main staff table - open modal with filtered tickets
const handleStatClick = (staffName: string, filterType: 'all' | 'pending' | 'closed') => {
  setSelectedStaffName(staffName)
  setTicketFilterType(filterType)
  setTicketModalOpen(true)
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add handleStatClick handler for main table stat clicks"
```

### Task 8: Add handleStatClickFromModal handler for monthly modal

**Files:**
- Modify: `app/page.tsx:224-227`

- [ ] **Step 1: Add handleStatClickFromModal handler**

Add after `handleStaffClickFromModal` function (around line 223):

```typescript
// Handle staff name click from monthly modal - open modal with all tickets for that staff in the selected month
const handleStaffClickFromModal = (staffName: string) => {
  setMonthlySelectedStaffName(staffName)
  setMonthlyStaffTicketModalOpen(true)
}

// Handle stat click from monthly modal - open modal with filtered tickets
const handleStatClickFromModal = (staffName: string, filterType: 'all' | 'pending' | 'closed') => {
  setMonthlySelectedStaffName(staffName)
  setMonthlyFilterType(filterType)
  setMonthlyStaffTicketModalOpen(true)
}
```

- [ ] **Step 2: Update handleCloseMonthlyStaffTicketModal to reset filter type**

Find the `handleCloseMonthlyStaffTicketModal` function (around line 295) and update:

```typescript
// Close monthly staff ticket modal
const handleCloseMonthlyStaffTicketModal = () => {
  setMonthlyStaffTicketModalOpen(false)
  setMonthlySelectedStaffName('')
  setMonthlyFilterType('all')  // ADD THIS LINE
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add handleStatClickFromModal handler for monthly modal stat clicks"
```

### Task 9: Update StaffPerformanceTable call to pass onStatClick

**Files:**
- Modify: `app/page.tsx:367-372`

- [ ] **Step 1: Add onStatClick to StaffPerformanceTable component**

Find the `StaffPerformanceTable` component usage (around lines 367-372) and update:

```tsx
<StaffPerformanceTable
  staff={staffData}
  showOutlierColumns={true}
  onOutlierClick={handleViewStaffOutliers}
  onStaffClick={handleStaffClick}
  onStatClick={handleStatClick}
/>
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: pass onStatClick handler to StaffPerformanceTable"
```

### Task 10: Update DailyBarChart call and monthly modal to use filter type

**Files:**
- Modify: `app/page.tsx:376-387` and `app/page.tsx:411-420`

- [ ] **Step 1: Add onStatClick to DailyBarChart component**

Find the `DailyBarChart` component usage (around lines 376-387) and update:

```tsx
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
  onStatClick={handleStatClickFromModal}
/>
```

- [ ] **Step 2: Update Monthly Staff Tickets Modal to use filter type**

Find the Monthly Staff Tickets Modal (around lines 411-420) and update:

```tsx
{/* Monthly Staff Tickets Modal */}
<TicketListModal
  isOpen={monthlyStaffTicketModalOpen}
  onClose={handleCloseMonthlyStaffTicketModal}
  year={year}
  month={selectedMonth}
  filterType={monthlyFilterType}
  title={`งาน${getFilterTypeLabel(monthlyFilterType)}ของ ${monthlySelectedStaffName} - ${selectedMonthName} ${year + 543}`}
  staffName={monthlySelectedStaffName}
/>
```

- [ ] **Step 3: Add getFilterTypeLabel helper function**

Add before the main component function (around line 77, before `export default function TeamDashboard()`):

```typescript
const getFilterTypeLabel = (filterType: FilterType): string => {
  switch (filterType) {
    case 'all': return 'ทั้งหมด'
    case 'pending': return 'ที่ยังไม่ปิด'
    case 'closed': return 'ที่ปิดแล้ว'
    case 'outliers': return 'Outliers'
    default: return ''
  }
}

export default function TeamDashboard() {
```

- [ ] **Step 4: Update main Staff Tickets Modal title to use filter type**

Find the Staff Tickets Modal (around lines 401-409) and update the title:

```tsx
{/* Staff Tickets Modal */}
<TicketListModal
  isOpen={staffTicketModalOpen}
  onClose={handleCloseStaffTicketModal}
  year={year}
  month={month}
  filterType={ticketFilterType}
  title={`งาน${getFilterTypeLabel(ticketFilterType)}ของพนักงาน`}
  staffName={selectedStaffName}
/>
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: pass onStatClick handler to DailyBarChart and update modal titles with filter type"
```

---

## Chunk 4: Add Tests

### Task 11: Add stat click tests for DailyBarChart

**Files:**
- Modify: `__tests__/components/dashboard/DailyBarChart.test.tsx`

- [ ] **Step 1: Add stat click handler test**

Add after the existing staff name click tests (around line 101):

```typescript
describe('stat number click handling', () => {
  it('should call onStatClick with correct filter type when assigned number is clicked', () => {
    const mockStatClick = jest.fn()
    render(
      <DailyBarChart
        data={mockDailyData}
        monthName="ก.พ."
        year={2026}
        monthIndex={2}
        staffData={mockStaffData}
        onClose={jest.fn()}
        onStatClick={mockStatClick}
      />
    )

    const assignedNumber = screen.getByText('50')
    fireEvent.click(assignedNumber)

    expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'all')
  })

  it('should call onStatClick with pending filter type when pending number is clicked', () => {
    const mockStatClick = jest.fn()
    render(
      <DailyBarChart
        data={mockDailyData}
        monthName="ก.พ."
        year={2026}
        monthIndex={2}
        staffData={mockStaffData}
        onClose={jest.fn()}
        onStatClick={mockStatClick}
      />
    )

    const pendingNumber = screen.getByText('5')
    fireEvent.click(pendingNumber)

    expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'pending')
  })

  it('should call onStatClick with closed filter type when closed number is clicked', () => {
    const mockStatClick = jest.fn()
    render(
      <DailyBarChart
        data={mockDailyData}
        monthName="ก.พ."
        year={2026}
        monthIndex={2}
        staffData={mockStaffData}
        onClose={jest.fn()}
        onStatClick={mockStatClick}
      />
    )

    const closedNumber = screen.getByText('45')
    fireEvent.click(closedNumber)

    expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'closed')
  })

  it('should not make numbers clickable when onStatClick is not provided', () => {
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

    const assignedNumber = screen.getByText('50')
    expect(assignedNumber.tagName).toBe('SPAN')
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- __tests__/components/dashboard/DailyBarChart.test.tsx
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/dashboard/DailyBarChart.test.tsx
git commit -m "test: add stat click tests for DailyBarChart"
```

### Task 12: Add stat click tests for StaffPerformanceTable

**Files:**
- Modify: `__tests__/components/dashboard/StaffPerformanceTable.test.tsx`

- [ ] **Step 1: Add stat click tests**

Add after the existing tests (find the end of the describe block):

```typescript
describe('stat number click handling', () => {
  const mockStaffWithAllData = [
    {
      rank: 1,
      name: 'สมชาย ใจดี',
      totalAssigned: 50,
      totalClosed: 45,
      totalPending: 5,
      avgTimeAll: 35,
      outlierCount: 2,
      avgTimeNormal: 30,
      avgTimeOutlier: 120,
    },
  ]

  it('should call onStatClick with correct filter type when assigned number is clicked', () => {
    const mockStatClick = jest.fn()
    const { container } = render(
      <StaffPerformanceTable
        staff={mockStaffWithAllData}
        showOutlierColumns={true}
        onStatClick={mockStatClick}
      />
    )

    const assignedButton = container.querySelector('button[title*="ดูงานทั้งหมดของ สมชาย ใจดี"]')
    fireEvent.click(assignedButton!)

    expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'all')
  })

  it('should call onStatClick with pending filter type when pending number is clicked', () => {
    const mockStatClick = jest.fn()
    const { container } = render(
      <StaffPerformanceTable
        staff={mockStaffWithAllData}
        showOutlierColumns={true}
        onStatClick={mockStatClick}
      />
    )

    const pendingButton = container.querySelector('button[title*="ดูงานที่ยังไม่ปิดของ สมชาย ใจดี"]')
    fireEvent.click(pendingButton!)

    expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'pending')
  })

  it('should not make numbers clickable when onStatClick is not provided', () => {
    const { container } = render(
      <StaffPerformanceTable
        staff={mockStaffWithAllData}
        showOutlierColumns={true}
      />
    )

    const assignedSpans = container.querySelectorAll('span.text-gray-900')
    const hasClickableAssigned = Array.from(assignedSpans).some(el => el.textContent === '50')
    expect(hasClickableAssigned).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- __tests__/components/dashboard/StaffPerformanceTable.test.tsx
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add __tests__/components/dashboard/StaffPerformanceTable.test.tsx
git commit -m "test: add stat click tests for StaffPerformanceTable"
```

---

## Chunk 5: Final Verification

### Task 13: Run full verification

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors in modified files

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass, no new failures

- [ ] **Step 3: Build the application**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Manual testing checklist**

1. Start dev server: `npm run dev`
2. Navigate to dashboard
3. Click "รับงาน" number in main staff table → verify modal opens with all tickets
4. Click "ยังไม่ปิด" number → verify modal opens with pending tickets only
5. Click "ปิดแล้ว" number → verify modal opens with closed tickets only
6. Click a month bar to open monthly modal
7. Repeat steps 3-5 for monthly modal staff table
8. Verify modal titles reflect filter type correctly
9. Test mobile view stat clicks
10. Verify close functionality works correctly

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete clickable stat numbers implementation"
```

---

## Summary

This plan implements clickable stat numbers in both staff table locations:

1. **DailyBarChart** (monthly modal) - Added `onStatClick` prop, wrapped numbers in buttons
2. **StaffPerformanceTable** (main dashboard) - Added `onStatClick` prop, wrapped numbers in both mobile and desktop views
3. **Main page** - Added handlers, state, and updated modal titles
4. **Tests** - Added comprehensive tests for stat click behavior

**Files Modified:**
- `app/components/dashboard/DailyBarChart.tsx`
- `app/components/dashboard/StaffPerformanceTable.tsx`
- `app/page.tsx`
- `__tests__/components/dashboard/DailyBarChart.test.tsx`
- `__tests__/components/dashboard/StaffPerformanceTable.test.tsx`

**Key Pattern:**
```tsx
{onStatClick ? (
  <button
    onClick={() => onStatClick(person.name, 'all')}
    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
    title={`ดูงานทั้งหมดของ ${person.name}`}
  >
    {person.totalAssigned}
  </button>
) : (
  <span className="text-gray-900">{person.totalAssigned}</span>
)}
```
