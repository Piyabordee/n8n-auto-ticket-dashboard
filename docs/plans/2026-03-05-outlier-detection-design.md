# Outlier Detection Feature - Design Document

**Date:** 2026-03-05
**Status:** Approved
**Author:** Claude
**Version:** 1.0.0

---

## Overview

Add statistical outlier detection (Mean ± 2SD) to the Team KPI Dashboard to identify abnormal ticket resolution times. Feature includes both quick preview on main dashboard and a dedicated outliers page.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard UI Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ Main Dashboard│  │ Outlier Page  │  │ Shared Components │   │
│  │               │  │ /outliers     │  │ - KPICards        │   │
│  │ - KPI Cards   │  │               │  │ - OutlierBadge    │   │
│  │ - Staff Table │  │ - Full List   │  │ - OutlierTable    │   │
│  │ - Top 3 Out   │  │ - Filters     │  │ - FilterBar       │   │
│  └───────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/dashboard/staff          → With Outlier Stats         │
│  GET /api/dashboard/outliers       → Full outlier list          │
│  GET /api/dashboard/outliers/top3  → Quick preview (cached)     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Access Layer (Repository)                │
├─────────────────────────────────────────────────────────────────┤
│  - OutlierRepository (statistical calculations)                 │
│  - Connection Pool Management                                   │
│  - Query Optimization (Indexed fields)                          │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQL Server Database                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Staff Performance Response (Updated)

```typescript
interface StaffPerformanceResponse {
  staff: StaffStats[]
  summary: {
    totalOutliers: number
    avgTimeAll: number
    avgTimeNormal: number
    avgTimeOutlier: number
    outlierThreshold: number  // Mean + 2SD
  }
}

interface StaffStats {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierCount: number
}
```

### Outliers Response

```typescript
interface OutliersResponse {
  outliers: OutlierTicket[]
  summary: {
    total: number
    avgTime: number
    maxTime: number
    minTime: number
    threshold: number
  }
}

interface OutlierTicket {
  message_id: string
  assigned_to: string
  subject: string
  diff_minutes: number
  created_date: string
  assigned_date: string
  deviation_score: number  // e.g., "2.3x above mean"
}
```

### Top Outliers Response

```typescript
interface TopOutliersResponse {
  top3: OutlierTicket[]
  total_count: number
  cache_ttl?: number
}
```

---

## Components

### New Components

| Component | Props | Description |
|-----------|-------|-------------|
| `OutlierBadge` | `count, avgTimeOutlier, onClick` | Badge showing outlier count with color coding |
| `TopOutliersList` | `outliers, onViewAll` | Mini table for top 3 outliers on main page |
| `OutlierTable` | `outliers, sortColumn, sortDirection, onSort` | Full sortable table for /outliers page |

### Updated Components

| Component | Changes |
|-----------|---------|
| `KPICards` | Split avg time into Normal vs Outlier cards |
| `StaffPerformanceTable` | Add outlier count column |

---

## SQL Implementation

### Core Outlier Detection Query

```sql
WITH base AS (
    SELECT
        assigned_to,
        message_id,
        subject,
        created_date,
        assigned_date,
        DATEDIFF(MINUTE, DATEADD(HOUR, 7, created_date), assigned_date) AS diff_minutes
    FROM [Dev_Born].[dbo].[ticket]
    WHERE
        assigned_date IS NOT NULL
        AND status != 'unsent'
        AND DATEDIFF(MINUTE, DATEADD(HOUR, 7, created_date), assigned_date) > 0
        AND created_date >= @startDate
        AND created_date <= @endDate
),
stats AS (
    SELECT
        AVG(CAST(diff_minutes AS FLOAT)) AS mean_val,
        STDEV(diff_minutes) AS sd_val
    FROM base
),
classified AS (
    SELECT
        b.*,
        s.mean_val,
        s.sd_val,
        s.mean_val + (2 * s.sd_val) AS upper_threshold,
        CASE
            WHEN b.diff_minutes > s.mean_val + (2 * s.sd_val) THEN 'Outlier'
            ELSE 'Normal'
        END AS is_outlier
    FROM base b
    CROSS JOIN stats s
)
SELECT * FROM classified
```

### Index Recommendations

```sql
CREATE INDEX IX_ticket_assigned_date
    ON [Dev_Born].[dbo].[ticket](assigned_date)
    WHERE status != 'unsent';

CREATE INDEX IX_ticket_created_assigned
    ON [Dev_Born].[dbo].[ticket](created_date, assigned_date)
    INCLUDE (assigned_to, status, message_id, subject);
```

---

## Error Handling & Caching

### Error Handling

| Scenario | Handling |
|----------|----------|
| SQL Connection Fail | Return cached data + error badge |
| Empty Result Set | Return zero stats + info message |
| Invalid Date Range | Return 400 bad request |
| Outlier Calc Error | Fall back to simple avg |

### Caching Strategy

```typescript
interface CacheConfig {
  staffStats: { ttl: 300 }        // 5 minutes
  outliers: { ttl: 180 }          // 3 minutes
  top3Outliers: { ttl: 60 }       // 1 minute
}
```

### Performance Targets

| Operation | Target |
|-----------|--------|
| Staff API | < 500ms |
| Outliers API | < 1s |
| Top3 API | < 200ms |

---

## Implementation Scope

| Component | Files to Create | Files to Modify |
|-----------|-----------------|-----------------|
| API Routes | `api/dashboard/outliers/route.ts`<br>`api/dashboard/outliers/top3/route.ts` | `api/dashboard/staff/route.ts` |
| Components | `OutlierBadge.tsx`<br>`TopOutliersList.tsx`<br>`OutlierTable.tsx` | `KPICards.tsx`<br>`StaffPerformanceTable.tsx` |
| Pages | `app/dashboard/outliers/page.tsx` | `app/dashboard/page.tsx` |
| Types | `types/outlier.ts` | - |
| Repository | `repository/OutlierRepository.ts` | - |

---

## Testing Strategy

### Unit Tests
- SQL query edge cases (0 records, 1 record, all outliers)
- Repository data transformation
- Component snapshots

### Integration Tests
- Correct threshold calculations
- Timezone conversion (+7)
- Empty date range handling
- Staff name normalization

### Performance Tests
- API response times meet SLA targets
