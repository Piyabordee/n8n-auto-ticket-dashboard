# Clickable Stat Numbers Design

> **Date:** 2026-03-11
> **Status:** Approved
> **Author:** Claude
> **Related:** Staff Click in Modal feature

---

## Overview

Enable clicking on the numbers in the "รับงาน" (Assigned), "ยังไม่ปิด" (Pending), and "ปิดแล้ว" (Closed) columns of staff tables to open filtered ticket lists. Each column filters tickets by different statuses.

---

## Requirements

### Functional
- Click "รับงาน" → Show all tickets for that staff
- Click "ยังไม่ปิด" → Show only pending tickets for that staff
- Click "ปิดแล้ว" → Show only closed tickets for that staff
- Apply to both staff tables: main dashboard (StaffPerformanceTable) and monthly modal (DailyBarChart)

### UX
- Numbers should be visually distinct as clickable (blue/red/green with hover underline)
- Tooltips should clarify what each click does
- Consistent styling across both components

---

## Architecture

### Approach
Single callback with filter type parameter:
```typescript
onStatClick?: (staffName: string, filterType: 'all' | 'pending' | 'closed') => void
```

### Component Interface

#### DailyBarChart
```typescript
interface DailyBarChartProps {
  onStatClick?: (staffName: string, filterType: 'all' | 'pending' | 'closed') => void
}
```

#### StaffPerformanceTable
```typescript
interface StaffPerformanceTableProps {
  onStatClick?: (staffName: string, filterType: 'all' | 'pending' | 'closed') => void
}
```

---

## UI Design

### Styling
```tsx
// รับงาน (Assigned) - Blue
<button className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium">

// ยังไม่ปิด (Pending) - Red
<button className="text-red-600 hover:text-red-800 hover:underline cursor-pointer font-semibold">

// ปิดแล้ว (Closed) - Green
<button className="text-green-600 hover:text-green-800 hover:underline cursor-pointer font-semibold">
```

### Tooltips
- รับงาน: `ดูงานทั้งหมดของ {ชื่อพนักงาน}`
- ยังไม่ปิด: `ดูงานที่ยังไม่ปิดของ {ชื่อพนักงาน}`
- ปิดแล้ว: `ดูงานที่ปิดแล้วของ {ชื่อพนักงาน}`

### Conditional Rendering
Only render as buttons when `onStatClick` is provided:
```tsx
{onStatClick ? (
  <button onClick={() => onStatClick(person.name, 'all')}>
    {person.totalAssigned}
  </button>
) : (
  <span>{person.totalAssigned}</span>
)}
```

---

## Data Flow

### Main Dashboard (page.tsx)

**New State:**
```typescript
const [monthlyFilterType, setMonthlyFilterType] = useState<FilterType>('all')
```

**Handlers:**
```typescript
// Main table stat click
const handleStatClick = (staffName: string, filterType: 'all' | 'pending' | 'closed') => {
  setSelectedStaffName(staffName)
  setTicketFilterType(filterType)
  setTicketModalOpen(true)
}

// Monthly modal stat click
const handleStatClickFromModal = (staffName: string, filterType: 'all' | 'pending' | 'closed') => {
  setMonthlySelectedStaffName(staffName)
  setMonthlyFilterType(filterType)
  setMonthlyStaffTicketModalOpen(true)
}
```

**Modal Title Mapping:**
- `'all'` → 'งานทั้งหมด'
- `'pending'` → 'งานที่ยังไม่ปิด'
- `'closed'` → 'งานที่ปิดแล้ว'

---

## Implementation Files

### Modify
1. `app/components/dashboard/DailyBarChart.tsx` - Add onStatClick, wrap numbers
2. `app/components/dashboard/StaffPerformanceTable.tsx` - Add onStatClick, wrap numbers
3. `app/page.tsx` - Add state, handlers, pass callbacks

### Tests
4. `__tests__/components/dashboard/DailyBarChart.test.tsx` - Test stat clicks
5. `__tests__/components/dashboard/StaffPerformanceTable.test.tsx` - Test stat clicks

---

## Key Pattern

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

---

## Success Criteria

- [ ] Clicking numbers opens TicketListModal with correct filter
- [ ] Modal title reflects the filter type
- [ ] All 3 columns are clickable
- [ ] Works in both staff table locations
- [ ] Tests pass for new functionality
- [ ] No regressions in existing features
