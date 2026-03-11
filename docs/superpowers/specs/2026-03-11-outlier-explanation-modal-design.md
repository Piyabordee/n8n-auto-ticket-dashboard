# Outlier Explanation Modal Design

**Date:** 2026-03-11
**Author:** Claude Code
**Status:** Approved

---

## Overview

Add a clickable modal to explain the "Median + 15×MAD" outlier detection method used in the IT Helpdesk Dashboard. The modal will provide both ELI5 explanation and full technical details, along with real per-person statistics for all staff members.

---

## Requirements

| Requirement | Detail |
|-------------|--------|
| **Trigger** | Click on "เวลาเฉลี่ย (ปกติ / Outlier)" card in StatsCards |
| **Content** | ELI5 + Technical formulas + Comparison + All staff stats |
| **Data** | Real median, MAD, threshold values for each staff member |
| **Responsive** | Mobile-friendly with card view for staff table |

---

## Component Architecture

```
app/components/dashboard/
├── StatsCards.tsx                    (modify - add onClick)
└── OutlierExplanationModal.tsx       (new)
```

**Props:**
```typescript
interface OutlierExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  staffStats?: StaffStats[]  // Fetched from API
}
```

**Data Flow:**
1. User clicks Avg Time card → `onCardClick('outlier-explanation')`
2. Parent (`page.tsx`) opens `OutlierExplanationModal`
3. Modal fetches `/api/dashboard/staff?year={year}`
4. Display ELI5 + Technical + Staff Table sections

---

## Modal UI Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 คำอธิบายวิธีคำนวณ Outlier (Median + 15×MAD)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ╔══════════════════════════════════════════════════════════════╗   │
│  ║  📖 Outlier คืออะไร? (ELI5)                                  ║   │
│  ╠══════════════════════════════════════════════════════════════╣   │
│  ║  Outlier คือ "งานที่ใช้เวลานานผิดปกติ" เมื่อเทียบกับ...   ║   │
│  ║  เวลาที่ตัวเองปกติทำ                                       ║   │
│  ║                                                                ║   │
│  ║  ตัวอย่าง:                                                    ║   │
│  ║  • คุณ A ปกติปิดงาน 1-2 ชม. → งาน 3 วัน = Outlier          ║   │
│  ║  • คุณ B ปกติปิดงาน 2-3 วัน → งาน 1 สัปดาห์ = Outlier     ║   │
│  ║                                                                ║   │
│  ╚══════════════════════════════════════════════════════════════╝   │
│                                                                      │
│  ╔══════════════════════════════════════════════════════════════╗   │
│  ║  🔧 วิธีคำนวณ (Technical)                                    ║   │
│  ╠══════════════════════════════════════════════════════════════╣   │
│  ║  Step 1: หาค่ามัธยฐาน (Median) ของเวลาปิดงานทั้งปี        ║   │
│  ║  Step 2: หาค่า MAD (Median Absolute Deviation)               ║   │
│  ║  Step 3: Threshold = Median + (15 × MAD)                      ║   │
│  ║                                                                ║   │
│  ║  สูตร MAD: MAD = Median(|Xi - Median|)                       ║   │
│  ║                                                                ║   │
│  ║  ทำไมใช้ 15×MAD?                                             ║   │
│  ║  • MAD ทนทานต่อค่าผิดปกติ (robust)                          ║   │
│  ║  • 15× เป็นค่าที่เหมาะสมจากการทดลองกับข้อมูลจริง     ║   │
│  ║  • ระบุเฉพาะงานที่ผิดปกติ "จริงๆ" เท่านั้น                 ║   │
│  ╚══════════════════════════════════════════════════════════════╝   │
│                                                                      │
│  ╔══════════════════════════════════════════════════════════════╗   │
│  ║  👥 ข้อมูลเฉพาะบุคคล (Per-Person Stats)                    ║   │
│  ╠══════════════════════════════════════════════════════════════╣   │
│  ║  ┌──────────────┬────────┬─────┬──────────┬─────────┐        ║   │
│  ║  │ Staff        │ Median │ MAD │Threshold │Outliers │        ║   │
│  ║  ├──────────────┼────────┼─────┼──────────┼─────────┤        ║   │
│  ║  │ สมชาย       │   90   │  8  │   210    │    2    │        ║   │
│  ║  │ วิชัย       │  120   │ 10  │   270    │    5    │        ║   │
│  ║  └──────────────┴────────┴─────┴──────────┴─────────┘        ║   │
│  ╚══════════════════════════════════════════════════════════════╝   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Changes

**File:** `app/api/dashboard/staff/route.ts`

**Add to SQL SELECT:**
```sql
s.personal_median,
s.personal_mad,
s.personal_median + (15 * s.personal_mad) AS personal_threshold
```

**Updated Response:**
```typescript
{
  staff: [
    {
      rank: number,
      name: string,
      totalAssigned: number,
      totalClosed: number,
      totalPending: number,
      avgTimeAll: number,
      avgTimeNormal: number,
      avgTimeOutlier: number,
      outlierCount: number,
      // NEW:
      personalMedian: number,
      personalMAD: number,
      personalThreshold: number
    }
  ],
  summary: { ... }
}
```

---

## Type Changes

**File:** `types/outlier.ts`

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
  // NEW:
  personalMedian?: number
  personalMAD?: number
  personalThreshold?: number
}
```

---

## Error Handling

| Case | Handling |
|------|----------|
| Staff < 2 tickets | Show "ข้อมูลไม่เพียงพอ" in table |
| Modal close during fetch | Cleanup with useEffect return |
| API error | Show error message + retry button |
| Empty staff list | Show "ไม่มีข้อมูลพนักงาน" |
| Mobile screen | Card view instead of table |

---

## Testing

**Unit Tests:**
- `OutlierExplanationModal.test.tsx` - Render, sections, loading, error, close
- `StatsCards.test.tsx` - Click handler for outlier-explanation

**Manual Testing:**
- Open modal, verify content
- Scroll through all sections
- Test mobile responsive
- Test with no staff data
- Test with API error

---

## Files to Modify

1. `app/components/dashboard/StatsCards.tsx` - Add onClick
2. `app/api/dashboard/staff/route.ts` - Add SQL fields
3. `types/outlier.ts` - Add type fields
4. `app/components/dashboard/OutlierExplanationModal.tsx` - NEW
5. `app/dashboard/page.tsx` - Add state and handler
6. `__tests__/components/dashboard/OutlierExplanationModal.test.tsx` - NEW
7. `__tests__/components/dashboard/StatsCards.test.tsx` - Update
