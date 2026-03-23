# Design: Migrate from assigned_to to updated_by

**Date:** 2026-03-23
**Status:** Draft
**Author:** Claude Code
**Branch:** `feature/migrate-to-updated-by`

---

## Overview

### Objective

Migrate the entire system to use `updated_by` (ticket closer) instead of `assigned_to` (initial assignee) for staff performance tracking and outlier detection.

### Rationale

- `assigned_to` represents the FIRST person who received the ticket
- `updated_by` represents the LAST person who worked on and closed the ticket
- Using `updated_by` for KPI calculations is more accurate since it reflects who actually did the work

### Scope

- **Backend:** Repository, API Routes, Types
- **Database:** Index migration, Outlier recalculation
- **Frontend:** Components, Thai labels (รับงานโดย → ปิดงานโดย)
- **Tests:** Mock data, fixtures, test helpers

### Assumptions

- `updated_by` column exists in the database and is NEVER NULL
- All tickets have a valid `updated_by` value

---

## Backend Changes

### 1. Repository Layer

**File:** [`repository/OutlierRepository.ts`](../../repository/OutlierRepository.ts)

Replace `assigned_to` with `updated_by` in all SQL queries:

- `full_year_base` CTE: Change `assigned_to` → `updated_by`
- `per_person_median` CTE: Change `PARTITION BY assigned_to` → `PARTITION BY updated_by`
- `filtered_base` CTE: Change `assigned_to` → `updated_by`
- All JOINs: Change `ON b.assigned_to = s.assigned_to` → `ON b.updated_by = s.updated_by`
- All WHERE clauses: Change `assigned_to = @assigned_to` → `updated_by = @updated_by`

**Functions to update:**
- `getOutliers()`
- `getTopOutliers()`
- `getStaffPerformanceWithOutliers()`
- `calculateOutlierForTicket()`
- `recalculateAllOutliers()`

### 2. API Routes

| Route | Changes |
|-------|---------|
| `/api/dashboard/tickets` | SELECT `updated_by` instead of `assigned_to`, update WHERE clause |
| `/api/dashboard/monthly-tickets` | Add `updated_by` to response mapping |
| `/api/dashboard/outliers` | Query uses `updated_by` |
| `/api/dashboard/ticket/[message_id]` | Return `updated_by` in detail |
| `/api/dashboard/report` | Group by `updated_by` |

### 3. Types

**Files:**
- [`types/outlier.ts`](../../types/outlier.ts)
- [`types/ticket.ts`](../../types/ticket.ts)

**Changes:**
- Change `assigned_to: string` → `updated_by: string` in interfaces
- Keep `assigned_to` as optional in `TicketDetail` (for reference)

---

## Database Changes

### 1. Index Migration

**File:** [`app/lib/sql.ts`](../../app/lib/sql.ts)

```sql
-- Drop old index that includes assigned_to
DROP INDEX IX_ticket_is_outlier ON [Dev_Born].[dbo].[ticket]

-- Create new index that includes updated_by
CREATE INDEX IX_ticket_is_outlier_updated_by
ON [Dev_Born].[dbo].[ticket](is_outlier)
INCLUDE (message_id, updated_by, close_time_minute, created_date)
```

### 2. Outlier Recalculation

When migrating to `updated_by`:
- Trigger `recalculateAllOutliers()` for all tickets
- Use `updated_by` for grouping and Per-Person Threshold calculation
- Update `is_outlier` column for every record
- **Impact:** All historical outlier classifications will change based on new Per-Person Thresholds

### 3. Initializer

**File:** [`app/lib/outlierInitialization.ts`](../../app/lib/outlierInitialization.ts)

- Startup service will automatically run `recalculateAllOutliers()` when server starts

### 4. Admin Endpoint

**File:** [`app/api/admin/recalc-outliers/route.ts`](../../app/api/admin/recalc-outliers/route.ts)

- Manual trigger endpoint already exists
- Use to force recalculation after migration

---

## Frontend Changes

### 1. Component Field Changes

| Component | Changes |
|-----------|---------|
| [`StaffPerformanceTable.tsx`](../../app/components/dashboard/StaffPerformanceTable.tsx) | `assigned_to` → `updated_by` |
| [`OutlierTable.tsx`](../../app/components/dashboard/OutlierTable.tsx) | `assigned_to` → `updated_by` |
| [`TicketListModal.tsx`](../../app/components/dashboard/TicketListModal.tsx) | `assigned_to` → `updated_by` |
| [`TicketDetailModal.tsx`](../../app/components/dashboard/TicketDetailModal.tsx) | Display `updated_by` |
| [`TopOutliersList.tsx`](../../app/components/dashboard/TopOutliersList.tsx) | `assigned_to` → `updated_by` |
| [`GlobalSearch.tsx`](../../app/components/dashboard/GlobalSearch.tsx) | Search in `updated_by` |
| [`DailyBarChart.tsx`](../../app/components/dashboard/DailyBarChart.tsx) | Use `updated_by` |
| [`MonthlyTicketList.tsx`](../../app/components/dashboard/MonthlyTicketList.tsx) | `assigned_to` → `updated_by` |

### 2. Thai Label Changes

Change throughout the entire system:
- **"รับงานโดย" → "ปิดงานโดย"** (Assigned to → Closed by)
- "ผลงานทีม" - No change
- "Outlier ของ" - No change (but now refers to closer)

### 3. API Calls

Change `staffName` query parameter to filter by `updated_by`

---

## Mock Data & Tests

### 1. Mock Data

**File:** [`data/mockData.ts`](../../data/mockData.ts)

- Change field `assigned_to` → `updated_by`
- Adjust values so `updated_by` represents the actual closer
- Keep `assigned_to` as optional (for history reference)

### 2. Test Fixtures

**File:** [`__tests__/fixtures/tickets.ts`](../../__tests__/fixtures/tickets.ts)

- Update ticket fixtures to use `updated_by`
- Adjust values for testing scenarios

### 3. Test Helpers

**File:** [`__tests__/utils/testHelpers.ts`](../../__tests__/utils/testHelpers.ts)

- Update helper functions to support `updated_by`
- Change assertions that check `assigned_to`

### 4. Component Tests

Update test expectations:
- [`__tests__/components/dashboard/GlobalSearch.test.tsx`](../../__tests__/components/dashboard/GlobalSearch.test.tsx)
- [`__tests__/repository/OutlierRepository.test.ts`](../../__tests__/repository/OutlierRepository.test.ts)

### 5. Mock Handlers

**File:** [`__tests__/mocks/handlers.ts`](../../__tests__/mocks/handlers.ts)

- Update MSW handlers for API mocking
- Change responses to return `updated_by`

---

## Migration Plan

### Git Workflow

```bash
# 1. Create new branch
git checkout -b feature/migrate-to-updated-by

# 2. Make all changes
# ... edit files ...

# 3. Commit changes
git commit -m "feat: migrate from assigned_to to updated_by across entire system"

# 4. Push and create PR
git push origin feature/migrate-to-updated-by
```

### Implementation Order

1. **Types & Interfaces** - Change type definitions first
2. **Database Layer** - Repository, SQL queries, Index migration
3. **API Routes** - Update all routes
4. **Mock Data & Tests** - Update test fixtures
5. **Frontend Components** - Change all components
6. **Thai Labels** - Change Thai text labels
7. **Run Outlier Recalculation** - On actual database
8. **Full Testing** - Test entire system

### Testing Checklist

- [ ] Dashboard displays Staff Performance correctly
- [ ] Outlier Detection calculates with `updated_by` correctly
- [ ] Search finds staff by `updated_by`
- [ ] Ticket Detail displays `updated_by` correctly
- [ ] Monthly Report summarizes by `updated_by` correctly
- [ ] Mock Data works (fallback scenario)
- [ ] All unit tests pass

### Rollback Plan

If critical issues are found after deploy:

```bash
# Revert merge
git revert -m 1 <merge-commit>

# Or rollback to previous commit
git reset --hard <previous-commit>
```

---

## Estimated Impact

### Files Affected

~220 occurrences across ~39 files

### Key Areas

| Area | Files | Complexity |
|------|-------|------------|
| Repository SQL | 1 | High (complex CTEs) |
| API Routes | 5 | Medium |
| Components | 8+ | Low-Medium |
| Mock/Tests | 5 | Low |
| Types | 2 | Low |

### Risk Assessment

- **Risk Level:** Medium
- **Reasoning:** Large change but straightforward (find & replace)
- **Mitigation:** Use feature branch, full testing before merge

---

## Success Criteria

1. All `assigned_to` references changed to `updated_by` in backend code
2. Database index updated to include `updated_by`
3. Outliers recalculated using `updated_by` as grouping key
4. All Thai labels changed from "รับงานโดย" to "ปิดงานโดย"
5. All tests pass (unit + integration)
6. Manual testing confirms correct behavior
