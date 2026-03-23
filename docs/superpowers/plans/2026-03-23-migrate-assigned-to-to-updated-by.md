# Migrate from assigned_to to updated_by - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the entire IT Helpdesk Dashboard system from using `assigned_to` (initial assignee) to `updated_by` (ticket closer) for staff performance tracking and outlier detection.

**Architecture:** This is a comprehensive find-and-replace migration affecting:
- Type definitions (interfaces)
- Repository layer (SQL queries with complex CTEs)
- API routes (8 endpoints)
- Frontend components (8+ components)
- Thai labels throughout the UI
- Mock data and test fixtures

**Tech Stack:** Next.js 14, TypeScript, SQL Server, mssql package, Recharts, Tailwind CSS

**Spec Document:** [docs/superpowers/specs/2026-03-23-migrate-assigned-to-to-updated-by-design.md](../specs/2026-03-23-migrate-assigned-to-to-updated-by-design.md)

**Branch:** `feature/migrate-to-updated-by`

**Estimated Impact:** ~220 occurrences across ~42 files

---

## File Structure Overview

### Files to Modify

| Category | Files |
|----------|-------|
| **Types** | `types/ticket.ts`, `types/outlier.ts` |
| **Repository** | `repository/OutlierRepository.ts` |
| **API Routes** | `app/api/dashboard/tickets/route.ts`, `app/api/dashboard/monthly-tickets/route.ts`, `app/api/dashboard/outliers/route.ts`, `app/api/dashboard/outliers/top3/route.ts`, `app/api/dashboard/staff/route.ts`, `app/api/dashboard/ticket/[message_id]/route.ts`, `app/api/dashboard/report/route.ts`, `app/api/dashboard/report/options/route.ts` |
| **Database** | `app/lib/sql.ts` |
| **Components** | `app/components/dashboard/StaffPerformanceTable.tsx`, `app/components/dashboard/OutlierTable.tsx`, `app/components/dashboard/TicketListModal.tsx`, `app/components/dashboard/TicketDetailModal.tsx`, `app/components/dashboard/TopOutliersList.tsx`, `app/components/dashboard/GlobalSearch.tsx`, `app/components/dashboard/DailyBarChart.tsx`, `app/components/dashboard/MonthlyTicketList.tsx` |
| **Mock Data** | `data/mockData.ts`, `__tests__/fixtures/tickets.ts`, `__tests__/utils/testHelpers.ts`, `__tests__/mocks/handlers.ts` |
| **Tests** | `__tests__/components/dashboard/GlobalSearch.test.tsx`, `__tests__/repository/OutlierRepository.test.ts` |
| **Documentation** | `AGENTS.md`, `CLAUDE.md` |

---

## Chunk 1: Pre-Migration Setup

### Task 1: Create Feature Branch

**Files:** None (git operation)

- [ ] **Step 1: Create and checkout feature branch**

```bash
git checkout -b feature/migrate-to-updated-by
```

Expected: Branch created and checked out

- [ ] **Step 2: Verify branch**

```bash
git branch --show-current
```

Expected: `feature/migrate-to-updated-by`

---

### Task 2: Pre-Migration Database Verification

**Files:** Create `app/lib/migration/pre-migration-check.ts`

This script verifies the database is ready for migration.

- [ ] **Step 1: Create pre-migration check script**

Create file: `app/lib/migration/pre-migration-check.ts`

```typescript
import sql from 'mssql'
import { getConnection } from '../sql'

export interface PreMigrationCheckResult {
  total_tickets: number
  tickets_with_updated_by: number
  tickets_without_updated_by: number
  can_proceed: boolean
}

export async function runPreMigrationCheck(): Promise<PreMigrationCheckResult> {
  const pool = await getConnection()

  const result = await pool.request().query(`
    SELECT
      COUNT(*) as total_tickets,
      COUNT(updated_by) as tickets_with_updated_by,
      COUNT(*) - COUNT(updated_by) as tickets_without_updated_by
    FROM [Dev_Born].[dbo].[ticket]
    WHERE status != 'unsent'
  `)

  const row = result.recordset[0]
  const tickets_without_updated_by = row.tickets_without_updated_by

  return {
    total_tickets: row.total_tickets,
    tickets_with_updated_by: row.tickets_with_updated_by,
    tickets_without_updated_by: tickets_without_updated_by,
    can_proceed: tickets_without_updated_by === 0
  }
}
```

- [ ] **Step 2: Create CLI runner for pre-migration check**

Create file: `app/lib/migration/run-check.ts`

```typescript
import { runPreMigrationCheck } from './pre-migration-check'

async function main() {
  console.log('🔍 Running pre-migration check...')
  const result = await runPreMigrationCheck()

  console.log(`📊 Total tickets: ${result.total_tickets}`)
  console.log(`✅ Tickets with updated_by: ${result.tickets_with_updated_by}`)
  console.log(`⚠️  Tickets without updated_by: ${result.tickets_without_updated_by}`)

  if (result.can_proceed) {
    console.log('✅ Migration can proceed safely!')
    process.exit(0)
  } else {
    console.log('❌ CANNOT PROCEED: Found tickets without updated_by')
    console.log('   Run data migration script first (see Task 3)')
    process.exit(1)
  }
}

main().catch(console.error)
```

- [ ] **Step 3: Run pre-migration check**

```bash
npx tsx app/lib/migration/run-check.ts
```

Expected: Output shows ticket counts and either ✅ can proceed or ❌ cannot proceed

- [ ] **Step 4: Commit pre-migration check**

```bash
git add app/lib/migration/
git commit -m "feat: add pre-migration database verification script"
```

---

### Task 3: Data Migration Script (if needed)

**Files:** Create `app/lib/migration/migrate-null-updated-by.ts`

Only run this if pre-migration check found NULL values.

- [ ] **Step 1: Create data migration script**

Create file: `app/lib/migration/migrate-null-updated-by.ts`

```typescript
import sql from 'mssql'
import { getConnection } from '../sql'

export async function migrateNullUpdatedBy(): Promise<{ updated: number; remaining: number }> {
  const pool = await getConnection()

  console.log('🔄 Migrating NULL updated_by values...')

  // Fill NULL updated_by with assigned_to as fallback
  const result = await pool.request().query(`
    UPDATE [Dev_Born].[dbo].[ticket]
    SET updated_by = assigned_to
    WHERE updated_by IS NULL
      AND assigned_to IS NOT NULL
      AND status != 'unsent'
  `)

  const updated = result.rowsAffected[0]

  // Check remaining NULLs
  const checkResult = await pool.request().query(`
    SELECT COUNT(*) as orphan_tickets
    FROM [Dev_Born].[dbo].[ticket]
    WHERE updated_by IS NULL
      AND status != 'unsent'
  `)

  const remaining = checkResult.recordset[0].orphan_tickets

  console.log(`✅ Updated ${updated} tickets`)
  console.log(`⚠️  ${remaining} tickets still have NULL updated_by (need manual attention)`)

  return { updated, remaining }
}
```

- [ ] **Step 2: Create CLI runner**

Create file: `app/lib/migration/run-migrate.ts`

```typescript
import { migrateNullUpdatedBy } from './migrate-null-updated-by'

async function main() {
  console.log('🔄 Running data migration...')
  const result = await migrateNullUpdatedBy()

  if (result.remaining > 0) {
    console.log('⚠️  Some tickets still need manual attention')
    process.exit(1)
  } else {
    console.log('✅ Migration complete!')
    process.exit(0)
  }
}

main().catch(console.error)
```

- [ ] **Step 3: Commit data migration script**

```bash
git add app/lib/migration/
git commit -m "feat: add data migration script for NULL updated_by values"
```

---

## Chunk 2: Type Definitions

### Task 4: Update Ticket Types

**Files:**
- Modify: `types/ticket.ts`
- Modify: `types/outlier.ts`

- [ ] **Step 1: Read current ticket types**

```bash
cat types/ticket.ts
```

- [ ] **Step 2: Update TicketDetail interface**

Open: `types/ticket.ts`

Find the `TicketDetail` interface and update:

```typescript
export interface TicketDetail {
  // Basic fields (always shown)
  message_id: string
  subject: string
  status: string
  assigned_to?: string  // Changed to optional - kept for historical reference
  updated_by: string    // NEW: Required field for KPI tracking
  category: string
  sub_category: string
  branch_name: string
  created_date: string
  close_time_minute: number | null

  // All 26 fields (shown when expanded)
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
  // Note: updated_by is now in basic fields above
  close_cause?: string
  close_reason?: string
}
```

- [ ] **Step 3: Update outlier types**

Open: `types/outlier.ts`

Find and update the `OutlierTicket` interface:

```typescript
export interface OutlierTicket {
  message_id: string
  updated_by: string  // Changed from assigned_to
  subject: string
  diff_minutes: number
  created_date: string
  assigned_date: string
  deviation_score: number
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Type errors showing where `assigned_to` is still required (we'll fix these in subsequent tasks)

- [ ] **Step 5: Commit type changes**

```bash
git add types/
git commit -m "feat: migrate types from assigned_to to updated_by"
```

---

## Chunk 3: Repository Layer

### Task 5: Update OutlierRepository - getOutliers()

**Files:**
- Modify: `repository/OutlierRepository.ts:45-180`

- [ ] **Step 1: Open OutlierRepository**

```bash
code repository/OutlierRepository.ts
```

- [ ] **Step 2: Update getOutliers() method**

In the `getOutliers()` method, replace all `assigned_to` with `updated_by`:

Find this section (lines ~60-77):
```sql
-- Full year data for baseline calculation
WITH full_year_base AS (
  SELECT
    assigned_to,
    message_id,
    subject,
    created_date,
    assigned_date,
    close_time_minute AS diff_minutes
  FROM [Dev_Born].[dbo].[ticket]
  WHERE
    close_time_minute IS NOT NULL
    AND status != 'unsent'
    AND close_time_minute > 0
    AND created_date >= @yearStartDate
    AND created_date <= @yearEndDate
),
```

Replace with:
```sql
-- Full year data for baseline calculation
WITH full_year_base AS (
  SELECT
    updated_by,
    message_id,
    subject,
    created_date,
    assigned_date,
    close_time_minute AS diff_minutes
  FROM [Dev_Born].[dbo].[ticket]
  WHERE
    close_time_minute IS NOT NULL
    AND status != 'unsent'
    AND close_time_minute > 0
    AND created_date >= @yearStartDate
    AND created_date <= @yearEndDate
),
```

Find per_person_median CTE (lines ~79-85):
```sql
per_person_median AS (
  SELECT DISTINCT
    assigned_to,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY diff_minutes) OVER (PARTITION BY assigned_to) AS personal_median,
    COUNT(*) OVER (PARTITION BY assigned_to) AS ticket_count
  FROM full_year_base
),
```

Replace with:
```sql
per_person_median AS (
  SELECT DISTINCT
    updated_by,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY diff_minutes) OVER (PARTITION BY updated_by) AS personal_median,
    COUNT(*) OVER (PARTITION BY updated_by) AS ticket_count
  FROM full_year_base
),
```

Continue replacing all remaining `assigned_to` with `updated_by` in:
- `absolute_deviations` CTE
- `per_person_mad` CTE
- `per_person_stats` CTE
- `filtered_base` CTE
- `classified` CTE
- JOIN conditions

- [ ] **Step 3: Update result mapping**

Find the mapping section (lines ~159-169):

```typescript
const outliers: OutlierTicket[] = rows.map(row => ({
  message_id: row.message_id,
  assigned_to: normalizeStylizedText(row.assigned_to),
  subject: row.subject || '(No subject)',
  // ...
}))
```

Replace with:
```typescript
const outliers: OutlierTicket[] = rows.map(row => ({
  message_id: row.message_id,
  updated_by: normalizeStylizedText(row.updated_by),
  subject: row.subject || '(No subject)',
  diff_minutes: row.diff_minutes,
  created_date: row.created_date.toISOString(),
  assigned_date: row.assigned_date.toISOString(),
  deviation_score: row.personal_median > 0
    ? Math.round((row.diff_minutes / row.personal_median) * 100) / 100
    : 0
}))
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(repository): migrate getOutliers() to use updated_by"
```

---

### Task 6: Update OutlierRepository - getTopOutliers()

**Files:**
- Modify: `repository/OutlierRepository.ts:186-304`

- [ ] **Step 1: Update getTopOutliers() method**

Same pattern as Task 5 - replace all `assigned_to` with `updated_by` in:
- `full_year_base` CTE
- `per_person_median` CTE
- `absolute_deviations` CTE
- `per_person_mad` CTE
- `per_person_stats` CTE
- `filtered_base` CTE
- `classified` CTE
- Result mapping (lines ~293-303)

- [ ] **Step 2: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(repository): migrate getTopOutliers() to use updated_by"
```

---

### Task 7: Update OutlierRepository - getStaffPerformanceWithOutliers()

**Files:**
- Modify: `repository/OutlierRepository.ts:310-546`

- [ ] **Step 1: Update getStaffPerformanceWithOutliers() method**

Same pattern - replace all `assigned_to` with `updated_by` in:
- All CTEs
- GROUP BY clause
- Result mapping (line ~523): `name: normalizeStylizedText(row.assigned_to)` → `normalizeStylizedText(row.updated_by)`

- [ ] **Step 2: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(repository): migrate getStaffPerformanceWithOutliers() to use updated_by"
```

---

### Task 8: Update OutlierRepository - calculateOutlierForTicket()

**Files:**
- Modify: `repository/OutlierRepository.ts:556-634`

- [ ] **Step 1: Update calculateOutlierForTicket() method**

Replace `assigned_to` with `updated_by` in:
- Function parameter type (line 557)
- WHERE clause (line 587)
- All CTE references

- [ ] **Step 2: Commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(repository): migrate calculateOutlierForTicket() to use updated_by"
```

---

### Task 9: Update OutlierRepository - recalculateAllOutliers()

**Files:**
- Modify: `repository/OutlierRepository.ts:644-742`

- [ ] **Step 1: Update recalculateAllOutliers() method**

In the tickets query (lines ~659-670), change:
```sql
SELECT
  message_id,
  assigned_to,
  close_time_minute,
  created_date,
  YEAR(created_date) as ticket_year
FROM [Dev_Born].[dbo].[ticket]
```

To:
```sql
SELECT
  message_id,
  updated_by,
  close_time_minute,
  created_date,
  YEAR(created_date) as ticket_year
FROM [Dev_Born].[dbo].[ticket]
```

Update the function call (lines ~689-697):
```typescript
const isOutlier = await this.calculateOutlierForTicket(
  {
    message_id: ticket.message_id,
    assigned_to: ticket.assigned_to,  // Change this
    close_time_minute: ticket.close_time_minute,
    created_date: ticket.created_date
  },
  ticket.ticket_year
)
```

To:
```typescript
const isOutlier = await this.calculateOutlierForTicket(
  {
    message_id: ticket.message_id,
    updated_by: ticket.updated_by,
    close_time_minute: ticket.close_time_minute,
    created_date: ticket.created_date
  },
  ticket.ticket_year
)
```

- [ ] **Step 2: Final Repository commit**

```bash
git add repository/OutlierRepository.ts
git commit -m "feat(repository): migrate recalculateAllOutliers() to use updated_by"
```

---

## Chunk 4: API Routes

### Task 10: Update /api/dashboard/tickets

**Files:**
- Modify: `app/api/dashboard/tickets/route.ts:1-162`

- [ ] **Step 1: Update SELECT clause**

Find the query (line ~64):
```typescript
let query = `
  SELECT
    message_id,
    subject,
    assigned_to,
    // ...
```

Replace `assigned_to` with `updated_by`

- [ ] **Step 2: Update WHERE clause for staff filter**

Find (line ~118):
```typescript
if (staff) {
  query += ` AND assigned_to = @staff`
  // ...
```

Replace with:
```typescript
if (staff) {
  query += ` AND updated_by = @staff`
  requestQuery.input('staff', sql.NVarChar, staff)
}
```

- [ ] **Step 3: Update search filter**

Find (line ~124):
```typescript
if (search) {
  query += ` AND (
    subject LIKE @search OR
    assigned_to LIKE @search OR
    // ...
```

Replace `assigned_to LIKE @search` with `updated_by LIKE @search`

- [ ] **Step 4: Update result mapping**

Find (line ~140):
```typescript
const tickets = result.recordset.map((row: any) => ({
  message_id: row.message_id,
  subject: row.subject || '(No subject)',
  assigned_to: row.assigned_to || 'Unassigned',
  // ...
```

Replace with:
```typescript
const tickets = result.recordset.map((row: any) => ({
  message_id: row.message_id,
  subject: row.subject || '(No subject)',
  updated_by: row.updated_by || 'Unknown',
  status: row.status || 'unknown',
  category: row.category || '-',
  sub_category: row.sub_category || '-',
  branch_name: row.branch_name || '-',
  created_date: row.created_date ? row.created_date.toISOString() : null,
  assigned_date: row.assigned_date ? row.assigned_date.toISOString() : null,
  close_time_minute: row.close_time_minute || null,
  is_outlier: row.is_outlier ? 1 : 0
}))
```

- [ ] **Step 5: Commit**

```bash
git add app/api/dashboard/tickets/route.ts
git commit -m "feat(api): migrate /tickets route to use updated_by"
```

---

### Task 11: Update /api/dashboard/monthly-tickets

**Files:**
- Modify: `app/api/dashboard/monthly-tickets/route.ts`

- [ ] **Step 1: Read the file**

```bash
cat app/api/dashboard/monthly-tickets/route.ts
```

- [ ] **Step 2: Add updated_by to SELECT and response mapping**

Find the SELECT clause and add `updated_by`. Update response mapping.

- [ ] **Step 3: Commit**

```bash
git add app/api/dashboard/monthly-tickets/route.ts
git commit -m "feat(api): add updated_by to monthly-tickets route"
```

---

### Task 12: Update /api/dashboard/outliers

**Files:**
- Modify: `app/api/dashboard/outliers/route.ts`

- [ ] **Step 1: Update to use repository with updated_by**

The outliers route uses `OutlierRepository` which we've already updated. Just verify it returns the correct data.

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/outliers/route.ts
git commit -m "feat(api): verify outliers route uses updated_by"
```

---

### Task 13: Update /api/dashboard/outliers/top3

**Files:**
- Modify: `app/api/dashboard/outliers/top3/route.ts`

- [ ] **Step 1: Verify route uses updated repository**

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/outliers/top3/route.ts
git commit -m "feat(api): verify top3 outliers route uses updated_by"
```

---

### Task 14: Update /api/dashboard/staff

**Files:**
- Modify: `app/api/dashboard/staff/route.ts`

- [ ] **Step 1: Verify route uses updated repository**

The staff route uses `getStaffPerformanceWithOutliers()` which we've updated.

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/staff/route.ts
git commit -m "feat(api): verify staff route uses updated_by"
```

---

### Task 15: Update /api/dashboard/ticket/[message_id]

**Files:**
- Modify: `app/api/dashboard/ticket/[message_id]/route.ts`

- [ ] **Step 1: Add updated_by to SELECT**

Find the SELECT query and ensure it includes `updated_by`.

- [ ] **Step 2: Update response mapping**

Ensure `updated_by` is returned in the response.

- [ ] **Step 3: Commit**

```bash
git add app/api/dashboard/ticket/[message_id]/route.ts
git commit -m "feat(api): add updated_by to ticket detail route"
```

---

### Task 16: Update /api/dashboard/report

**Files:**
- Modify: `app/api/dashboard/report/route.ts`

- [ ] **Step 1: Check for assigned_to in GROUP BY**

Search for any GROUP BY clauses using `assigned_to` and change to `updated_by`.

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/report/route.ts
git commit -m "feat(api): migrate report route to use updated_by"
```

---

### Task 17: Update /api/dashboard/report/options

**Files:**
- Modify: `app/api/dashboard/report/options/route.ts`

- [ ] **Step 1: Check if route needs updated_by**

This route returns dropdown options. Verify it returns `updated_by` values if filtering by staff.

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/report/options/route.ts
git commit -m "feat(api): verify report options route"
```

---

### Task 17b: Update Legacy /api/tickets Route

**Files:**
- Modify: `app/api/tickets/route.ts`

- [ ] **Step 1: Read the legacy route**

```bash
cat app/api/tickets/route.ts
```

- [ ] **Step 2: Update local Ticket interface**

Find the interface at line ~17 and change:
```typescript
assigned_to?: string
```
To:
```typescript
updated_by?: string
```

- [ ] **Step 3: Update SELECT query**

Find the SELECT clause and add `updated_by` if not present.

- [ ] **Step 4: Update result mapping**

- [ ] **Step 5: Commit**

```bash
git add app/api/tickets/route.ts
git commit -m "feat(api): migrate legacy tickets route to use updated_by"
```

**Files:**
- Modify: `app/api/dashboard/report/options/route.ts`

- [ ] **Step 1: Check if route needs updated_by**

This route returns dropdown options. Verify it returns `updated_by` values if filtering by staff.

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/report/options/route.ts
git commit -m "feat(api): verify report options route"
```

---

## Chunk 5: Database Layer

### Task 18: Update Database Index

**Files:**
- Modify: `app/lib/sql.ts`

- [ ] **Step 1: Read current schema initialization**

```bash
cat app/lib/sql.ts
```

- [ ] **Step 2: Find index creation code**

Search for `IX_ticket_is_outlier`

- [ ] **Step 3: Update index migration**

Find the index creation section and update:

```typescript
// OLD (to be removed)
CREATE INDEX IX_ticket_is_outlier
ON [Dev_Born].[dbo].[ticket](is_outlier)
INCLUDE (message_id, assigned_to, close_time_minute, created_date)

// NEW
CREATE INDEX IX_ticket_is_outlier_updated_by
ON [Dev_Born].[dbo].[ticket](is_outlier)
INCLUDE (message_id, updated_by, close_time_minute, created_date)
```

Add migration logic to drop old index first:

```typescript
// Migration: Drop old index if exists
await pool.request().query(`
  IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ticket_is_outlier' AND object_id = OBJECT_ID('[Dev_Born].[dbo].[ticket]'))
  BEGIN
    DROP INDEX IX_ticket_is_outlier ON [Dev_Born].[dbo].[ticket]
  END
`)

// Create new index
await pool.request().query(`
  IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ticket_is_outlier_updated_by' AND object_id = OBJECT_ID('[Dev_Born].[dbo].[ticket]'))
    CREATE INDEX IX_ticket_is_outlier_updated_by
    ON [Dev_Born].[dbo].[ticket](is_outlier)
    INCLUDE (message_id, updated_by, close_time_minute, created_date)
`)
```

- [ ] **Step 4: Commit**

```bash
git add app/lib/sql.ts
git commit -m "feat(db): migrate index from assigned_to to updated_by"
```

---

## Chunk 6: Frontend Components

### Task 19: Update SearchResultsModal

**Files:**
- Modify: `app/components/dashboard/SearchResultsModal.tsx`

- [ ] **Step 1: Update local Ticket interface**

Find the interface at line 6 and change line 9:
```typescript
assigned_to: string
```
To:
```typescript
updated_by: string
```

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/SearchResultsModal.tsx
git commit -m "feat(ui): migrate SearchResultsModal to use updated_by"
```

---

### Task 20: Update Outliers Page

**Files:**
- Modify: `app/dashboard/outliers/page.tsx`

- [ ] **Step 1: Update filter logic**

Find line 32:
```typescript
const filteredOutliers = staffFilter
  ? allOutliers.filter(o => o.assigned_to === staffFilter)
  : allOutliers
```

Change to:
```typescript
const filteredOutliers = staffFilter
  ? allOutliers.filter(o => o.updated_by === staffFilter)
  : allOutliers
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/outliers/page.tsx
git commit -m "feat(ui): migrate outliers page to use updated_by"
```

---

### Task 21: Update StaffPerformanceTable

**Files:**
- Modify: `app/components/dashboard/StaffPerformanceTable.tsx`

- [ ] **Step 1: Find all assigned_to references**

```bash
grep -n "assigned_to" app/components/dashboard/StaffPerformanceTable.tsx
```

- [ ] **Step 2: Replace with updated_by**

Change data access from `assigned_to` to `updated_by`

- [ ] **Step 3: Update Thai labels**

Find "รับงานโดย" and change to "ปิดงานโดย"

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat(ui): migrate StaffPerformanceTable to use updated_by"
```

---

### Task 20: Update OutlierTable

**Files:**
- Modify: `app/components/dashboard/OutlierTable.tsx`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Update labels**

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/OutlierTable.tsx
git commit -m "feat(ui): migrate OutlierTable to use updated_by"
```

---

### Task 21: Update TicketListModal

**Files:**
- Modify: `app/components/dashboard/TicketListModal.tsx`

- [ ] **Step 1: Replace assigned_to with updated_by**

Note: The `staffName` prop stays the same but filters by `updated_by` instead.

- [ ] **Step 2: Update labels**

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/TicketListModal.tsx
git commit -m "feat(ui): migrate TicketListModal to use updated_by"
```

---

### Task 22: Update TicketDetailModal

**Files:**
- Modify: `app/components/dashboard/TicketDetailModal.tsx`

- [ ] **Step 1: Display updated_by instead of assigned_to**

Find where `assigned_to` is displayed and change to show `updated_by`

- [ ] **Step 2: Update Thai label "ผู้รับงาน" → "ผู้ปิดงาน"**

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/TicketDetailModal.tsx
git commit -m "feat(ui): migrate TicketDetailModal to show updated_by"
```

---

### Task 23: Update TopOutliersList

**Files:**
- Modify: `app/components/dashboard/TopOutliersList.tsx`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/TopOutliersList.tsx
git commit -m "feat(ui): migrate TopOutliersList to use updated_by"
```

---

### Task 24: Update GlobalSearch

**Files:**
- Modify: `app/components/dashboard/GlobalSearch.tsx`

- [ ] **Step 1: Update search to include updated_by**

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/GlobalSearch.tsx
git commit -m "feat(ui): migrate GlobalSearch to use updated_by"
```

---

### Task 25: Update DailyBarChart

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat(ui): migrate DailyBarChart to use updated_by"
```

---

### Task 26: Update MonthlyTicketList

**Files:**
- Modify: `app/components/dashboard/MonthlyTicketList.tsx`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/MonthlyTicketList.tsx
git commit -m "feat(ui): migrate MonthlyTicketList to use updated_by"
```

---

## Chunk 7: Mock Data & Tests

### Task 27: Update Mock Data

**Files:**
- Modify: `data/mockData.ts`

- [ ] **Step 1: Replace assigned_to with updated_by in all mock functions**

- [ ] **Step 2: Adjust values so updated_by represents actual closer**

- [ ] **Step 3: Commit**

```bash
git add data/mockData.ts
git commit -m "feat(tests): migrate mock data to use updated_by"
```

---

### Task 28: Update Test Fixtures

**Files:**
- Modify: `__tests__/fixtures/tickets.ts`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Commit**

```bash
git add __tests__/fixtures/tickets.ts
git commit -m "feat(tests): migrate test fixtures to use updated_by"
```

---

### Task 29: Update Test Utilities

**Files:**
- Modify: `__tests__/utils/test-utils.tsx`

- [ ] **Step 1: Update mockOutlierData**

Find `mockOutlierData` array (lines 96-124) and replace `assigned_to` with `updated_by` in all objects (lines 99, 108, 117).

- [ ] **Step 2: Commit**

```bash
git add __tests__/utils/test-utils.tsx
git commit -m "feat(tests): migrate test-utils mockOutlierData to use updated_by"
```

---

### Task 30: Update Test Helpers

**Files:**
- Modify: `__tests__/utils/testHelpers.ts`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Commit**

```bash
git add __tests__/utils/testHelpers.ts
git commit -m "feat(tests): migrate test helpers to use updated_by"
```

---

### Task 30: Update Mock Handlers

**Files:**
- Modify: `__tests__/mocks/handlers.ts`

- [ ] **Step 1: Replace assigned_to with updated_by in MSW handlers**

- [ ] **Step 2: Commit**

```bash
git add __tests__/mocks/handlers.ts
git commit -m "feat(tests): migrate MSW handlers to use updated_by"
```

---

### Task 31: Update Component Tests

**Files:**
- Modify: `__tests__/components/dashboard/GlobalSearch.test.tsx`
- Modify: `__tests__/repository/OutlierRepository.test.ts`

- [ ] **Step 1: Update test assertions**

Replace any assertions checking `assigned_to` with `updated_by`

- [ ] **Step 2: Run tests**

```bash
npm test
```

- [ ] **Step 3: Commit**

```bash
git add __tests__/
git commit -m "feat(tests): update test assertions for updated_by"
```

---

## Chunk 8: Documentation

### Task 32: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Find assigned_to in README**

```bash
grep -n "assigned_to" README.md
```

- [ ] **Step 2: Update database schema documentation**

Find the database schema section (around line 175) and change `assigned_to` to `updated_by`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: migrate README.md from assigned_to to updated_by"
```

---

### Task 33: Update Technical Documentation

**Files:**
- Modify: `docs/mobile-responsive.md`
- Modify: `docs/outlier-storage.md`

- [ ] **Step 1: Update mobile-responsive.md**

```bash
grep -n "assigned_to" docs/mobile-responsive.md
```

Replace all occurrences with `updated_by`.

- [ ] **Step 2: Update outlier-storage.md**

```bash
grep -n "assigned_to" docs/outlier-storage.md
```

Replace all occurrences with `updated_by`.

- [ ] **Step 3: Commit**

```bash
git add docs/mobile-responsive.md docs/outlier-storage.md
git commit -m "docs: migrate technical docs from assigned_to to updated_by"
```

---

### Task 34: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Replace all assigned_to references with updated_by**

Use find and replace for consistency.

- [ ] **Step 2: Update feature descriptions**

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: migrate AGENTS.md from assigned_to to updated_by"
```

---

### Task 35: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace assigned_to with updated_by**

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: migrate CLAUDE.md from assigned_to to updated_by"
```

---

**Note on Chunk Order:** For optimal workflow, consider executing Chunk 7 (Mock Data & Tests) BEFORE Chunk 6 (Frontend Components). This ensures test mocks are updated before component changes, preventing test failures during development.

---

## Chunk 9: Finalization

### Task 36: Run Full Test Suite

**Files:** None

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 3: Run test coverage**

```bash
npm run test:coverage
```

- [ ] **Step 4: Fix any issues**

If any tests fail, fix and commit.

---

### Task 37: Build and Smoke Test

**Files:** None

- [ ] **Step 1: Build the application**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual smoke test**

1. Open dashboard at http://localhost:3000
2. Verify Staff Performance table shows "ปิดงานโดย" with correct data
3. Click on a staff member - verify tickets list shows correct closer
4. Verify Outlier Detection works
5. Verify Search works
6. Verify Ticket Detail shows "ผู้ปิดงาน"

- [ ] **Step 4: Stop dev server**

Ctrl+C

---

### Task 38: Trigger Outlier Recalculation

**Files:** None

- [ ] **Step 1: Trigger manual recalculation**

```bash
curl -X POST http://localhost:3000/api/admin/recalc-outliers
```

Or use the admin endpoint if authenticated.

- [ ] **Step 2: Wait for completion**

Outlier recalculation may take 30-60 seconds.

- [ ] **Step 3: Verify results**

Check the dashboard - outlier counts should reflect `updated_by` grouping.

---

### Task 39: Post-Migration Validation

**Files:** Create `app/lib/migration/post-migration-check.ts`

- [ ] **Step 1: Create post-migration validation script**

Create file: `app/lib/migration/post-migration-check.ts`

```typescript
import { getConnection } from '../sql'

export interface PostMigrationCheckResult {
  orphan_tickets: number
  index_exists: boolean
  outliers_count: number
  unique_closers: number
  avg_close_time: number
}

export async function runPostMigrationCheck(): Promise<PostMigrationCheckResult> {
  const pool = await getConnection()

  // Check for orphan tickets
  const orphanResult = await pool.request().query(`
    SELECT COUNT(*) as count
    FROM [Dev_Born].[dbo].[ticket]
    WHERE updated_by IS NULL AND status != 'unsent'
  `)

  // Check index exists
  const indexResult = await pool.request().query(`
    SELECT COUNT(*) as count FROM sys.indexes
    WHERE name = 'IX_ticket_is_outlier_updated_by'
  `)

  // Get outlier count
  const outlierResult = await pool.request().query(`
    SELECT COUNT(*) as count
    FROM [Dev_Born].[dbo].[ticket]
    WHERE is_outlier = 1
  `)

  // Get metrics
  const metricsResult = await pool.request().query(`
    SELECT
      COUNT(*) as total_tickets,
      COUNT(DISTINCT updated_by) as unique_closers,
      AVG(close_time_minute) as avg_close_time
    FROM [Dev_Born].[dbo].[ticket]
    WHERE status = 'closed' AND close_time_minute IS NOT NULL
  `)

  return {
    orphan_tickets: orphanResult.recordset[0].count,
    index_exists: indexResult.recordset[0].count > 0,
    outliers_count: outlierResult.recordset[0].count,
    unique_closers: metricsResult.recordset[0].unique_closers,
    avg_close_time: metricsResult.recordset[0].avg_close_time
  }
}
```

- [ ] **Step 2: Create runner**

Create file: `app/lib/migration/run-post-check.ts`

```typescript
import { runPostMigrationCheck } from './post-migration-check'

async function main() {
  console.log('🔍 Running post-migration validation...')
  const result = await runPostMigrationCheck()

  console.log(`📊 Orphan tickets: ${result.orphan_tickets} (should be 0)`)
  console.log(`📇 Index exists: ${result.index_exists ? '✅' : '❌'}`)
  console.log(`🎯 Outliers count: ${result.outliers_count}`)
  console.log(`👥 Unique closers: ${result.unique_closers}`)
  console.log(`⏱️  Avg close time: ${Math.round(result.avg_close_time)} minutes`)

  const allPassed = result.orphan_tickets === 0 && result.index_exists

  if (allPassed) {
    console.log('✅ All validation checks passed!')
    process.exit(0)
  } else {
    console.log('❌ Some validation checks failed!')
    process.exit(1)
  }
}

main().catch(console.error)
```

- [ ] **Step 3: Run post-migration check**

```bash
npx tsx app/lib/migration/run-post-check.ts
```

- [ ] **Step 4: Commit migration scripts**

```bash
git add app/lib/migration/
git commit -m "feat: add post-migration validation script"
```

---

### Task 40: Final Commit and Push

**Files:** None

- [ ] **Step 1: Review all changes**

```bash
git log --oneline
```

- [ ] **Step 2: Push to remote**

```bash
git push origin feature/migrate-to-updated-by
```

- [ ] **Step 3: Create Pull Request**

Include:
- Description of the migration
- Link to design spec
- Testing checklist
- Rollback plan

---

## Success Criteria

After completing all tasks:

- [ ] All `assigned_to` references changed to `updated_by` in backend code
- [ ] Database index updated to include `updated_by`
- [ ] Outliers recalculated using `updated_by` as grouping key
- [ ] All Thai labels changed from "รับงานโดย" to "ปิดงานโดย"
- [ ] All tests pass (unit + integration)
- [ ] Manual testing confirms correct behavior
- [ ] Post-migration validation queries pass (0 orphan tickets, index exists)
- [ ] Documentation updated (AGENTS.md, CLAUDE.md)

---

## Rollback Plan

If critical issues are found after merge:

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Or rollback to previous commit
git reset --hard <previous-commit-hash>
git push origin master --force
```

Then restore old index:
```sql
DROP INDEX IX_ticket_is_outlier_updated_by ON [Dev_Born].[dbo].[ticket]
CREATE INDEX IX_ticket_is_outlier
ON [Dev_Born].[dbo].[ticket](is_outlier)
INCLUDE (message_id, assigned_to, close_time_minute, created_date)
```

And trigger outlier recalculation with old logic.

---

## User Communication Template

After successful deployment:

> "เราได้ปรับปรุงระบบให้คำนวณ KPI จาก 'ผู้ปิดงาน' (updated_by) แทน 'ผู้รับงานแรก' (assigned_to) เพื่อให้สะท้อนถึงผลงานที่แท้จริง หลังจากการอัปเดต ตัวเลข KPI อาจมีการเปลี่ยนแปลงเล็กน้อย"
