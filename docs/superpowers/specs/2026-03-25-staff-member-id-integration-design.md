# Staff Member ID Integration Design

**Date:** 2026-03-25
**Author:** Claude
**Status:** Design Approved - Pending Implementation

## Overview

Migrate from storing staff names directly in `ticket.updated_by` to using `userId` references with a centralized lookup system. This resolves stylized text issues and provides centralized staff name control.

## Problem Statement

**Current State Issues:**
- `ticket.updated_by` stores stylized names (e.g., "🆃🅾🅲🅺🆃🅰🅲🅺", "TOCKTACK", "หลวิชัย")
- Inconsistent naming requires `normalizeStylizedText()` post-processing
- Name changes require database updates across all tickets
- Duplicate staff entries from different name variations

**Database State (Already Migrated):**
- `ticket.updated_by` now stores `userId` (e.g., "Ub4c47e7e4f26bc5cee8868372fb6d759")
- `ticket.assigned_to` also stores `userId`
- New table `[Dev_Born].[dbo].[it_team]` contains staff mappings

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Application Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐          ┌──────────────────┐                 │
│  │ Report Queries   │          │ Real-time Queries│                 │
│  │ (JOIN in SQL)    │          │ (Use Cache)      │                 │
│  └────────┬─────────┘          └────────┬─────────┘                 │
│           │                              │                            │
│           ▼                              ▼                            │
│  ┌──────────────────┐          ┌──────────────────┐                 │
│  │ OutlierRepository│          │ TicketRepository │                 │
│  │ - Staff Performance      │ - Ticket List     │                 │
│  │ - Monthly Report         │ - Ticket Detail   │                 │
│  │ - Outliers               │ - Monthly Tickets │                 │
│  └────────┬─────────┘          └────────┬─────────┘                 │
│           │                              │                            │
│           ▼                              │                            │
│  ┌──────────────────┐                    │                            │
│  │ SQL Queries      │                    │                            │
│  │ (JOIN ticket     │                    │                            │
│  │  + it_team)      │                    │                            │
│  └──────────────────┘                    │                            │
│                                          │                            │
│                              ┌───────────▼───────────┐                │
│                              │  TeamMemberCache      │                │
│                              │  - userId → fromUser  │                │
│                              │  - Load at startup    │                │
│                              └───────────┬───────────┘                │
│                                          │                            │
│                                          ▼                            │
│                              ┌───────────────────────┐                │
│                              │   it_team table       │                │
│                              └───────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### it_team Table (Already Exists)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| fromUser | NVARCHAR | Display name (e.g., "หลวิชัย") |
| userId | NVARCHAR | Unique ID (e.g., "Ub4c47e7e4f26bc5cee8868372fb6d759") |
| active | CHAR(1) | 'Y' or 'N' |
| email_spiceworks | NVARCHAR | Email address |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |

### ticket Table (Already Migrated)

| Column | Type | Description |
|--------|------|-------------|
| updated_by | NVARCHAR | Now stores **userId** (not display name) |
| assigned_to | NVARCHAR | Now stores **userId** (not display name) |

## Components

### 1. TeamMemberCache Service

**File:** `app/lib/teamMemberCache.ts`

```typescript
interface TeamMember {
  userId: string
  fromUser: string
  email: string | null
  active: 'Y' | 'N'
}

interface CacheConfig {
  fallbackToUserId: boolean    // If true, return userId when not found
  unknownLabel: string         // Label to return when fallback is false
}

class TeamMemberCache {
  private cache: Map<string, string>        // userId → fromUser
  private emailCache: Map<string, string>   // userId → email

  async init(): Promise<void>
  getDisplayName(userId: string): string
  getEmail(userId: string): string | null
  has(userId: string): boolean
  getStats(): { size: number, initialized: boolean }
  reset(): void
}

export const teamMemberCache = new TeamMemberCache()
```

**Configuration:**
- `fallbackToUserId: true` - Return userId if not found in cache
- `unknownLabel: 'Unknown Staff'` - Label for empty/null userId

### 2. Report Queries (SQL JOIN)

**Queries using SQL JOIN:**
- `/api/dashboard/staff` - Staff Performance
- `/api/dashboard/report` - Monthly Report
- `/api/dashboard/outliers/*` - All outlier queries
- `/api/dashboard/kpi` - KPI stats (if using staff names)

**SQL Pattern:**

```sql
SELECT
  t.updated_by AS user_id,
  tm.fromUser AS staff_name,
  t.message_id,
  t.close_time_minute
FROM [Dev_Born].[dbo].[ticket] t
INNER JOIN [Dev_Born].[dbo].[it_team] tm
  ON t.updated_by = tm.userId
WHERE
  t.close_time_minute IS NOT NULL
  AND tm.active = 'Y'
  -- ... other filters
```

**Important:** Use `LEFT JOIN` + `COALESCE` if you want to include tickets with inactive staff:

```sql
LEFT JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
WHERE
  (tm.active = 'Y' OR tm.active IS NULL)
```

### 3. Real-time Queries (Cache)

**Queries using TeamMemberCache:**
- `/api/dashboard/tickets` - Ticket List
- `/api/dashboard/ticket/[message_id]` - Ticket Detail
- `/api/dashboard/monthly-tickets` - Available months

**Usage Pattern:**

```typescript
import { teamMemberCache } from '@/lib/teamMemberCache'

// Ensure cache is initialized
await teamMemberCache.init()

// Query tickets (returns userId in updated_by)
const result = await pool.request().query(`
  SELECT message_id, subject, updated_by, status, ...
  FROM [Dev_Born].[dbo].[ticket]
  WHERE ...
`)

// Transform with cache
return result.recordset.map(row => ({
  ...row,
  updated_by: teamMemberCache.getDisplayName(row.updated_by)
}))
```

### 4. Type Definitions

**File:** `types/outlier.ts`

```typescript
// New types
export interface TeamMember {
  userId: string
  fromUser: string
  email: string | null
  active: 'Y' | 'N'
}

export interface TeamMemberCacheConfig {
  fallbackToUserId: boolean
  unknownLabel: string
}

// Existing types remain unchanged
// updated_by is still string (display name) in API responses
export interface StaffStats {
  rank: number
  name: string           // Display name from it_team.fromUser
  totalAssigned: number
  totalClosed: number
  totalPending: number
  // ... rest unchanged
}
```

### 5. Startup Initialization

**File:** `app/lib/appInitialization.ts` (NEW)

```typescript
import { teamMemberCache } from './teamMemberCache'
import { ensureOutlierInitialized } from './apiInitializer'

let appInitialized = false

export async function ensureAppInitialized(): Promise<void> {
  if (appInitialized) return

  // Initialize team member cache first (fast)
  await teamMemberCache.init()

  // Then initialize outlier detection (slower)
  await ensureOutlierInitialized()

  appInitialized = true
  console.log('✅ Application fully initialized')
}

export async function refreshAppCache(): Promise<void> {
  teamMemberCache.reset()
  await teamMemberCache.init()
  console.log('🔄 App cache refreshed')
}
```

**Startup Flow:**
```
Server Start → First API Request
                ↓
          ensureAppInitialized()
                ↓
    1. teamMemberCache.init() (fast)
    2. ensureOutlierInitialized() (slower)
                ↓
          API returns data
```

### 6. Error Handling

| Scenario | Behavior |
|----------|----------|
| userId not in cache | Returns `userId` (fallback) or `"Unknown Staff"` |
| userId is NULL/empty | Returns `"Unknown Staff"` |
| DB connection fails during init | Logs error, continues with empty cache |
| LEFT JOIN no match | Returns `NULL` (use `COALESCE` for fallback) |
| Staff deactivated | Not loaded in cache, excluded from INNER JOIN |

## Query Classification

### Report Queries (SQL JOIN)
| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `/api/dashboard/staff` | Staff Performance | High |
| `/api/dashboard/report` | Monthly Report | High |
| `/api/dashboard/outliers/*` | Outliers | High |
| `/api/dashboard/kpi` | KPI Stats | Medium |

### Real-time Queries (Cache)
| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `/api/dashboard/tickets` | Ticket List | High |
| `/api/dashboard/ticket/[message_id]` | Ticket Detail | High |
| `/api/dashboard/monthly-tickets` | Available Months | Medium |

## Files to Create

| File | Purpose |
|------|---------|
| `app/lib/teamMemberCache.ts` | Cache service |
| `app/lib/appInitialization.ts` | Startup initialization |
| `__tests__/lib/teamMemberCache.test.ts` | Unit tests |

## Files to Modify

| File | Changes |
|------|---------|
| `repository/OutlierRepository.ts` | Add SQL JOIN to all report queries |
| `app/api/dashboard/tickets/route.ts` | Use cache for name lookup |
| `app/api/dashboard/monthly-tickets/route.ts` | Use cache for name lookup |
| `types/outlier.ts` | Add TeamMember types |
| `app/lib/apiInitializer.ts` | Integrate with app initialization |

## Migration Notes

**Database Status:** Already migrated
- `ticket.updated_by` contains `userId` values
- `ticket.assigned_to` contains `userId` values
- `it_team` table exists with staff mappings

**Code Changes Required:**
1. Create TeamMemberCache service
2. Update all SQL queries to JOIN with `it_team` (report queries)
3. Update real-time queries to use cache
4. Remove `normalizeStylizedText()` usage (no longer needed)
5. Update type definitions

## Testing Strategy

### Unit Tests
```typescript
describe('TeamMemberCache', () => {
  it('should load staff from database')
  it('should return display name for valid userId')
  it('should return fallback for unknown userId')
  it('should return unknown label for empty userId')
  it('should return email for valid userId')
})
```

### Integration Tests
```typescript
describe('Staff API with TeamMemberCache', () => {
  it('should return staff with correct display names')
  it('should not expose userId in API responses')
})
```

## Benefits

1. ✅ **Resolves stylized text issues** - No normalization needed
2. ✅ **Centralized name control** - Change names in one place
3. ✅ **Performance** - Cache for real-time queries
4. ✅ **Accuracy** - SQL JOIN for reports
5. ✅ **Maintainability** - Single source of truth
6. ✅ **Scalability** - Easy to add more staff attributes

## Rollback Plan

If issues arise:
1. Revert code changes
2. Database remains in migrated state (userId in updated_by)
3. Temporary: Map userId → names using existing normalize logic
4. Long-term: Database rollback script to restore names

## Open Questions

None at this time.
