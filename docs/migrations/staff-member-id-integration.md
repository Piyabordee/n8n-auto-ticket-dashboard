# Staff Member ID Integration

**Date:** 2026-03-25
**Status:** Complete

## What Changed

- Database: `ticket.updated_by` now stores `userId` instead of display name
- New table: `it_team` maps userId → fromUser (display name)
- Report queries use SQL JOIN for accuracy
- Real-time queries use TeamMemberCache for performance

## Database Schema

### it_team Table

| Column | Type | Description |
|--------|------|-------------|
| userId | string | Unique staff ID (e.g., "TOCKTACK", "SUPORNT") |
| fromUser | string | Display name (e.g., "Tocktack Pornperg", "Supornnt T.") |
| active | string | "Y" for active staff, "N" for inactive |

### ticket Table Change

**Before:** `updated_by` stored display names
```sql
-- Old data
updated_by = 'Tocktack Pornperg'
```

**After:** `updated_by` stores userId
```sql
-- New data
updated_by = 'TOCKTACK'
```

## Query Patterns

### Report Queries (Accuracy Priority)
Use SQL JOIN to get display names:

```sql
SELECT t.*, i.fromUser as display_name
FROM ticket t
INNER JOIN it_team i ON t.updated_by = i.userId
WHERE i.active = 'Y'
```

### Real-time Queries (Performance Priority)
Use TeamMemberCache:

```typescript
import { getTeamMemberCache } from '@/lib/teamMemberCache'

const cache = getTeamMemberCache()
const displayName = cache.getDisplayName(userId)
```

## Components Using New System

### 1. Report APIs (SQL JOIN)
- `/api/dashboard/report` - Monthly report with sections
- `/api/dashboard/report/options` - Dropdown options
- `repository/ReportRepository.ts` - All report queries

### 2. Dashboard APIs (TeamMemberCache)
- `/api/dashboard/kpi` - KPI stats
- `/api/dashboard/staff` - Staff performance table
- `/api/dashboard/outliers/top3` - Top outliers
- `/api/dashboard/outliers/all` - All outliers

### 3. Display Components
- `app/components/dashboard/StaffPerformanceTable.tsx` - Staff table
- `app/components/dashboard/TopOutliersList.tsx` - Outlier cards

## Performance Notes

**TeamMemberCache** loads on server startup:
- Caches active staff from `it_team` table
- Provides O(1) lookup by userId
- Falls back to userId if not found
- Logs: "TeamMemberCache loaded X members"

## Troubleshooting

### Staff names show as userIds

**Symptom:** Display shows "TOCKTACK" instead of "Tocktack Pornperg"

**Solutions:**
1. Check server logs for "TeamMemberCache loaded" message
2. Verify it_team table has data:
   ```sql
   SELECT * FROM it_team WHERE active = 'Y'
   ```
3. Restart server to reload cache

### Some staff missing from reports

**Symptom:** Staff members not appearing in performance table

**Solutions:**
1. Check if they're active in it_team:
   ```sql
   SELECT * FROM it_team WHERE fromUser LIKE '%name%'
   ```
2. Check for orphaned tickets (userId not in it_team):
   ```sql
   SELECT DISTINCT updated_by FROM ticket
   WHERE updated_by NOT IN (SELECT userId FROM it_team WHERE active = 'Y')
   ```

### Report shows incorrect names

**Symptom:** Wrong display names in monthly report

**Solutions:**
1. Verify it_team data is correct:
   ```sql
   SELECT userId, fromUser FROM it_team WHERE active = 'Y' ORDER BY fromUser
   ```
2. Check ReportRepository JOIN queries use correct table

## Migration Notes

### Data Migration
- Existing tickets were migrated to use userId
- `it_team` table was populated from existing staff data
- Orphaned tickets (userId not in it_team) retain their original value

### Backward Compatibility
- Orphaned tickets still display their original updated_by value
- System gracefully handles missing it_team entries

## Related Files

- `app/lib/teamMemberCache.ts` - Cache implementation
- `repository/ReportRepository.ts` - Report queries with JOIN
- `app/api/dashboard/report/route.ts` - Report endpoint
- `app/api/dashboard/report/options/route.ts` - Options endpoint
- `app/components/dashboard/StaffPerformanceTable.tsx` - Display component
