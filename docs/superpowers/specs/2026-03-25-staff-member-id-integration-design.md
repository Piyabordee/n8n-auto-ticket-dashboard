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
| id | INT | Primary key (auto-increment) |
| fromUser | NVARCHAR | Display name (e.g., "หลวิชัย") |
| userId | NVARCHAR | Unique ID (e.g., "Ub4c47e7e4f26bc5cee8868372fb6d759") |
| active | CHAR(1) | 'Y' or 'N' |
| email_spiceworks | NVARCHAR | Email address |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |

**Sample Data:**
```
id | fromUser   | userId                          | active | email_spiceworks
---|------------|---------------------------------|--------|------------------
1  | พชร       | Ub5f95381fdd39c0468e01f813ed50631 | Y      | pachara.s@...
2  | อภิสิทธิ์ | Ufac40f3d56ef2360068d8d98fb3abe10 | Y      | apisit.s@...
3  | หลวิชัย   | Ub4c47e7e4f26bc5cee8868372fb6d759 | Y      | holvichai.k@...
```

### Database Verification

Run these queries to verify database state before implementation:

```sql
-- Check if updated_by contains userIds (UUID-like format starting with 'U')
SELECT TOP 10 updated_by FROM [Dev_Born].[dbo].[ticket]

-- Verify it_team table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'it_team'

-- Sample it_team data
SELECT TOP 5 * FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y'

-- Count tickets vs staff mappings
SELECT
  (SELECT COUNT(*) FROM [Dev_Born].[dbo].[ticket] WHERE updated_by IS NOT NULL) as total_tickets,
  (SELECT COUNT(*) FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y') as active_staff
```

### ticket Table (Already Migrated)

| Column | Type | Description |
|--------|------|-------------|
| updated_by | NVARCHAR | Now stores **userId** (not display name) |
| assigned_to | NVARCHAR | Now stores **userId** (not display name) |

**Note:** Code still uses `normalizeStylizedText()` as legacy. This will be removed after migration is complete.

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
  getUserIdByDisplayName(displayName: string): string | null  // NEW
  has(userId: string): boolean
  getStats(): { size: number, initialized: boolean }
  reset(): void
}

export const teamMemberCache = new TeamMemberCache()
```

**Configuration:**
- `fallbackToUserId: true` - Return userId if not found in cache
- `unknownLabel: 'Unknown Staff'` - Label for empty/null userId

**UserId Format:**
- Format: `U` + 32 hexadecimal characters (e.g., `Ub4c47e7e4f26bc5cee8868372fb6d759`)
- Pattern: `^U[a-f0-9]{32}$` (case-insensitive)
- Empty string should be treated as NULL
- Validation is NOT enforced - any non-empty value is accepted

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

**Handling Orphaned UserIds:**

Tickets with `updated_by` values that don't match any `it_team.userId` (legacy data, deleted staff, data errors):

**Option A: Strict Mode (Recommended for Reports)**
- Use `INNER JOIN` to exclude orphaned tickets
- Report counts may be slightly lower than total ticket count

**Option B: Inclusive Mode (Recommended for Debugging)**
```sql
LEFT JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
WHERE
  (tm.active = 'Y' OR tm.active IS NULL)
-- Use COALESCE for display name fallback:
COALESCE(tm.fromUser, t.updated_by, 'Unknown Staff') AS staff_name
```

**Decision:** Use Option A (INNER JOIN) for production reports to ensure data quality. Use Option B (LEFT JOIN) only for debugging queries.

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
| DB connection fails during init | Logs error, continues with empty cache, APIs return fallback values |
| LEFT JOIN no match | Returns `NULL` (use `COALESCE` for fallback) |
| Staff deactivated | Not loaded in cache, excluded from INNER JOIN |
| Cache not initialized on first API call | Auto-initializes before proceeding (lazy init) |

**Cache Initialization Failure Behavior:**

When `teamMemberCache.init()` fails:
1. Log error: `❌ TeamMemberCache init failed: {error}`
2. Set `initialized = false` to allow retry
3. APIs continue working with fallback behavior:
   - `getDisplayName()` returns userId or "Unknown Staff"
   - No exceptions thrown to API consumers
4. Next API call will retry initialization

## Staff Filter Parameter Handling

**Problem:** The `/api/dashboard/tickets` endpoint accepts a `staff` parameter for filtering. After migration:
- Database stores `userId` in `updated_by`
- UI sends display name (e.g., "หลวิชัย") as `staff` parameter

**Solution:** Add reverse lookup in TeamMemberCache

```typescript
// Add to TeamMemberCache class
getUserIdByDisplayName(displayName: string): string | null {
  for (const [userId, name] of this.cache.entries()) {
    if (name === displayName) {
      return userId
    }
  }
  return null
}
```

**Implementation in API:**

```typescript
// Before: Direct filter (OLD - no longer works)
if (staff) {
  query += ` AND updated_by = @staff`
}

// After: Reverse lookup (NEW)
if (staff) {
  const userId = teamMemberCache.getUserIdByDisplayName(staff)
  if (userId) {
    query += ` AND updated_by = @userId`
  } else {
    // Staff name not found - return empty result
    return []
  }
}
```

**Alternative:** Change UI to send `userId` directly instead of display name (requires frontend changes).

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

## Monitoring & Observability

**Logs to Track:**
```
✅ TeamMemberCache loaded: {size} staff members
❌ TeamMemberCache init failed: {error}
🔄 App cache refreshed
```

**Metrics to Monitor:**
- Cache hit rate (should be near 100% after warmup)
- Orphaned userId count (tickets with userId not in it_team)
- Cache initialization time (expected < 100ms)
- Staff member count (expected 5-20 for typical teams)

**Health Check Endpoint (Optional):**
```typescript
// GET /api/health/cache
{
  cache: {
    initialized: true,
    size: 8,
    lastRefresh: "2026-03-25T10:30:00Z"
  }
}
```

## Migration Notes
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

## Cache Refresh Strategy

**Design Decision:** Load cache once at server startup with no automatic invalidation.

**Rationale:**
- Staff names change infrequently
- Cache is small (~100 bytes per staff member)
- Simpler implementation
- Server restart is acceptable for name updates

**Manual Refresh (Optional):**

If manual refresh is needed:
1. Restart server
2. Or call `POST /api/admin/refresh-cache` endpoint:

```typescript
// POST /api/admin/refresh-cache
import { refreshAppCache } from '@/lib/appInitialization'

export async function POST() {
  await refreshAppCache()
  return NextResponse.json({ success: true, message: 'Cache refreshed' })
}
```

**Future Enhancement:** If staff names change frequently, consider:
- Cache TTL with auto-refresh (e.g., every 15 minutes)
- Event-based refresh when `it_team` table is updated
- Pub/sub mechanism for real-time updates

## Open Questions

None at this time.
