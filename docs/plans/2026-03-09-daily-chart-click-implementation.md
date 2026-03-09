# Daily Chart Click Functionality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add click functionality to the daily chart (InlineDailyChart) to view all tickets for a specific day through the existing TicketListModal.

**Architecture:** Reuse TicketListModal with new `day` prop. Click event from Recharts Bar component triggers state update in page.tsx, which opens modal with day-filtered ticket list from API.

**Tech Stack:** Next.js 14 App Router, TypeScript, Recharts, mssql (SQL Server)

---

## Task 1: Add Day Parameter to Tickets API

**Files:**
- Modify: `app/api/dashboard/tickets/route.ts`

**Step 1: Add day parameter extraction**

After line 34 (after `const staff = searchParams.get('staff')`), add:

```typescript
const day = searchParams.get('day')
```

**Step 2: Validate day parameter if provided**

After the month validation block (after line 100), add:

```typescript
// Validate day parameter if provided
if (day) {
  const dayNum = parseInt(day)
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    return NextResponse.json(
      { error: 'Invalid day parameter' },
      { status: 400 }
    )
  }
}
```

**Step 3: Add day filter to SQL query**

After the staff filter block (after line 113), add:

```typescript
// Add day filter if provided
if (day) {
  const dayNum = parseInt(day)
  query += ` AND DAY(created_date) = @day`
  requestQuery.input('day', sql.Int, dayNum)
}
```

**Step 4: Update mock data function call**

Update line 55 to pass day parameter:

```typescript
return NextResponse.json(generateTickets(currentYear, month ? parseInt(month) : undefined, status as 'all' | 'pending' | 'closed', staff || undefined, day || undefined))
```

**Step 5: Update fallback mock data call**

Update line 137 to pass day parameter:

```typescript
return NextResponse.json(generateTickets(currentYear, month ? parseInt(month) : undefined, status as 'all' | 'pending' | 'closed', staff || undefined, day || undefined))
```

**Step 6: Update generateTickets function signature and implementation**

**File:** `app/data/mockData.ts`

Add `day` parameter to the function signature and filter logic:

```typescript
export function generateTickets(
  year: number,
  month?: number,
  status: 'all' | 'pending' | 'closed' = 'all',
  staff?: string,
  day?: number  // NEW
): { tickets: Ticket[] } {
  // ... existing code ...

  // Add day filter to the tickets array before returning
  let filteredTickets = tickets  // existing tickets

  if (day !== undefined) {
    filteredTickets = filteredTickets.filter(t => {
      const ticketDate = new Date(t.created_date || '')
      return ticketDate.getDate() === day
    })
  }

  // ... rest of existing filtering logic ...

  return { tickets: filteredTickets }
}
```

**Step 7: Commit**

```bash
git add app/api/dashboard/tickets/route.ts app/data/mockData.ts
git commit -m "feat: add day parameter to tickets API endpoint

- Add day query parameter extraction and validation
- Add day filter to SQL query using DAY() function
- Update mock data generator to support day filtering
- Returns filtered tickets for specific day when day is provided

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add onDayClick Prop to InlineDailyChart Component

**Files:**
- Modify: `app/components/dashboard/InlineDailyChart.tsx`

**Step 1: Add onDayClick prop to interface**

Update the `InlineDailyChartProps` interface (lines 6-10):

```typescript
interface InlineDailyChartProps {
  year: number
  month: number
  monthName: string
  onDayClick?: (day: string) => void
}
```

**Step 2: Destructure onDayClick from props**

Update the component function signature (line 18):

```typescript
export default function InlineDailyChart({ year, month, monthName, onDayClick }: InlineDailyChartProps) {
```

**Step 3: Add cursor-pointer style to container when clickable**

Update the container div className (line 62):

```typescript
<div className={`bg-white rounded-lg shadow-sm p-6 mb-6 ${onDayClick ? 'cursor-pointer' : ''}`}>
```

**Step 4: Add click handler to closed Bar**

Update the closed Bar component (line 82):

```typescript
<Bar
  dataKey="closed"
  fill="#3b82f6"
  name="ปิดแล้ว"
  stackId="1"
  onClick={(data) => onDayClick?.(data.day)}
/>
```

**Step 5: Add click handler to pending Bar**

Update the pending Bar component (line 83):

```typescript
<Bar
  dataKey="pending"
  fill="#ef4444"
  name="ยังไม่ปิด"
  stackId="1"
  onClick={(data) => onDayClick?.(data.day)}
/>
```

**Step 6: Commit**

```bash
git add app/components/dashboard/InlineDailyChart.tsx
git commit -m "feat: add onDayClick prop to InlineDailyChart

- Add onDayClick optional prop to component interface
- Add onClick handlers to both Bar components (closed, pending)
- Add cursor-pointer style when onDayClick is provided
- Click handler passes day string to parent component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add Day Prop to TicketListModal Component

**Files:**
- Modify: `app/components/dashboard/TicketListModal.tsx`

**Step 1: Add day prop to interface**

Update the `TicketListModalProps` interface (lines 19-27):

```typescript
interface TicketListModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number | null
  day?: string
  filterType: 'all' | 'pending' | 'closed' | 'outliers'
  title: string
  staffName?: string
}
```

**Step 2: Destructure day from props**

Update the component function signature (line 36):

```typescript
export default function TicketListModal({
  isOpen,
  onClose,
  year,
  month,
  day,
  filterType,
  title,
  staffName
}: TicketListModalProps) {
```

**Step 3: Add day to dependency array and API call**

Update the useEffect dependency array (line 93):

```typescript
}, [isOpen, year, month, day, filterType, staffName])
```

**Step 4: Add day parameter to API URL for non-outlier filters**

Update the URL construction (line 79):

```typescript
const url = `/api/dashboard/tickets?year=${year}${monthParam}&day=${day || ''}&status=${filterType}${staffParam}`
```

**Step 5: Update title to show day when provided**

Update the title display (lines 103-107):

```typescript
<h2 className="text-xl font-semibold text-gray-900">{title}</h2>
<p className="text-sm text-gray-500 mt-1">
  {day ? `${day} ` : ''}{FILTER_LABELS[filterType]} - {tickets.length} งาน
  {staffName && <span className="ml-2">• พนักงาน: {staffName}</span>}
</p>
```

**Step 6: Commit**

```bash
git add app/components/dashboard/TicketListModal.tsx
git commit -m "feat: add day prop to TicketListModal

- Add optional day prop to component interface
- Include day parameter in API call
- Update modal subtitle to display day when provided
- Add day to useEffect dependency array

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add State and Handler to page.tsx

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add selectedDay state declaration**

After line 107 (after `selectedStaffName` state), add:

```typescript
const [selectedDay, setSelectedDay] = useState<string | null>(null)
```

**Step 2: Add handleDayClick function**

After the `handleMonthClick` function (after line 224), add:

```typescript
// Handle day click - open ticket list modal for that day
const handleDayClick = (day: string) => {
  setSelectedDay(day)
  setTicketFilterType('all')
  setTicketModalOpen(true)
}
```

**Step 3: Reset selectedDay when filters change**

Add a new useEffect after the `fetchAvailableMonths` useEffect (after line 170):

```typescript
// Reset selected day when year or month changes
useEffect(() => {
  setSelectedDay(null)
}, [year, month])
```

**Step 4: Pass onDayClick to InlineDailyChart**

Update the InlineDailyChart component (lines 297-301):

```typescript
<InlineDailyChart
  year={year}
  month={month}
  monthName={THAI_MONTHS[month - 1]}
  onDayClick={handleDayClick}
/>
```

**Step 5: Pass day to TicketListModal**

Update the TicketListModal component (lines 343-350):

```typescript
<TicketListModal
  isOpen={ticketModalOpen}
  onClose={handleCloseTicketModal}
  year={year}
  month={month}
  day={selectedDay}
  filterType={ticketFilterType}
  title={FILTER_TITLES[ticketFilterType]}
/>
```

**Step 6: Update handleCloseTicketModal to reset selectedDay**

Update the `handleCloseTicketModal` function (lines 247-249):

```typescript
const handleCloseTicketModal = () => {
  setTicketModalOpen(false)
  setSelectedDay(null)
}
```

**Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add daily chart click handler to dashboard

- Add selectedDay state to track clicked day
- Add handleDayClick function to open modal with day filter
- Pass onDayClick prop to InlineDailyChart component
- Pass day prop to TicketListModal component
- Reset selectedDay when filters change or modal closes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Manual Testing

**Test Cases:**

1. **Click on day with tickets**
   - Go to dashboard
   - Select a month with data
   - Click on any day bar in the daily chart
   - Expected: Modal opens showing tickets for that day

2. **Click on day with no tickets**
   - Select a month
   - Click on a day with 0 tickets (if any)
   - Expected: Modal opens showing "ไม่มีงานในวันนี้"

3. **Change month filter**
   - Open modal for a specific day
   - Change the month filter
   - Expected: Modal closes, selectedDay resets

4. **Close and reopen**
   - Click on a day
   - Close modal
   - Click on a different day
   - Expected: New day's tickets display correctly

---

## Summary

**Files Modified:**
1. `app/api/dashboard/tickets/route.ts` - Add day parameter
2. `app/data/mockData.ts` - Add day filter to mock data
3. `app/components/dashboard/InlineDailyChart.tsx` - Add onDayClick prop
4. `app/components/dashboard/TicketListModal.tsx` - Add day prop
5. `app/page.tsx` - Add state and handlers

**Total Estimated Time:** 45-60 minutes

**References:**
- Design document: `docs/plans/2026-03-09-daily-chart-click-design.md`
- Recharts onClick docs: https://recharts.org/en-US/api/Bar
