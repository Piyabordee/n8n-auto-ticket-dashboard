import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { getConnection } from '../../../lib/sql'
import { ensureOutlierInitialized } from '../../../lib/apiInitializer'
import { normalizeStylizedText } from '../../../lib/normalizeText'

// Use shared connection from lib/sql
async function getPool() {
  return getConnection()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // Validate parameters
  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  if (isNaN(currentYear) || currentYear < 2020 || currentYear > 2100) {
    return NextResponse.json(
      { error: 'Invalid year parameter' },
      { status: 400 }
    )
  }

  if (!month) {
    return NextResponse.json(
      { error: 'Month parameter is required' },
      { status: 400 }
    )
  }

  const monthNum = parseInt(month)
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return NextResponse.json(
      { error: 'Invalid month parameter' },
      { status: 400 }
    )
  }

  // Ensure outlier detection is initialized
  await ensureOutlierInitialized()

  try {
    const pool = await getPool()

    // Build date range for the specific month
    const startDate = new Date(currentYear, monthNum - 1, 1)
    const endDate = new Date(currentYear, monthNum, 0, 23, 59, 59)

    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT
          t.message_id,
          t.subject,
          tm.fromUser AS updated_by,
          t.status,
          t.category,
          t.sub_category,
          t.branch_name,
          t.created_date,
          t.assigned_date,
          t.close_time_minute,
          t.is_outlier
        FROM [Dev_Born].[dbo].[ticket] t
        INNER JOIN [Dev_Born].[dbo].[it_team] tm ON t.updated_by = tm.userId
        WHERE
          t.created_date >= @startDate
          AND t.created_date <= @endDate
          AND t.status != 'unsent'
          AND tm.active = 'Y'
        ORDER BY t.created_date DESC
      `)

    const tickets = result.recordset.map((row: any) => ({
      message_id: row.message_id,
      subject: row.subject || '(No subject)',
      updated_by: row.updated_by ? normalizeStylizedText(row.updated_by) : 'Unassigned',
      status: row.status || 'unknown',
      category: row.category || '-',
      sub_category: row.sub_category || '-',
      branch_name: row.branch_name || '-',
      created_date: row.created_date ? row.created_date.toISOString() : null,
      assigned_date: row.assigned_date ? row.assigned_date.toISOString() : null,
      close_time_minute: row.close_time_minute || null,
      is_outlier: row.is_outlier ? 1 : 0
    }))

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Monthly tickets API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly tickets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
