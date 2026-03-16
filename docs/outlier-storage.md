# Outlier Storage Architecture

## Overview

The outlier detection system now stores classification results in the database instead of calculating on every request. This improves performance and separates business logic from presentation.

## Database Schema

### ticket table (new column)
```sql
ALTER TABLE [Dev_Born].[dbo].[ticket]
ADD is_outlier BIT NULL
```

**Index** (automatically created):
```sql
CREATE INDEX IX_ticket_is_outlier ON [Dev_Born].[dbo].[ticket](is_outlier)
WHERE is_outlier = 1
```

## Startup Flow

```
1. Server starts
   ↓
2. getConnection() establishes database pool
   ↓
3. First API request → ensureOutlierInitialized()
   ↓
4. initializeOutlierSchema() creates column/index if needed
   ↓
5. recalculateAllOutliers() - ALWAYS runs
   ↓
6. Server ready to serve requests
```

## API Endpoints

### POST /api/admin/recalc-outliers
Manually trigger outlier recalculation

**Response:**
```json
{
  "success": true,
  "recalculated": 156,
  "duration_ms": 42300
}
```

### GET /api/admin/recalc-outliers
Get current initialization status

**Response:**
```json
{
  "initialized": true,
  "lastRecalcDate": "2026-03-16T10:30:00Z",
  "totalOutliers": 156
}
```

## Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Query Time | 500-1000ms | 50-100ms | 10-20x faster |
| SQL Complexity | 15+ line CTE | Simple WHERE | Much simpler |
| Server Startup | ~1s | ~30-60s | Every startup |

## Implementation Files

### Schema Initialization
**File**: `app/lib/sql.ts`

- `initializeOutlierSchema()`: Adds `is_outlier` column and index if missing
- Uses `COLLATE Thai_CI_AS` for Thai text compatibility
- Filtered index on `is_outlier = 1` for optimal query performance

### Startup Service
**File**: `app/lib/outlierInitialization.ts`

- `ensureOutlierInitialized()`: Called on first API request
- Checks if initialization is needed (only runs once)
- Triggers schema initialization and recalculation

### Batch Calculation
**File**: `repository/OutlierRepository.ts`

- `recalculateAllOutliers()`: Main calculation method
- Processes in batches of 1000 tickets
- Uses Per-Person Median + 15×MAD algorithm
- Updates `is_outlier` column for all tickets

**Algorithm:**
1. Get all tickets with assigned_date and close_time_minute
2. Group by assigned_to (normalized)
3. Calculate personal median and MAD for each person
4. Mark tickets exceeding threshold as outliers
5. Batch update database in chunks of 1000

### Admin Endpoint
**File**: `app/api/admin/recalc-outliers/route.ts`

- `GET`: Returns initialization status
- `POST`: Triggers manual recalculation

## Query Changes

### Before (Complex CTE)
```sql
WITH Baseline AS (
  SELECT assigned_to, percentile_cont(0.5) WITHIN GROUP (ORDER BY diff_minutes) as median
  FROM ticket WHERE ...
),
MAD AS (
  SELECT assigned_to, percentile_cont(0.5) WITHIN GROUP (ORDER BY ABS(diff_minutes - median)) as mad
  FROM ticket JOIN Baseline ON ...
)
SELECT t.* FROM ticket t
JOIN MAD m ON t.assigned_to = m.assigned_to
WHERE t.diff_minutes > m.median + (15 * m.mad)
```

### After (Simple WHERE)
```sql
SELECT message_id, assigned_to, subject, diff_minutes, created_date, assigned_date
FROM [Dev_Born].[dbo].[ticket]
WHERE is_outlier = 1
  AND assigned_date IS NOT NULL
  AND close_time_minute IS NOT NULL
ORDER BY diff_minutes DESC
```

## Changing the Algorithm

To modify the outlier detection algorithm:

1. **Update calculation logic** in `repository/OutlierRepository.ts`:
   ```typescript
   // In recalculateAllOutliers()
   // Modify the threshold calculation
   const threshold = personalMedian + (15 * personalMAD); // Change 15 to any multiplier
   ```

2. **Restart server** → Auto-recalculation runs on startup

3. **Or manually trigger**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/recalc-outliers
   ```

4. **All queries automatically use new results**

## Important Notes

- **No version tracking**: The system always recalculates on startup using current algorithm
- **Startup cost**: First request takes 30-60 seconds to initialize (for ~10,000 tickets)
- **Algorithm simplicity**: Easy to change detection logic without database migrations
- **Performance tradeoff**: Fast queries vs. slower startup (acceptable for this use case)
- **Consistency**: All queries use the same stored classification values

## Troubleshooting

### Outliers showing 0
- Check if `is_outlier` column exists: `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'is_outlier'`
- Check initialization status: `GET /api/admin/recalc-outliers`
- Manually recalculate: `POST /api/admin/recalc-outliers`

### Slow startup
- Normal for first request (30-60 seconds for 10,000 tickets)
- Subsequent requests are fast (50-100ms)
- Check batch size in `recalculateAllOutliers()` (default: 1000)

### Wrong classifications
- Algorithm may need adjustment
- Update threshold multiplier in `OutlierRepository.recalculateAllOutliers()`
- Restart server or call recalc endpoint
