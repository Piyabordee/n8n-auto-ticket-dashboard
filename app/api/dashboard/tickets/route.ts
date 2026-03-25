import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { generateTickets } from '@/data/mockData'
import { getConnection } from '@/lib/sql'
import { ensureOutlierInitialized } from '@/lib/apiInitializer'
import { validateYear, validateMonth, validateSearch, validationError } from '@/lib/apiValidation'
import { normalizeStylizedText } from '@/lib/normalizeText'

// Use shared connection from lib/sql
async function getPool() {
  return getConnection()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')
  const status = searchParams.get('status') || 'all'
  const staff = searchParams.get('staff')
  const day = searchParams.get('day')
  const searchParam = searchParams.get('search')

  // Validate year parameter
  const year = validateYear(yearParam)
  if (year === null && yearParam !== null) {
    return validationError('Invalid year parameter')
  }

  if (!year) {
    return validationError('Year parameter is required')
  }

  // Validate month parameter (optional)
  let month: number | undefined = undefined
  if (monthParam) {
    const validatedMonth = validateMonth(monthParam)
    if (validatedMonth === null) {
      return validationError('Invalid month parameter')
    }
    month = validatedMonth
  }

  // Validate status parameter
  if (status !== 'all' && status !== 'pending' && status !== 'closed') {
    return validationError('Invalid status parameter. Must be: all, pending, or closed')
  }

  // Validate and sanitize search parameter
  const search = validateSearch(searchParam)
  if (searchParam !== null && search === null) {
    return validationError('Invalid search parameter')
  }

  // Ensure outlier detection is initialized
  await ensureOutlierInitialized()

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(generateTickets(year, month, status as 'all' | 'pending' | 'closed', staff || undefined, day ? parseInt(day) : undefined))
  }

  try {
    const pool = await getPool()

    let query = `
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
      WHERE t.status != 'unsent'
        AND tm.active = 'Y'
    `

    const requestQuery = pool.request()

    // Add year filter
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)
    query += ` AND created_date >= @startDate AND created_date <= @endDate`
    requestQuery.input('startDate', sql.DateTime, startDate)
    requestQuery.input('endDate', sql.DateTime, endDate)

    // Add month filter if provided
    if (month) {
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0, 23, 59, 59)
      query += ` AND created_date >= @monthStart AND created_date <= @monthEnd`
      requestQuery.input('monthStart', sql.DateTime, monthStart)
      requestQuery.input('monthEnd', sql.DateTime, monthEnd)
    }

    // Validate day parameter if provided
    if (day) {
      const dayNum = parseInt(day)
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        return validationError('Invalid day parameter')
      }
      query += ` AND DAY(created_date) = @day`
      requestQuery.input('day', sql.Int, dayNum)
    }

    // Add status filter
    if (status === 'pending') {
      query += ` AND status IN ('pending', 'assigned')`
    } else if (status === 'closed') {
      query += ` AND status = 'closed'`
    }

    // Add staff filter (sanitize input) - now filters on fromUser display name
    if (staff) {
      query += ` AND tm.fromUser = @staff`
      requestQuery.input('staff', sql.NVarChar, staff)
    }

    // Add search filter - searches across multiple fields
    if (search) {
      // Search in subject, fromUser (display name), category, sub_category, branch_name, message_id
      query += ` AND (
        t.subject LIKE @search OR
        tm.fromUser LIKE @search OR
        t.category LIKE @search OR
        t.sub_category LIKE @search OR
        t.branch_name LIKE @search OR
        t.message_id LIKE @search
      )`
      requestQuery.input('search', sql.NVarChar, `%${search}%`)
    }

    query += ` ORDER BY t.created_date DESC`

    const result = await requestQuery.query(query)

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
    console.error('Filtered tickets API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    return NextResponse.json(generateTickets(year, month, status as 'all' | 'pending' | 'closed', staff || undefined, day ? parseInt(day) : undefined))
  }
}
