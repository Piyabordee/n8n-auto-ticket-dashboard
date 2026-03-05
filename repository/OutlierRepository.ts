/**
 * Outlier Detection Repository
 * Handles all SQL queries for statistical outlier detection using Mean + 2SD method
 *
 * Method: PER-PERSON Outlier Detection
 * Each staff member has their own threshold based on their personal average + 2SD
 * Baseline is calculated from FULL YEAR data, month filter only affects results display
 */

import sql, { ConnectionPool } from 'mssql'
import { normalizeStylizedText } from '../app/lib/normalizeText'
import type {
  OutlierRow,
  OutlierTicket,
  OutlierSummary,
  StaffOutlierRow,
  StaffStats,
  OutlierSummaryStats,
  StaffPerformanceResponse
} from '../types/outlier'

const sqlConfig = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    useUTC: false
  },
  parseJSON: true
}

export class OutlierRepository {
  private pool: ConnectionPool | null = null

  /**
   * Establish database connection
   */
  async connect(): Promise<void> {
    if (!this.pool || !this.pool.connected) {
      this.pool = await sql.connect(sqlConfig)
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool && this.pool.connected) {
      await this.pool.close()
      this.pool = null
    }
  }

  /**
   * Get all outliers with statistical classification
   * Uses PER-PERSON Mean + 2SD threshold calculated from FULL YEAR baseline
   * Month filter only affects which results are displayed, not the baseline
   */
  async getOutliers(
    startDate: Date,
    endDate: Date
  ): Promise<{ outliers: OutlierTicket[]; summary: OutlierSummary }> {
    await this.connect()

    // Calculate full year date range (based on the requested start date)
    const yearStart = new Date(startDate.getFullYear(), 0, 1)  // Jan 1
    const yearEnd = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59)  // Dec 31

    const result = await this.pool!.request()
      .input('filterStartDate', sql.DateTime, startDate)
      .input('filterEndDate', sql.DateTime, endDate)
      .input('yearStartDate', sql.DateTime, yearStart)
      .input('yearEndDate', sql.DateTime, yearEnd)
      .query(`
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
        per_person_stats AS (
          -- Calculate mean and SD per person from FULL YEAR
          SELECT
            assigned_to,
            AVG(CAST(diff_minutes AS FLOAT)) AS mean_val,
            STDEV(diff_minutes) AS sd_val,
            COUNT(*) as ticket_count
          FROM full_year_base
          GROUP BY assigned_to
          HAVING COUNT(*) >= 2  -- Need at least 2 tickets to calculate SD
        ),
        -- Filtered data (for results display)
        filtered_base AS (
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
            AND created_date >= @filterStartDate
            AND created_date <= @filterEndDate
        ),
        classified AS (
          SELECT
            b.*,
            s.mean_val AS personal_mean,
            s.sd_val AS personal_sd,
            s.mean_val + (2 * s.sd_val) AS personal_threshold,
            CASE
              WHEN s.mean_val IS NULL THEN 'Insufficient Data'
              WHEN b.diff_minutes > s.mean_val + (2 * s.sd_val) THEN 'Outlier'
              ELSE 'Normal'
            END AS is_outlier
          FROM filtered_base b
          LEFT JOIN per_person_stats s ON b.assigned_to = s.assigned_to
        )
        SELECT *
        FROM classified
        WHERE is_outlier = 'Outlier'
        ORDER BY diff_minutes DESC
      `)

    const rows: any[] = result.recordset

    // Calculate summary stats (only for outliers)
    const outlierTimes = rows.map(r => r.diff_minutes)
    const avgTime = outlierTimes.length > 0
      ? outlierTimes.reduce((a, b) => a + b, 0) / outlierTimes.length
      : 0

    // Convert to OutlierTicket format
    const outliers: OutlierTicket[] = rows.map(row => ({
      message_id: row.message_id,
      assigned_to: normalizeStylizedText(row.assigned_to),
      subject: row.subject || '(No subject)',
      diff_minutes: row.diff_minutes,
      created_date: row.created_date.toISOString(),
      assigned_date: row.assigned_date.toISOString(),
      deviation_score: row.personal_mean > 0
        ? Math.round((row.diff_minutes / row.personal_mean) * 100) / 100
        : 0
    }))

    const summary: OutlierSummary = {
      total: outliers.length,
      avgTime: Math.round(avgTime * 10) / 10,
      maxTime: outlierTimes.length > 0 ? Math.max(...outlierTimes) : 0,
      minTime: outlierTimes.length > 0 ? Math.min(...outlierTimes) : 0,
      threshold: 0  // Per-person threshold, not applicable globally
    }

    return { outliers, summary }
  }

  /**
   * Get top 3 outliers for quick preview
   * Uses PER-PERSON Mean + 2SD threshold calculated from FULL YEAR baseline
   */
  async getTopOutliers(
    startDate: Date,
    endDate: Date
  ): Promise<OutlierTicket[]> {
    await this.connect()

    // Calculate full year date range
    const yearStart = new Date(startDate.getFullYear(), 0, 1)
    const yearEnd = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59)

    const result = await this.pool!.request()
      .input('filterStartDate', sql.DateTime, startDate)
      .input('filterEndDate', sql.DateTime, endDate)
      .input('yearStartDate', sql.DateTime, yearStart)
      .input('yearEndDate', sql.DateTime, yearEnd)
      .query(`
        -- Full year data for baseline
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
        per_person_stats AS (
          SELECT
            assigned_to,
            AVG(CAST(diff_minutes AS FLOAT)) AS mean_val,
            STDEV(diff_minutes) AS sd_val
          FROM full_year_base
          GROUP BY assigned_to
          HAVING COUNT(*) >= 2
        ),
        -- Filtered data for results
        filtered_base AS (
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
            AND created_date >= @filterStartDate
            AND created_date <= @filterEndDate
        ),
        classified AS (
          SELECT
            b.*,
            s.mean_val AS personal_mean,
            s.sd_val AS personal_sd,
            s.mean_val + (2 * s.sd_val) AS personal_threshold
          FROM filtered_base b
          INNER JOIN per_person_stats s ON b.assigned_to = s.assigned_to
          WHERE b.diff_minutes > s.mean_val + (2 * s.sd_val)
        )
        SELECT TOP 3
          message_id,
          assigned_to,
          subject,
          diff_minutes,
          created_date,
          assigned_date,
          personal_mean
        FROM classified
        ORDER BY diff_minutes DESC
      `)

    return result.recordset.map((row: any) => ({
      message_id: row.message_id,
      assigned_to: normalizeStylizedText(row.assigned_to),
      subject: row.subject || '(No subject)',
      diff_minutes: row.diff_minutes,
      created_date: row.created_date.toISOString(),
      assigned_date: row.assigned_date.toISOString(),
      deviation_score: row.personal_mean > 0
        ? Math.round((row.diff_minutes / row.personal_mean) * 100) / 100
        : 0
    }))
  }

  /**
   * Get staff performance with outlier breakdown
   * Uses PER-PERSON Mean + 2SD threshold calculated from FULL YEAR baseline
   */
  async getStaffPerformanceWithOutliers(
    startDate: Date,
    endDate: Date
  ): Promise<StaffPerformanceResponse> {
    await this.connect()

    // Calculate full year date range
    const yearStart = new Date(startDate.getFullYear(), 0, 1)
    const yearEnd = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59)

    // Get staff stats with per-person outlier classification
    const staffResult = await this.pool!.request()
      .input('filterStartDate', sql.DateTime, startDate)
      .input('filterEndDate', sql.DateTime, endDate)
      .input('yearStartDate', sql.DateTime, yearStart)
      .input('yearEndDate', sql.DateTime, yearEnd)
      .query(`
        -- Full year data for baseline
        WITH full_year_base AS (
          SELECT
            assigned_to,
            message_id,
            close_time_minute AS diff_minutes
          FROM [Dev_Born].[dbo].[ticket]
          WHERE
            close_time_minute IS NOT NULL
            AND created_date >= @yearStartDate
            AND created_date <= @yearEndDate
            AND assigned_to IS NOT NULL
            AND assigned_to != ''
        ),
        per_person_stats AS (
          -- Calculate per-person mean and SD from FULL YEAR
          SELECT
            assigned_to,
            AVG(CAST(diff_minutes AS FLOAT)) AS mean_val,
            STDEV(diff_minutes) AS sd_val
          FROM full_year_base
          GROUP BY assigned_to
          HAVING COUNT(*) >= 2  -- Need at least 2 tickets for SD
        ),
        -- Filtered data for results display
        filtered_base AS (
          SELECT
            assigned_to,
            message_id,
            status,
            close_time_minute AS diff_minutes
          FROM [Dev_Born].[dbo].[ticket]
          WHERE
            created_date >= @filterStartDate
            AND created_date <= @filterEndDate
            AND assigned_to IS NOT NULL
            AND assigned_to != ''
            AND close_time_minute IS NOT NULL
        ),
        classified AS (
          -- Classify each ticket based on FULL YEAR baseline
          SELECT
            b.assigned_to,
            b.message_id,
            b.status,
            b.diff_minutes,
            s.mean_val AS personal_mean,
            s.sd_val AS personal_sd,
            s.mean_val + (2 * s.sd_val) AS personal_threshold,
            CASE
              WHEN s.mean_val IS NULL THEN 0  -- Insufficient data
              WHEN b.diff_minutes > s.mean_val + (2 * s.sd_val) THEN 1
              ELSE 0
            END AS is_outlier
          FROM filtered_base b
          LEFT JOIN per_person_stats s ON b.assigned_to = s.assigned_to
        )
        SELECT
          CAST(assigned_to AS NVARCHAR(MAX)) as assigned_to,
          COUNT(*) as totalAssigned,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
          AVG(CASE WHEN diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeAll,
          AVG(CASE WHEN is_outlier = 0 AND diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeNormal,
          AVG(CASE WHEN is_outlier = 1 AND diff_minutes IS NOT NULL THEN diff_minutes END) as avgTimeOutlier,
          SUM(is_outlier) as outlierCount
        FROM classified
        GROUP BY CAST(assigned_to AS NVARCHAR(MAX))
        ORDER BY totalClosed DESC
      `)

    // Get summary stats (using per-person classification, aggregated)
    const summaryResult = await this.pool!.request()
      .input('filterStartDate', sql.DateTime, startDate)
      .input('filterEndDate', sql.DateTime, endDate)
      .input('yearStartDate', sql.DateTime, yearStart)
      .input('yearEndDate', sql.DateTime, yearEnd)
      .query(`
        -- Full year data for baseline
        WITH full_year_base AS (
          SELECT
            assigned_to,
            close_time_minute AS diff_minutes
          FROM [Dev_Born].[dbo].[ticket]
          WHERE
            close_time_minute IS NOT NULL
            AND created_date >= @yearStartDate
            AND created_date <= @yearEndDate
        ),
        per_person_stats AS (
          SELECT
            assigned_to,
            AVG(CAST(diff_minutes AS FLOAT)) AS mean_val,
            STDEV(diff_minutes) AS sd_val
          FROM full_year_base
          GROUP BY assigned_to
          HAVING COUNT(*) >= 2
        ),
        -- Filtered data for results
        filtered_base AS (
          SELECT
            assigned_to,
            close_time_minute AS diff_minutes
          FROM [Dev_Born].[dbo].[ticket]
          WHERE
            created_date >= @filterStartDate
            AND created_date <= @filterEndDate
            AND close_time_minute IS NOT NULL
            AND status != 'unsent'
            AND close_time_minute > 0
        ),
        classified AS (
          SELECT
            b.*,
            s.mean_val,
            s.sd_val,
            CASE
              WHEN s.mean_val IS NULL THEN 0
              WHEN b.diff_minutes > s.mean_val + (2 * s.sd_val) THEN 1
              ELSE 0
            END AS is_outlier
          FROM filtered_base b
          LEFT JOIN per_person_stats s ON b.assigned_to = s.assigned_to
        )
        SELECT
          AVG(diff_minutes) as avgTimeAll,
          AVG(CASE WHEN is_outlier = 0 THEN diff_minutes END) as avgTimeNormal,
          AVG(CASE WHEN is_outlier = 1 THEN diff_minutes END) as avgTimeOutlier,
          SUM(is_outlier) as totalOutliers,
          0 as outlierThreshold  -- Per-person, no global threshold
        FROM classified
      `)

    const summaryRow = summaryResult.recordset[0]

    // Format staff results with ranking and normalization
    const staffData: StaffStats[] = staffResult.recordset.map((row: any, index: number) => ({
      rank: index + 1,
      name: normalizeStylizedText(row.assigned_to),
      totalAssigned: row.totalAssigned,
      totalClosed: row.totalClosed,
      avgTimeAll: row.avgTimeAll ? Math.round(row.avgTimeAll * 10) / 10 : 0,
      avgTimeNormal: row.avgTimeNormal ? Math.round(row.avgTimeNormal * 10) / 10 : 0,
      avgTimeOutlier: row.avgTimeOutlier ? Math.round(row.avgTimeOutlier * 10) / 10 : 0,
      outlierCount: row.outlierCount || 0
    }))

    const summary: OutlierSummaryStats = {
      totalOutliers: summaryRow.totalOutliers || 0,
      avgTimeAll: summaryRow.avgTimeAll ? Math.round(summaryRow.avgTimeAll * 10) / 10 : 0,
      avgTimeNormal: summaryRow.avgTimeNormal ? Math.round(summaryRow.avgTimeNormal * 10) / 10 : 0,
      avgTimeOutlier: summaryRow.avgTimeOutlier ? Math.round(summaryRow.avgTimeOutlier * 10) / 10 : 0,
      outlierThreshold: 0  // Per-person thresholds
    }

    return { staff: staffData, summary }
  }
}

// Singleton instance
let repositoryInstance: OutlierRepository | null = null

export function getOutlierRepository(): OutlierRepository {
  if (!repositoryInstance) {
    repositoryInstance = new OutlierRepository()
  }
  return repositoryInstance
}
