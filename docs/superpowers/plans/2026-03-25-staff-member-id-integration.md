# Staff Member ID Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct staff name storage with userId references, using SQL JOINs for reports and a centralized cache for real-time queries.

**Architecture:** Hybrid approach - Report queries use SQL JOIN with it_team table for accuracy; real-time queries use TeamMemberCache (loaded at startup) for performance.

**Tech Stack:** Next.js 14, TypeScript, MSSQL (mssql package), Vitest

**Spec Reference:** `docs/superpowers/specs/2026-03-25-staff-member-id-integration-design.md`

## Pre-flight Checklist

**Before starting implementation, verify:**

- [ ] Database is migrated - `ticket.updated_by` contains userId format (e.g., `Ub4c47e7e4f26bc5cee8868372fb6d759`)
- [ ] `it_team` table exists and has active staff data
- [ ] Database connection is working
- [ ] Node.js dependencies are installed (`npm install`)

### Task 0: Database State Verification (CRITICAL - MUST BE DONE FIRST)

**Purpose:** Verify the database has been migrated before starting implementation.

- [ ] **Step 1: Verify updated_by contains userId values**

Run in SQL Server Management Studio:

```sql
-- Check if updated_by contains userIds (UUID-like format starting with 'U')
SELECT TOP 10 updated_by,
  CASE
    WHEN updated_by LIKE 'U[a-f0-9]%' THEN 'userId format'
    ELSE 'display name format'
  END as format_type
FROM [Dev_Born].[dbo].[ticket]
WHERE updated_by IS NOT NULL
```

**Expected:** All rows should show "userId format"

**If this shows "display name format":** STOP - Database migration not complete. Contact database administrator.

- [ ] **Step 2: Verify it_team table exists and has data**

```sql
-- Check table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'it_team'

-- Check active staff count
SELECT COUNT(*) as staff_count FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y'

-- Sample data
SELECT TOP 5 * FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y'
```

**Expected:** Table exists, staff_count > 0

- [ ] **Step 3: Check for orphaned userIds (optional)**

```sql
-- Count tickets with userId not in it_team
SELECT COUNT(*) as orphaned_count
FROM [Dev_Born].[dbo].[ticket] t
LEFT JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
WHERE t.updated_by IS NOT NULL
  AND t.updated_by != ''
  AND tm.userId IS NULL
```

**Note:** orphaned_count should be 0 or low. If high, may need data cleanup.

---

## File Structure

### Files to Create
| File | Purpose |
|------|---------|
| `app/lib/teamMemberCache.ts` | Centralized cache service (userId → fromUser mapping) |
| `app/lib/appInitialization.ts` | Startup initialization (loads cache + outlier init) |
| `__tests__/lib/teamMemberCache.test.ts` | Unit tests for TeamMemberCache |

### Files to Modify
| File | Changes |
|------|---------|
| `types/outlier.ts` | Add TeamMember, TeamMemberCacheConfig types |
| `repository/OutlierRepository.ts` | Add SQL JOIN with it_team for all report queries |
| `app/api/dashboard/tickets/route.ts` | Use TeamMemberCache for display names |
| `app/api/dashboard/monthly-tickets/route.ts` | Use TeamMemberCache for display names |
| `app/api/dashboard/ticket/[message_id]/route.ts` | Use TeamMemberCache for display names |

---

## Chunk 1: TeamMemberCache Service

Create the centralized cache service that loads staff members from it_team table at startup.

### Task 1.1: Create TeamMemberCache Service

**Files:**
- Create: `app/lib/teamMemberCache.ts`
- Test: `__tests__/lib/teamMemberCache.test.ts`

- [ ] **Step 1: Write the failing test for cache initialization**

Create `__tests__/lib/teamMemberCache.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { teamMemberCache } from '@/lib/teamMemberCache'

// Mock the sql.ts module, not mssql directly
// This ensures getConnection() returns our mock pool
vi.mock('@/lib/sql', () => ({
  getConnection: vi.fn().mockResolvedValue({
    connected: true,
    request: vi.fn().mockReturnValue({
      input: vi.fn().mockReturnThis(),
      query: vi.fn()
    })
  })
}))

describe('TeamMemberCache', () => {
  beforeEach(() => {
    // Reset cache before each test
    teamMemberCache.reset()
  })

  describe('initialization', () => {
    it('should load staff from database', async () => {
      // Mock SQL response
      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue({
          input: vi.fn().mockReturnThis(),
          query: vi.fn().mockResolvedValue({
            recordset: [
              { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', email_spiceworks: 'holvichai.k@superrich1965.co.th', active: 'Y' },
              { userId: 'Ufac40f3d56ef2360068d8d98fb3abe10', fromUser: 'อภิสิทธิ์', email_spiceworks: 'apisit.s@superrich1965.co.th', active: 'Y' }
            ]
          })
        })
      }

      vi.mocked(sql.connect).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()

      const stats = teamMemberCache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.initialized).toBe(true)
    })

    it('should not initialize twice', async () => {
      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue({
          input: vi.fn().mockReturnThis(),
          query: vi.fn().mockResolvedValue({ recordset: [] })
        })
      }

      vi.mocked(sql.connect).mockResolvedValue(mockPool as any)

      await teamMemberCache.init()
      await teamMemberCache.init() // Second call should be no-op

      expect(mockPool.request).toHaveBeenCalledTimes(1)
    })
  })

  describe('getDisplayName', () => {
    it('should return display name for valid userId', async () => {
      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue({
          input: vi.fn().mockReturnThis(),
          query: vi.fn().mockResolvedValue({
            recordset: [
              { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', active: 'Y' }
            ]
          })
        })
      }

      vi.mocked(sql.connect).mockResolvedValue(mockPool as any)
      await teamMemberCache.init()

      const name = teamMemberCache.getDisplayName('Ub4c47e7e4f26bc5cee8868372fb6d759')
      expect(name).toBe('หลวิชัย')
    })

    it('should return userId for unknown userId (fallbackToUserId=true)', () => {
      teamMemberCache.reset()
      const name = teamMemberCache.getDisplayName('unknown-id')
      expect(name).toBe('unknown-id')
    })

    it('should return Unknown Staff for empty userId', () => {
      const name = teamMemberCache.getDisplayName('')
      expect(name).toBe('Unknown Staff')
    })
  })

  describe('getEmail', () => {
    it('should return email for valid userId', async () => {
      const mockPool = {
        connected: true,
        request: vi.fn().mockReturnValue({
          input: vi.fn().mockReturnThis(),
          query: vi.fn().mockResolvedValue({
            recordset: [
              { userId: 'Ub4c47e7e4f26bc5cee8868372fb6d759', fromUser: 'หลวิชัย', email_spiceworks: 'holvichai.k@superrich1965.co.th', active: 'Y' }
            ]
          })
        })
      }

      vi.mocked(sql.connect).mockResolvedValue(mockPool as any)
      await teamMemberCache.init()

      const email = teamMemberCache.getEmail('Ub4c47e7e4f26bc5cee8868372fb6d759')
      expect(email).toBe('holvichai.k@superrich1965.co.th')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test __tests__/lib/teamMemberCache.test.ts`
Expected: FAIL with "Cannot find module '@/lib/teamMemberCache'"

- [ ] **Step 3: Create TeamMemberCache service implementation**

Create `app/lib/teamMemberCache.ts`:

```typescript
/**
 * TeamMemberCache - Centralized cache for staff lookups
 * Loads active staff members from it_team table at server startup
 *
 * UserId Format: U + 32 hex characters (e.g., Ub4c47e7e4f26bc5cee8868372fb6d759)
 */

import sql from 'mssql'
import { getConnection } from './sql'

export interface TeamMember {
  userId: string
  fromUser: string
  email: string | null
  active: 'Y' | 'N'
}

export interface TeamMemberCacheConfig {
  fallbackToUserId: boolean    // If true, return userId when not found
  unknownLabel: string         // Label to return when fallback is false
}

class TeamMemberCache {
  private cache: Map<string, string>         // userId → fromUser
  private emailCache: Map<string, string>    // userId → email
  private initialized: boolean = false
  private config: TeamMemberCacheConfig

  constructor(config?: Partial<TeamMemberCacheConfig>) {
    this.cache = new Map()
    this.emailCache = new Map()
    this.config = {
      fallbackToUserId: true,
      unknownLabel: 'Unknown Staff',
      ...config
    }
  }

  /**
   * Load all active staff from database
   * Safe to call multiple times - only initializes once
   */
  async init(): Promise<void> {
    if (this.initialized) return

    try {
      const pool = await getConnection()
      const result = await pool.request()
        .query(`
          SELECT userId, fromUser, email_spiceworks, active
          FROM [Dev_Born].[dbo].[it_team]
          WHERE active = 'Y'
        `)

      for (const row of result.recordset) {
        this.cache.set(row.userId, row.fromUser)
        this.emailCache.set(row.userId, row.email_spiceworks || '')
      }

      this.initialized = true
      console.log(`✅ TeamMemberCache loaded: ${this.cache.size} staff members`)
    } catch (error) {
      console.error('❌ TeamMemberCache init failed:', error)
      // Don't throw - allow app to continue with empty cache
      this.initialized = false
    }
  }

  /**
   * Get display name by userId
   * Returns fallback (userId or 'Unknown Staff') if not found
   */
  getDisplayName(userId: string): string {
    if (!userId) return this.config.unknownLabel
    return this.cache.get(userId)
      ?? (this.config.fallbackToUserId ? userId : this.config.unknownLabel)
  }

  /**
   * Get email by userId
   */
  getEmail(userId: string): string | null {
    if (!userId) return null
    return this.emailCache.get(userId) ?? null
  }

  /**
   * Reverse lookup: get userId by display name
   * Useful for filtering by display name from UI
   */
  getUserIdByDisplayName(displayName: string): string | null {
    for (const [userId, name] of this.cache.entries()) {
      if (name === displayName) {
        return userId
      }
    }
    return null
  }

  /**
   * Check if userId exists in cache
   */
  has(userId: string): boolean {
    return this.cache.has(userId)
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      initialized: this.initialized
    }
  }

  /**
   * Reset cache (for testing or manual refresh)
   */
  reset(): void {
    this.cache.clear()
    this.emailCache.clear()
    this.initialized = false
  }
}

// Singleton instance
export const teamMemberCache = new TeamMemberCache()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test __tests__/lib/teamMemberCache.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/lib/teamMemberCache.ts __tests__/lib/teamMemberCache.test.ts
git commit -m "feat: add TeamMemberCache service for staff lookups"
```

---

## Chunk 2: App Initialization & Type Definitions

Create app initialization that loads cache on startup, and add type definitions.

### Task 2.1: Add Type Definitions

**Files:**
- Modify: `types/outlier.ts`

- [ ] **Step 1: Add TeamMember types to types/outlier.ts**

Add to the end of `types/outlier.ts`:

```typescript
// ============================================================================
// Team Member Types (for userId → fromUser mapping)
// ============================================================================

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
```

- [ ] **Step 2: Run tests to ensure no type errors**

Run: `npm run test`
Expected: PASS (or existing failures only)

- [ ] **Step 3: Commit**

```bash
git add types/outlier.ts
git commit -m "types: add TeamMember and TeamMemberCacheConfig types"
```

### Task 2.2: Create App Initialization

**Files:**
- Create: `app/lib/appInitialization.ts`
- Modify: `app/lib/apiInitializer.ts`

- [ ] **Step 1: Create appInitialization.ts**

Create `app/lib/appInitialization.ts`:

```typescript
/**
 * Application Initialization
 * Coordinates startup initialization for all app services
 *
 * Initialization order:
 * 1. TeamMemberCache (fast, < 100ms)
 * 2. Outlier detection (slower, may take seconds)
 */

import { teamMemberCache } from './teamMemberCache'
import { ensureOutlierInitialized } from './apiInitializer'

let appInitialized = false

/**
 * Ensure all app services are initialized
 * Safe to call multiple times - only initializes once
 */
export async function ensureAppInitialized(): Promise<void> {
  if (appInitialized) return

  try {
    // Initialize team member cache first (fast)
    await teamMemberCache.init()

    // Then initialize outlier detection (slower, may trigger recalculation)
    await ensureOutlierInitialized()

    appInitialized = true
    console.log('✅ Application fully initialized')
  } catch (error) {
    console.error('❌ App initialization failed:', error)
    // Don't throw - allow APIs to function with fallbacks
  }
}

/**
 * Manual cache refresh
 * Use this after updating it_team table
 */
export async function refreshAppCache(): Promise<void> {
  teamMemberCache.reset()
  await teamMemberCache.init()
  console.log('🔄 App cache refreshed')
}
```

- [ ] **Step 2: Update apiInitializer.ts to export initialization**

Add to the END of `app/lib/apiInitializer.ts` (after line 25):

```typescript
// Re-export app initialization for convenience
export { ensureAppInitialized, refreshAppCache } from './appInitialization'
```

- [ ] **Step 3: Write test for app initialization**

Create `__tests__/lib/appInitialization.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ensureAppInitialized, refreshAppCache } from '@/lib/appInitialization'
import { teamMemberCache } from '@/lib/teamMemberCache'

vi.mock('@/lib/teamMemberCache')
vi.mock('@/lib/apiInitializer')

describe('App Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize team member cache and outlier detection', async () => {
    const mockInit = vi.fn().mockResolvedValue(undefined)
    vi.mocked(teamMemberCache.init).mockImplementation(mockInit)

    await ensureAppInitialized()

    expect(mockInit).toHaveBeenCalled()
  })

  it('should refresh cache on request', async () => {
    const mockReset = vi.fn()
    const mockInit = vi.fn().mockResolvedValue(undefined)
    vi.mocked(teamMemberCache.reset).mockImplementation(mockReset)
    vi.mocked(teamMemberCache.init).mockImplementation(mockInit)

    await refreshAppCache()

    expect(mockReset).toHaveBeenCalled()
    expect(mockInit).toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run tests to verify**

Run: `npm test __tests__/lib/appInitialization.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/lib/appInitialization.ts app/lib/apiInitializer.ts __tests__/lib/appInitialization.test.ts
git commit -m "feat: add app initialization with cache and outlier detection"
```

---

## Chunk 3: Report Queries - SQL JOIN (OutlierRepository)

Modify all SQL queries in OutlierRepository to JOIN with it_team table for accurate display names.

### Task 3.1: Update getStaffPerformanceWithOutliers Query

**Files:**
- Modify: `repository/OutlierRepository.ts` (lines ~310-450)

- [ ] **Step 1: Read the current query implementation**

Read `repository/OutlierRepository.ts` from line 310 to 450 to understand the current SQL structure.

- [ ] **Step 2: Update the SQL query to JOIN with it_team**

Modify the `getStaffPerformanceWithOutliers` method in `repository/OutlierRepository.ts` (starting around line 326).

Replace the ENTIRE query with this updated version (adds JOIN with it_team):

```sql
-- Full year data for baseline
WITH full_year_base AS (
  SELECT
    t.updated_by AS user_id,
    tm.fromUser AS staff_name,
    t.message_id,
    t.close_time_minute AS diff_minutes
  FROM [Dev_Born].[dbo].[ticket] t
  INNER JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
  WHERE
    t.close_time_minute IS NOT NULL
    AND t.created_date >= @yearStartDate
    AND t.created_date <= @yearEndDate
    AND t.updated_by IS NOT NULL
    AND t.updated_by != ''
    AND t.status != 'unsent'
    AND tm.active = 'Y'
),
-- Calculate per-person median
per_person_median AS (
  SELECT DISTINCT
    user_id,
    staff_name,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY diff_minutes) OVER (PARTITION BY user_id) AS personal_median,
    COUNT(*) OVER (PARTITION BY user_id) AS ticket_count
  FROM full_year_base
),
-- Calculate absolute deviations from median
absolute_deviations AS (
  SELECT
    f.user_id,
    f.staff_name,
    ABS(f.diff_minutes - m.personal_median) AS abs_deviation
  FROM full_year_base f
  INNER JOIN per_person_median m ON f.user_id = m.user_id
  WHERE m.ticket_count >= 2
),
-- Calculate MAD (Median of Absolute Deviations)
per_person_mad AS (
  SELECT DISTINCT
    user_id,
    staff_name,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY abs_deviation) OVER (PARTITION BY user_id) AS personal_mad
  FROM absolute_deviations
),
-- Combined stats: median + 15*MAD
per_person_stats AS (
  SELECT
    m.user_id,
    m.staff_name,
    m.personal_median,
    mad.personal_mad,
    m.personal_median + (15 * mad.personal_mad) AS personal_threshold
  FROM per_person_median m
  INNER JOIN per_person_mad mad ON m.user_id = mad.user_id
  WHERE m.ticket_count >= 2
),
-- Filtered data for results display - ALL tickets including pending
filtered_base AS (
  SELECT
    t.updated_by AS user_id,
    tm.fromUser AS staff_name,
    t.message_id,
    t.status,
    t.close_time_minute AS diff_minutes
  FROM [Dev_Born].[dbo].[ticket] t
  INNER JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
  WHERE
    t.created_date >= @filterStartDate
    AND t.created_date <= @filterEndDate
    AND t.updated_by IS NOT NULL
    AND t.updated_by != ''
    AND t.status != 'unsent'
    AND tm.active = 'Y'
),
classified AS (
  -- Classify each ticket based on FULL YEAR baseline
  SELECT
    b.user_id,
    b.staff_name,
    b.message_id,
    b.status,
    b.diff_minutes,
    s.personal_median,
    s.personal_mad,
    s.personal_threshold,
    CASE
      WHEN b.diff_minutes IS NULL THEN 0  -- Pending tickets have no close time
      WHEN s.personal_median IS NULL THEN 0  -- Insufficient data
      WHEN b.diff_minutes > s.personal_threshold THEN 1
      ELSE 0
    END AS is_outlier
  FROM filtered_base b
  LEFT JOIN per_person_stats s ON b.user_id = s.user_id
)
SELECT
  staff_name AS updated_by,
  COUNT(*) as totalAssigned,
  SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
  SUM(CASE WHEN status != 'closed' THEN 1 ELSE 0 END) as totalPending,
  AVG(CASE WHEN diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeAll,
  AVG(CASE WHEN is_outlier = 0 AND diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeNormal,
  AVG(CASE WHEN is_outlier = 1 AND diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeOutlier,
  SUM(is_outlier) as outlierCount,
  -- Add personal stats fields
  MAX(c.personal_median) as personal_median,
  MAX(c.personal_mad) as personal_mad,
  MAX(c.personal_threshold) as personal_threshold
FROM classified c
GROUP BY staff_name
ORDER BY totalAssigned DESC
```

**Key changes:**
1. All CTEs now select both `user_id` (for grouping) and `staff_name` (for display)
2. `INNER JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId` added to both base CTEs
3. `AND tm.active = 'Y'` filter added
4. Final SELECT uses `staff_name AS updated_by` and `GROUP BY staff_name`

Also update the summaryResult query (second query in same method) with the same pattern.

- [ ] **Step 3: Test the API endpoint**

Run: `curl -s "http://localhost:5000/api/dashboard/staff?year=2026" | jq`
Expected: Returns staff with Thai names (fromUser), not userIds

- [ ] **Step 4: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(staff): add SQL JOIN with it_team for staff performance query"
```

### Task 3.2: Update getOutliers Query

**Files:**
- Modify: `repository/OutlierRepository.ts` (getOutliers method)

- [ ] **Step 1: Find the getOutliers method**

Search for the `getOutliers` method in `repository/OutlierRepository.ts` (around line 200-300).

- [ ] **Step 2: Update SQL query with JOIN**

Add the same JOIN pattern:

```sql
INNER JOIN [Dev_Born].[dbo].[it_team] tm
  ON t.updated_by = tm.userId
...
AND tm.active = 'Y'
...
tm.fromUser AS updated_by
```

- [ ] **Step 3: Test the API endpoint**

Run: `curl -s "http://localhost:5000/api/dashboard/outliers/all?year=2026" | jq '.outliers[0].updated_by'`
Expected: Returns Thai name, not userId

- [ ] **Step 4: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(outliers): add SQL JOIN with it_team for outliers query"
```

### Task 3.3: Update getTopOutliers Query

**Files:**
- Modify: `repository/OutlierRepository.ts` (getTopOutliers method)

- [ ] **Step 1: Update SQL query with JOIN**

Same pattern as Task 3.2 - add INNER JOIN with it_team.

- [ ] **Step 2: Test the API endpoint**

Run: `curl -s "http://localhost:5000/api/dashboard/outliers/top3?year=2026" | jq '.top3[0].updated_by'`
Expected: Returns Thai name, not userId

- [ ] **Step 3: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(outliers): add SQL JOIN with it_team for top outliers query"
```

### Task 3.4: Update Other Report Queries

**Files:**
- Modify: `repository/OutlierRepository.ts` (getDailyTickets, getMonthlyTickets, getKpiStats if applicable)

- [ ] **Step 1: Check if getDailyTickets needs updating**

Review the `getDailyTickets` method - if it returns `updated_by`, add the JOIN.

- [ ] **Step 2: Check if getMonthlyTickets needs updating**

Review the `getMonthlyTickets` method - if it returns `updated_by`, add the JOIN.

- [ ] **Step 3: Check if getKpiStats needs updating**

Review the `getKpiStats` method - if it returns staff-specific data, add the JOIN.

- [ ] **Step 4: Test all affected endpoints**

Run: `npm test` to ensure no regressions

- [ ] **Step 5: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(reports): add SQL JOIN with it_team to remaining report queries"
```

---

## Chunk 4: Real-time Queries - Cache Usage

Modify API routes to use TeamMemberCache for display name lookups.

### Task 4.1: Update Ticket List API

**Files:**
- Modify: `app/api/dashboard/tickets/route.ts`

- [ ] **Step 1: Read current implementation**

Read `app/api/dashboard/tickets/route.ts` to understand current structure.

- [ ] **Step 2: Add cache import and initialization**

Add at top of file:

```typescript
import { teamMemberCache } from '@/lib/teamMemberCache'
import { ensureAppInitialized } from '@/lib/appInitialization'
```

- [ ] **Step 3: Add initialization at start of GET handler**

```typescript
export async function GET(request: NextRequest) {
  // Ensure app is initialized (includes cache)
  await ensureAppInitialized()

  // ... existing code ...
```

- [ ] **Step 4: Update ticket mapping to use cache**

Find where tickets are mapped (likely in a `.map()` or similar) and update `updated_by`:

```typescript
// OLD:
updated_by: row.updated_by ? normalizeStylizedText(row.updated_by) : 'Unassigned',

// NEW:
updated_by: teamMemberCache.getDisplayName(row.updated_by || 'Unassigned'),
```

Remove `normalizeStylizedText` import if no longer used.

- [ ] **Step 5: Handle staff filter parameter with reverse lookup**

Find the existing staff filter code around line 119-120 in `app/api/dashboard/tickets/route.ts`:

```typescript
// OLD CODE (DELETE THIS BLOCK):
if (staff) {
  query += ` AND updated_by = @staff`
  requestQuery.input('staff', sql.NVarChar, staff)
}

// NEW CODE (ADD THIS BLOCK INSTEAD):
if (staff) {
  const userId = teamMemberCache.getUserIdByDisplayName(staff)
  // If staff name not found, return empty result immediately
  if (!userId) {
    return NextResponse.json({ tickets: [], total: 0 })
  }
  query += ` AND updated_by = @userId`
  requestQuery.input('userId', sql.NVarChar, userId)
}
```

- [ ] **Step 6: Test the API endpoint**

Run: `curl -s "http://localhost:5000/api/dashboard/tickets?year=2026&month=3" | jq '.tickets[0].updated_by'`
Expected: Returns Thai name, not userId

- [ ] **Step 7: Commit**

```bash
git add app/api/dashboard/tickets/route.ts
git commit -m "feat(tickets): use TeamMemberCache for display names in ticket list"
```

### Task 4.2: Update Monthly Tickets API

**Files:**
- Modify: `app/api/dashboard/monthly-tickets/route.ts`

- [ ] **Step 1: Add cache imports**

```typescript
import { teamMemberCache } from '@/lib/teamMemberCache'
import { ensureAppInitialized } from '@/lib/appInitialization'
```

- [ ] **Step 2: Add initialization**

```typescript
export async function GET(request: NextRequest) {
  await ensureAppInitialized()
  // ... existing code ...
```

- [ ] **Step 3: Update ticket mapping**

Same pattern as Task 4.1 - use `teamMemberCache.getDisplayName()` for `updated_by`.

- [ ] **Step 4: Test the API endpoint**

Run: `curl -s "http://localhost:5000/api/dashboard/monthly-tickets" | jq '.years[0]'` (check structure)

- [ ] **Step 5: Commit**

```bash
git add app/api/dashboard/monthly-tickets/route.ts
git commit -m "feat(monthly-tickets): use TeamMemberCache for display names"
```

### Task 4.3: Update Ticket Detail API

**Files:**
- Modify: `app/api/dashboard/ticket/[message_id]/route.ts`

- [ ] **Step 1: Add cache imports and initialization**

Same pattern as previous tasks.

- [ ] **Step 2: Update ticket response mapping**

Use `teamMemberCache.getDisplayName()` for `updated_by` and `assigned_to` if present.

- [ ] **Step 3: Test the API endpoint**

Run: `curl -s "http://localhost:5000/api/dashboard/ticket/606476562258198939" | jq '.updated_by'`
Expected: Returns Thai name, not userId

- [ ] **Step 4: Commit**

```bash
git add app/api/dashboard/ticket/[message_id]/route.ts
git commit -m "feat(ticket-detail): use TeamMemberCache for display names"
```

---

## Chunk 5: Cleanup & Finalization

Remove obsolete code and verify everything works.

### Task 5.1: Remove normalizeStylizedText Usage

**Files:**
- Modify: All files that import `normalizeStylizedText`

- [ ] **Step 1: Search for remaining usage**

Run: `grep -r "normalizeStylizedText" app/api/ repository/ --include="*.ts"`

- [ ] **Step 2: Remove unused imports**

Remove `import { normalizeStylizedText }` from files where it's no longer used.

- [ ] **Step 3: Keep normalizeStylizedText for edge cases**

The function might still be useful for:
- Data migration scripts
- Admin endpoints that handle raw data
- Legacy data cleanup

**Do NOT delete** `app/lib/normalizeText.ts` - it may still be useful.

- [ ] **Step 4: Run tests to ensure nothing broke**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add app/api/ repository/
git commit -m "refactor: remove unused normalizeStylizedText imports"
```

### Task 5.2: Verify All Endpoints

- [ ] **Step 1: Test Staff Performance API**

Run: `curl -s "http://localhost:5000/api/dashboard/staff?year=2026" | jq '.staff[0].name'`
Expected: Thai name (e.g., "หลวิชัย")

- [ ] **Step 2: Test Ticket List API**

Run: `curl -s "http://localhost:5000/api/dashboard/tickets?year=2026&month=3&status=all" | jq '.tickets[0].updated_by'`
Expected: Thai name

- [ ] **Step 3: Test Outliers API**

Run: `curl -s "http://localhost:5000/api/dashboard/outliers/all?year=2026" | jq '.outliers[0].updated_by'`
Expected: Thai name

- [ ] **Step 4: Test Monthly Report API**

Run: `curl -s "http://localhost:5000/api/dashboard/report?year=2026&month=3" | jq`
Expected: No errors, data contains Thai names

- [ ] **Step 5: Test staff filter**

Run: `curl -s "http://localhost:5000/api/dashboard/tickets?year=2026&month=3&staff=หลวิชัย" | jq '.tickets[0].updated_by'`
Expected: Returns only tickets assigned to หลวิชัย

### Task 5.3: Optional - Cache Refresh Endpoint

**Purpose:** Admin endpoint to manually refresh the TeamMemberCache.

**Files:**
- Create: `app/api/admin/refresh-cache/route.ts`

- [ ] **Step 1: Create refresh cache endpoint**

Create directory `app/api/admin/refresh-cache/` and create `route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { refreshAppCache } from '@/lib/appInitialization'

export async function POST() {
  try {
    await refreshAppCache()
    return NextResponse.json({ success: true, message: 'Cache refreshed' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test the endpoint**

Run: `curl -X POST "http://localhost:5000/api/admin/refresh-cache"`
Expected: `{"success":true,"message":"Cache refreshed"}`

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/refresh-cache/route.ts
git commit -m "feat(admin): add cache refresh endpoint"
```

### Task 5.4: Database Verification

- [ ] **Step 1: Verify database state**

Run these queries in SQL Server Management Studio:

```sql
-- Check it_team table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'it_team'

-- Sample it_team data
SELECT TOP 5 * FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y'

-- Check ticket.updated_by contains userIds
SELECT TOP 10 updated_by FROM [Dev_Born].[dbo].[ticket]

-- Count orphaned userIds (tickets with userId not in it_team)
SELECT COUNT(*) as orphaned_count
FROM [Dev_Born].[dbo].[ticket] t
LEFT JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
WHERE t.updated_by IS NOT NULL
  AND t.updated_by != ''
  AND tm.userId IS NULL
```

Expected:
- `it_team` table exists with data
- `updated_by` contains userId-like strings (U + hex)
- `orphaned_count` should be 0 or very low

- [ ] **Step 6: Test orphaned userId handling**

Run: `curl -s "http://localhost:5000/api/dashboard/staff?year=2026" | jq '.staff | length'`

Expected: Staff count should match active staff count (may exclude orphaned tickets)

Note: Orphaned tickets (userId not in it_team) are excluded by INNER JOIN in report queries. For real-time queries, they show userId or "Unknown Staff" depending on config.

### Task 5.4: Final Documentation

- [ ] **Step 1: Update CLAUDE.md or AGENTS.md if needed**

Add note about the new staff ID system if relevant to future work.

- [ ] **Step 2: Create migration note**

Create `docs/migrations/staff-member-id-integration.md`:

```markdown
# Staff Member ID Integration

**Date:** 2026-03-25
**Status:** Complete

## What Changed

- Database: `ticket.updated_by` now stores `userId` instead of display name
- New table: `it_team` maps userId → fromUser (display name)
- Report queries use SQL JOIN for accuracy
- Real-time queries use TeamMemberCache for performance

## Troubleshooting

If staff names show as userIds:
1. Check server logs for "TeamMemberCache loaded" message
2. Verify it_team table has data: `SELECT * FROM it_team WHERE active = 'Y'`
3. Restart server to reload cache

If some staff are missing from reports:
1. Check if they're active in it_team: `SELECT * FROM it_team WHERE fromUser LIKE '%name%'`
2. Check for orphaned tickets (userId not in it_team)
```

- [ ] **Step 3: Final commit**

```bash
git add docs/
git commit -m "docs: add staff member ID integration migration notes"
```

---

## Testing Strategy

### Unit Tests
- `__tests__/lib/teamMemberCache.test.ts` - Cache service tests
- `__tests__/lib/appInitialization.test.ts` - Initialization tests

### Integration Tests (Manual)

**Note:** Test commands use forward slashes which work on both Windows and Unix systems (npm handles this).

To run tests on Windows:
```bash
npm test __tests__/lib/teamMemberCache.test.ts
```

Or use the test script with wildcard:
```bash
npm test -- teamMemberCache
```
- Verify all API endpoints return Thai names instead of userIds
- Test staff filter functionality
- Verify orphaned userId handling

### Performance Verification
- Cache initialization should be < 100ms
- Staff Performance API should complete in < 200ms
- Ticket List API should complete in < 500ms

---

## Rollback Plan

If issues arise:

1. **Quick rollback:** Revert code changes, database remains migrated
2. **Temporary fix:** Map userId → names using existing normalize logic
3. **Database rollback:** Run migration script to restore names (if needed)

---

## Notes

- **Cache loading:** Happens once at server startup
- **Manual refresh:** Restart server or call refresh endpoint
- **Orphaned userIds:** Handled by fallback to userId display
- **Active staff only:** Cache and JOINs only include `active = 'Y'`
