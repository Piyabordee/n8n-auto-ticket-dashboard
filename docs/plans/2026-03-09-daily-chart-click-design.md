# Design: Daily Chart Click Functionality

**Date:** 2026-03-09
**Feature:** Click on daily chart bars to view tickets for that day

---

## Overview

Add click functionality to the InlineDailyChart component, allowing users to click on any day's bar to view all tickets for that specific day through the existing TicketListModal.

---

## Architecture

### Flow Diagram

```
User clicks daily bar
    ↓
InlineDailyChart (onClick event)
    ↓
page.tsx (handleDayClick)
    ↓
TicketListModal (with day prop)
    ↓
API: /api/dashboard/tickets?year=X&month=Y&day=Z&status=all
    ↓
Display ticket list
```

---

## Components to Modify

### 1. InlineDailyChart (`app/components/dashboard/InlineDailyChart.tsx`)

**Changes:**
- Add prop: `onDayClick?: (day: string) => void`
- Add `onClick` handler to Recharts `<Bar>` components
- Add `cursor-pointer` style to chart container

**Code snippet:**
```tsx
interface InlineDailyChartProps {
  year: number
  month: number
  monthName: string
  onDayClick?: (day: string) => void  // NEW
}

// In BarChart:
<Bar
  dataKey="closed"
  fill="#3b82f6"
  name="ปิดแล้ว"
  stackId="1"
  onClick={(data) => onDayClick?.(data.day)}  // NEW
/>
```

### 2. TicketListModal (`app/components/dashboard/TicketListModal.tsx`)

**Changes:**
- Add prop: `day?: string`
- Include `day` parameter in API call
- Update title to show day when provided

**Code snippet:**
```tsx
interface TicketListModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number | null
  day?: string  // NEW
  filterType: 'all' | 'pending' | 'closed' | 'outliers'
  title: string
  staffName?: string
}

// Title format:
// With day: "รายการงานทั้งหมด - 15 ม.ค. 2569"
// Without day: "รายการงานทั้งหมด"
```

### 3. page.tsx (`app/page.tsx`)

**Changes:**
- Add state: `const [selectedDay, setSelectedDay] = useState<string | null>(null)`
- Add handler: `handleDayClick(day: string)`
- Pass new props to InlineDailyChart and TicketListModal

**Code snippet:**
```tsx
// New state
const [selectedDay, setSelectedDay] = useState<string | null>(null)

// New handler
const handleDayClick = (day: string) => {
  setSelectedDay(day)
  setTicketFilterType('all')
  setTicketModalOpen(true)
}

// InlineDailyChart props
<InlineDailyChart
  year={year}
  month={month}
  monthName={THAI_MONTHS[month - 1]}
  onDayClick={handleDayClick}  // NEW
/>

// TicketListModal props
<TicketListModal
  ...
  day={selectedDay}  // NEW
/>

// Reset selectedDay when filters change
useEffect(() => {
  setSelectedDay(null)
}, [year, month])
```

### 4. API Route (`app/api/dashboard/tickets/route.ts`)

**Changes:**
- Extract `day` query parameter
- Add day filter to SQL query

**Code snippet:**
```typescript
// Extract parameters
const year = searchParams.get('year')
const month = searchParams.get('month')
const day = searchParams.get('day')  // NEW
const status = searchParams.get('status') || 'all'
const staff = searchParams.get('staff')

// SQL Query
WHERE YEAR(t.created_date) = @year
  AND (@month IS NULL OR MONTH(t.created_date) = @month)
  AND (@day IS NULL OR DAY(t.created_date) = @day)  // NEW
```

---

## API Specification

### GET /api/dashboard/tickets

**Query Parameters:**

| Parameter | Type    | Required | Description                          |
|-----------|---------|----------|--------------------------------------|
| year      | number  | Yes      | Year (e.g., 2026)                    |
| month     | number  | No       | Month (1-12)                         |
| day       | string  | No       | Day (e.g., "15", "23")               |
| status    | string  | No       | all, pending, closed (default: all)  |
| staff     | string  | No       | Staff name (URL encoded)             |

**Example Request:**
```
GET /api/dashboard/tickets?year=2026&month=3&day=15&status=all
```

**Example Response:**
```json
{
  "tickets": [
    {
      "message_id": "...",
      "subject": "...",
      "assigned_to": "...",
      ...
    }
  ]
}
```

---

## Error Handling & Edge Cases

| Case                    | Handling                              |
|-------------------------|---------------------------------------|
| Day with no tickets     | Show empty modal with "ไม่มีงานในวันนี้" |
| Invalid day parameter   | API returns empty result (no error)   |
| Mobile touch issues     | Use onClick + cursor: pointer style   |
| Filter change           | Reset selectedDay to null             |

---

## Testing

| Test Case                           | Expected Result                                   |
|-------------------------------------|---------------------------------------------------|
| Click day with tickets              | Modal shows tickets for that day                  |
| Click day with no tickets (total=0) | Modal shows "ไม่มีงานในวันนี้"                   |
| Change month/year filter            | selectedDay resets to null                        |
| Close modal, click different day    | State resets, new day's tickets display correctly |
| Title format                        | "รายการงานทั้งหมด - 15 ม.ค. 2569 - X งาน"      |

---

## Files to Modify

1. `app/components/dashboard/InlineDailyChart.tsx`
2. `app/components/dashboard/TicketListModal.tsx`
3. `app/page.tsx`
4. `app/api/dashboard/tickets/route.ts`

---

## Implementation Checklist

- [ ] Add `onDayClick` prop to InlineDailyChart
- [ ] Implement click handler on Bar components
- [ ] Add cursor-pointer style for UX
- [ ] Add `day` prop to TicketListModal
- [ ] Update TicketListModal API call with day parameter
- [ ] Update TicketListModal title to show day
- [ ] Add `selectedDay` state in page.tsx
- [ ] Implement `handleDayClick` handler
- [ ] Pass props to InlineDailyChart and TicketListModal
- [ ] Add day parameter to API route
- [ ] Update SQL query to filter by day
- [ ] Test all edge cases
