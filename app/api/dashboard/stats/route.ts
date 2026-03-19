import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { getConnection } from '@/lib/sql'
import { generateDashboardStats } from '@/data/mockData'
import { validateYear, validateMonth, validationError } from '@/lib/apiValidation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')

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

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(generateDashboardStats(year, month))
  }

  try {
    const pool = await getConnection()

    // Build date range
    const startMonth = month || 1
    const endMonth = month || 12

    const startDate = new Date(year, startMonth - 1, 1)
    const endDate = new Date(year, endMonth, 0, 23, 59, 59)

    // Run all queries in parallel for better performance
    const [totalResult, closedResult, avgTimeResult, pendingResult] = await Promise.all([
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT COUNT(*) as total
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
          AND status != 'unsent'
        `),
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT COUNT(*) as closed
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
          AND status = 'closed'
          AND status != 'unsent'
        `),
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT AVG(close_time_minute) as avgTime
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
          AND status = 'closed'
          AND status != 'unsent'
          AND close_time_minute IS NOT NULL
        `),
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT COUNT(*) as pending
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
          AND status IN ('pending', 'assigned')
          AND status != 'unsent'
        `)
    ])

    const total = totalResult.recordset[0].total
    const closed = closedResult.recordset[0].closed
    const avgTime = avgTimeResult.recordset[0].avgTime || 0
    const pending = pendingResult.recordset[0].pending
    const closeRate = total > 0 ? Math.round((closed / total) * 100) : 0

    return NextResponse.json({
      total,
      closed,
      closeRate,
      avgTime: Math.round(avgTime * 10) / 10,
      pending
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    return NextResponse.json(generateDashboardStats(year, month))
  }
  // Don't close the pool - let it be reused for subsequent requests
}
