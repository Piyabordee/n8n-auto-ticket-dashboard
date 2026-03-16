import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { normalizeStylizedText } from '@/app/lib/normalizeText'
import { getConnection } from '@/app/lib/sql'
import type { OutliersResponse, OutlierTicket, OutlierSummary } from '@/types/outlier'
import { ensureOutlierInitialized } from '@/lib/apiInitializer'
import { generateAllOutliers } from '@/data/mockData'

async function getPool() {
  return getConnection()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // Validate year parameter
  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  if (isNaN(currentYear) || currentYear < 2020 || currentYear > 2100) {
    return NextResponse.json(
      { error: 'Invalid year parameter', details: 'Year must be between 2020 and 2100' },
      { status: 400 }
    )
  }

  // Validate month parameter (if provided)
  if (month) {
    const monthNum = parseInt(month)
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month parameter', details: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }
  }

  // Ensure outlier detection is initialized
  await ensureOutlierInitialized()

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(generateAllOutliers(currentYear, month ? parseInt(month) : undefined))
  }

  try {
    const pool = await getPool()

    // Build date range
    const startMonth = month ? parseInt(month) : 1
    const endMonth = month ? parseInt(month) : 12
    const startDate = new Date(currentYear, startMonth - 1, 1)
    const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

    // Simple query to get outliers from stored column
    const result = await pool.request()
      .input('filterStartDate', sql.DateTime, startDate)
      .input('filterEndDate', sql.DateTime, endDate)
      .query(`
        SELECT
          message_id,
          assigned_to,
          subject,
          close_time_minute AS diff_minutes,
          created_date,
          assigned_date
        FROM [Dev_Born].[dbo].[ticket]
        WHERE
          is_outlier = 1
          AND created_date >= @filterStartDate
          AND created_date <= @filterEndDate
        ORDER BY diff_minutes DESC
      `)

    const rows: any[] = result.recordset

    // Calculate summary stats
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
      deviation_score: 1.0  // Simplified
    }))

    const summary: OutlierSummary = {
      total: outliers.length,
      avgTime: Math.round(avgTime * 10) / 10,
      maxTime: outlierTimes.length > 0 ? Math.max(...outlierTimes) : 0,
      minTime: outlierTimes.length > 0 ? Math.min(...outlierTimes) : 0,
      threshold: 0  // Per-person thresholds, no global value
    }

    const response: OutliersResponse = {
      outliers,
      summary
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Outliers API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    return NextResponse.json(generateAllOutliers(currentYear, month ? parseInt(month) : undefined))
  }
}
