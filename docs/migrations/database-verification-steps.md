# Database Verification Steps

**Date:** 2026-03-25
**Purpose:** Verify Staff Member ID Integration database state

## Manual Verification Required

These SQL queries should be run in SQL Server Management Studio to verify the database state after the Staff Member ID Integration migration.

## Step 1: Verify it_team Table Exists

```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'it_team'
```

**Expected:** Should return 1 row indicating the table exists.

---

## Step 2: Check Sample it_team Data

```sql
SELECT TOP 5 * FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y'
```

**Expected:** Should return active staff members with columns:
- id
- fromUser (display name, e.g., "หลวิชัย", "พชร")
- userId (e.g., "Ub4c47e7e4f26bc5cee8868372fb6d759")
- active ('Y' or 'N')
- email_spiceworks
- createdAt
- updatedAt

---

## Step 3: Verify ticket.updated_by Contains UserIds

```sql
SELECT TOP 10 updated_by FROM [Dev_Born].[dbo].[ticket]
WHERE updated_by IS NOT NULL AND updated_by != ''
```

**Expected:** Should return userId-like strings starting with 'U' followed by 32 hexadecimal characters.

**Example format:** `Ub4c47e7e4f26bc5cee8868372fb6d759`

---

## Step 4: Count Orphaned UserIds

This query finds tickets with userId values that don't exist in the it_team table:

```sql
SELECT COUNT(*) as orphaned_count
FROM [Dev_Born].[dbo].[ticket] t
LEFT JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
WHERE t.updated_by IS NOT NULL
  AND t.updated_by != ''
  AND tm.userId IS NULL
```

**Expected:** Should be 0 or very low. If high, some tickets have userIds not mapped in it_team.

---

## Step 5: Check Active Staff Count

```sql
SELECT COUNT(*) as active_staff_count
FROM [Dev_Born].[dbo].[it_team]
WHERE active = 'Y'
```

**Expected:** Count of active staff members (typically 5-20 for most teams).

---

## Step 6: Total Ticket Count vs Staff Mappings

```sql
SELECT
  (SELECT COUNT(*) FROM [Dev_Born].[dbo].[ticket] WHERE updated_by IS NOT NULL AND updated_by != '') as total_tickets_with_staff,
  (SELECT COUNT(*) FROM [Dev_Born].[dbo].[it_team] WHERE active = 'Y') as active_staff
```

**Expected:** Total tickets should be much higher than active staff count (one staff can have many tickets).

---

## Step 7: Verify Sample Ticket Data

```sql
SELECT TOP 5
  t.message_id,
  t.updated_by,
  tm.fromUser AS display_name,
  tm.active
FROM [Dev_Born].[dbo].[ticket] t
LEFT JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
WHERE t.updated_by IS NOT NULL AND t.updated_by != ''
```

**Expected:**
- `updated_by` column shows userId
- `display_name` column shows Thai/English name
- `active` shows 'Y' for active staff

---

## What To Do If Issues Found

### Issue: Orphaned userIds (Step 4 returns > 0)

**Solution:** Add missing entries to it_team table or verify userId format is correct.

### Issue: No data in it_team table (Step 2 returns empty)

**Solution:** The it_team table needs to be populated with staff mappings. This is a database setup requirement.

### Issue: updated_by doesn't look like userId (Step 3)

**Solution:** The database may not have been migrated yet. Verify that the migration script was run.

---

## After Verification

Once all steps pass:
1. The database is ready for the Staff Member ID Integration
2. All API endpoints should return display names instead of userIds
3. Report queries will use INNER JOIN to exclude orphaned tickets
4. Real-time queries will use TeamMemberCache for display name lookups

## Notes

- **INNER JOIN Behavior:** Report queries use INNER JOIN with it_team, so orphaned tickets (userId not in it_team) will be excluded from statistics.
- **Active Staff Filter:** All queries filter by `tm.active = 'Y'` to exclude inactive/deleted staff.
- **Fallback Handling:** The TeamMemberCache provides fallback behavior (returns userId or "Unknown Staff") when a userId is not found.
