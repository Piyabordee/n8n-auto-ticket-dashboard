# Clickable Subject - Ticket Detail Modal Design

> **Date:** 2026-03-09
> **Status:** Approved
> **Author:** Claude (with user input)

## Overview

ทุกที่ที่มี subject แสดงอยู่ สามารถกดเพื่อดูรายละเอียดทั้งหมดของงานนั้นๆ ใน modal พร้อม collapse/expand เพื่อดูฟิลด์ทั้งหมด 26 columns จาก data.csv

---

## Requirements

### Functional Requirements
1. Subject ทุกที่สามารถกดได้ (clickable)
2. แสดง modal รายละเอียดเมื่อกด
3. Basic section แสดงเสมอ (สรุปข้อมูลหลัก)
4. Advanced section แสดงทั้งหมด 26 ฟิลด์ (collapse/expand)
5. ดึงข้อมูลจาก SQL Server เท่านั้น (ใช้ DB เดียวกับ dashboard)

### Non-Functional Requirements
- Modal ซ้อน modal ได้ (ใช้ ModalStack ที่มีอยู่แล้ว)
- Loading state ระหว่างดึงข้อมูล
- Error handling ถ้าไม่พบข้อมูล

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Components/Views                          │
├─────────────────────────────────────────────────────────────┤
│  StaffPerformanceTable │ TopOutliersList │ MonthlyTicketList│
│        TicketCard      │     OutlierTable                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    │ ใช้ ClickableSubject wrapper
                    ▼
        ┌───────────────────────┐
        │  ClickableSubject     │  ← ครอบ subject ทุกที่
        │  (onClick prop)       │
        └───────────┬───────────┘
                    │
                    │ onClick → open modal
                    ▼
        ┌───────────────────────┐
        │  TicketDetailModal    │  ← Modal แสดงรายละเอียด
        │  - Basic section      │
        │  - All 26 fields      │
        └───────────┬───────────┘
                    │
                    │ fetch by message_id
                    ▼
        ┌───────────────────────┐
        │  /api/dashboard/      │
        │  ticket/[message_id]  │
        └───────────┬───────────┘
                    │
                    ▼
              [SQL Server]
        Dev_Born.dbo.ticket
```

---

## Components

### 1. ClickableSubject Component

**File:** `app/components/dashboard/ClickableSubject.tsx`

```typescript
interface ClickableSubjectProps {
  subject: string
  message_id: string
  className?: string
}
```

**Behavior:**
- แสดง subject เป็น link (สีน้ำเงิน + underline)
- onClick → เปิด TicketDetailModal

---

### 2. TicketDetailModal Component

**File:** `app/components/dashboard/TicketDetailModal.tsx`

```typescript
interface TicketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  messageId: string
}

interface TicketDetail {
  // Basic (always shown)
  message_id: string
  subject: string
  status: string
  assigned_to: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
  close_time_minute?: number

  // All 26 fields from CSV (shown when expanded)
  id?: number
  assigned_date?: string
  intent?: string
  branch_company?: string
  clean_text?: string
  raw_text?: string
  email_body?: string
  chatname?: string
  fromuser?: string
  userid?: string
  groupid?: string
  created_by?: string
  updated_date?: string
  updated_by?: string
  close_cause?: string
  close_reason?: string
}
```

**UI Layout:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [รายละเอียดงานทั้งหมด]                                           [X]    │
├──────────────────────────────────────────────────────────────────────────────┤
│  📋 Subject: [หัวข้องาน]                                                     │
│  📊 Status: [สถานะ]  👤 ผู้รับงาน: [ชื่อ]  ⏱️ ใช้เวลา: [นาที]              │
│  📂 Category: [หมวดหมู่] - [ย่อย]  🏢 Branch: [สาขา]                        │
│  📅 สร้าง: [วันที่]                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  [▼ ดูเพิ่มเติม (26 ฟิลด์ทั้งหมด) / ▲ ซ่อน]                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ทั้งหมด 26 ฟิลด์จาก data.csv                                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## API Design

### GET /api/dashboard/ticket/[message_id]

**SQL Query:**
```sql
SELECT
  id, message_id, status, assigned_to, assigned_date,
  intent, category, sub_category, branch_name, branch_company,
  subject, clean_text, raw_text, email_body, chatname,
  fromuser, userid, groupid, created_date, created_by,
  updated_date, updated_by, close_cause, close_reason, close_time_minute
FROM Dev_Born.dbo.ticket
WHERE message_id = @message_id
```

**Response:**
```json
{
  "ticket": TicketDetail | null,
  "error"?: string
}
```

---

## File Structure

### New Files
```
app/components/dashboard/ClickableSubject.tsx
app/components/dashboard/TicketDetailModal.tsx
app/api/dashboard/ticket/[message_id]/route.ts
```

### Modified Files
```
app/components/dashboard/StaffPerformanceTable.tsx
app/components/dashboard/TopOutliersList.tsx
app/components/dashboard/MonthlyTicketList.tsx
app/components/dashboard/OutlierTable.tsx
app/components/TicketList.tsx
app/components/TicketCard.tsx
```

---

## Technical Decisions

| เรื่อง | ตัวเลือก | เหตุผล |
|--------|-----------|---------|
| Data source | SQL Server | ใช้ DB เดียวกับ dashboard ปัจจุบัน |
| Collapse UI | Manual useState | ควบคุมได้ง่าย |
| Subject style | Blue underline | ชัดเจนว่ากดได้ |
| Modal pattern | Same as TicketListModal | ความสอดคล้องกับ UX ที่มี |

---

## Implementation Notes

1. **ModalStack:** รองรับ modal ซ้อน modal ได้ (เช่น กด filter → TicketListModal → กด subject → TicketDetailModal)

2. **Subject styling:** ใช้ `text-blue-600 hover:text-blue-800 underline cursor-pointer`

3. **Empty state:** แสดงข้อความ "ไม่พบข้อมูล" ถ้า API คืนค่า null

4. **Loading:** แสดง spinner ระหว่าง fetch ข้อมูล

---

## Next Steps

Invoke `superpowers:writing-plans` skill to create detailed implementation plan.
