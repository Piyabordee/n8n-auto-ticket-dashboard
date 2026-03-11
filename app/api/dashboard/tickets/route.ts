import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { generateTickets } from '@/data/mockData'

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

// Singleton connection pool
let pool: sql.ConnectionPool | null = null

async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    pool = await sql.connect(sqlConfig)
  }
  return pool
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const status = searchParams.get('status') || 'all'
  const staff = searchParams.get('staff')
  const day = searchParams.get('day')
  const search = searchParams.get('search')?.trim() || ''

  // Validate year parameter
  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  if (isNaN(currentYear) || currentYear < 2020 || currentYear > 2100) {
    return NextResponse.json(
      { error: 'Invalid year parameter' },
      { status: 400 }
    )
  }

  // Validate status parameter
  if (status !== 'all' && status !== 'pending' && status !== 'closed') {
    return NextResponse.json(
      { error: 'Invalid status parameter. Must be: all, pending, or closed' },
      { status: 400 }
    )
  }

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(generateTickets(currentYear, month ? parseInt(month) : undefined, status as 'all' | 'pending' | 'closed', staff || undefined, day ? parseInt(day) : undefined))
  }

  try {
    const pool = await getPool()

    let query = `
      SELECT
        message_id,
        subject,
        assigned_to,
        status,
        category,
        sub_category,
        branch_name,
        created_date,
        assigned_date,
        close_time_minute
      FROM [Dev_Born].[dbo].[ticket]
      WHERE 1=1
    `

    const requestQuery = pool.request()

    // Add year filter
    const startDate = new Date(currentYear, 0, 1)
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59)
    query += ` AND created_date >= @startDate AND created_date <= @endDate`
    requestQuery.input('startDate', sql.DateTime, startDate)
    requestQuery.input('endDate', sql.DateTime, endDate)

    // Add month filter if provided
    if (month) {
      const monthNum = parseInt(month)
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Invalid month parameter' },
          { status: 400 }
        )
      }
      const monthStart = new Date(currentYear, monthNum - 1, 1)
      const monthEnd = new Date(currentYear, monthNum, 0, 23, 59, 59)
      query += ` AND created_date >= @monthStart AND created_date <= @monthEnd`
      requestQuery.input('monthStart', sql.DateTime, monthStart)
      requestQuery.input('monthEnd', sql.DateTime, monthEnd)
    }

    // Validate day parameter if provided
    if (day) {
      const dayNum = parseInt(day)
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        return NextResponse.json(
          { error: 'Invalid day parameter' },
          { status: 400 }
        )
      }
    }

    // Add status filter
    if (status === 'pending') {
      query += ` AND status IN ('pending', 'assigned')`
    } else if (status === 'closed') {
      query += ` AND status = 'closed'`
    }

    // Add staff filter
    if (staff) {
      query += ` AND assigned_to = @staff`
      requestQuery.input('staff', sql.NVarChar, staff)
    }

    // Add day filter if provided
    if (day) {
      const dayNum = parseInt(day)
      query += ` AND DAY(created_date) = @day`
      requestQuery.input('day', sql.Int, dayNum)
    }

    // Add search filter - searches across multiple fields
    if (search) {
      // Search in subject, assigned_to, category, sub_category, branch_name, message_id
      query += ` AND (
        subject LIKE @search OR
        assigned_to LIKE @search OR
        category LIKE @search OR
        sub_category LIKE @search OR
        branch_name LIKE @search OR
        message_id LIKE @search
      )`
      requestQuery.input('search', sql.NVarChar, `%${search}%`)
    }

    query += ` ORDER BY created_date DESC`

    const result = await requestQuery.query(query)

    // Get outlier classification for closed tickets (per-person Median + 15×MAD)
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    const outlierResult = await pool.request()
      .input('yearStartDate', sql.DateTime, yearStart)
      .input('yearEndDate', sql.DateTime, yearEnd)
      .input('filterStartDate', sql.DateTime, startDate)
      .input('filterEndDate', sql.DateTime, endDate)
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
        -- Calculate per-person median
        per_person_median AS (
          SELECT DISTINCT
            assigned_to,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY diff_minutes) OVER (PARTITION BY assigned_to) AS personal_median,
            COUNT(*) OVER (PARTITION BY assigned_to) AS ticket_count
          FROM full_year_base
        ),
        -- Calculate absolute deviations from median
        absolute_deviations AS (
          SELECT
            f.assigned_to,
            ABS(f.diff_minutes - m.personal_median) AS abs_deviation
          FROM full_year_base f
          INNER JOIN per_person_median m ON f.assigned_to = m.assigned_to
          WHERE m.ticket_count >= 2
        ),
        -- Calculate MAD (Median of Absolute Deviations)
        per_person_mad AS (
          SELECT DISTINCT
            assigned_to,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY abs_deviation) OVER (PARTITION BY assigned_to) AS personal_mad
          FROM absolute_deviations
        ),
        -- Combined stats: median + 15*MAD
        per_person_stats AS (
          SELECT
            m.assigned_to,
            m.personal_median,
            mad.personal_mad,
            m.personal_median + (15 * mad.personal_mad) AS personal_threshold
          FROM per_person_median m
          INNER JOIN per_person_mad mad ON m.assigned_to = mad.assigned_to
          WHERE m.ticket_count >= 2
        ),
        -- Filtered data for classification
        filtered_base AS (
          SELECT
            message_id,
            assigned_to,
            close_time_minute AS diff_minutes
          FROM [Dev_Born].[dbo].[ticket]
          WHERE
            close_time_minute IS NOT NULL
            AND created_date >= @filterStartDate
            AND created_date <= @filterEndDate
        )
        SELECT
          b.message_id,
          CASE
            WHEN s.personal_median IS NULL THEN 0
            WHEN b.diff_minutes > s.personal_threshold THEN 1
            ELSE 0
          END AS is_outlier
        FROM filtered_base b
        LEFT JOIN per_person_stats s ON b.assigned_to = s.assigned_to
      `)

    // Create a map of message_id to is_outlier for quick lookup
    const outlierMap = new Map<string, number>()
    outlierResult.recordset.forEach((row: any) => {
      outlierMap.set(row.message_id, row.is_outlier)
    })

    const tickets = result.recordset.map((row: any) => ({
      message_id: row.message_id,
      subject: row.subject || '(No subject)',
      assigned_to: row.assigned_to || 'Unassigned',
      status: row.status || 'unknown',
      category: row.category || '-',
      sub_category: row.sub_category || '-',
      branch_name: row.branch_name || '-',
      created_date: row.created_date ? row.created_date.toISOString() : null,
      assigned_date: row.assigned_date ? row.assigned_date.toISOString() : null,
      close_time_minute: row.close_time_minute || null,
      is_outlier: outlierMap.get(row.message_id) || 0
    }))

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Filtered tickets API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    return NextResponse.json(generateTickets(currentYear, month ? parseInt(month) : undefined, status as 'all' | 'pending' | 'closed', staff || undefined, day ? parseInt(day) : undefined))
  }
}
