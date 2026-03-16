import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { getConnection } from '../../../lib/sql'
import { generateDashboardStats } from '@/data/mockData'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month) : undefined
    return NextResponse.json(generateDashboardStats(currentYear, currentMonth))
  }

  try {
    const pool = await getConnection()

    // Build date range
    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const startMonth = month ? parseInt(month) : 1
    const endMonth = month ? parseInt(month) : 12

    const startDate = new Date(currentYear, startMonth - 1, 1)
    const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

    // Run all queries in parallel for better performance
    const [totalResult, closedResult, avgTimeResult, pendingResult] = await Promise.all([
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT COUNT(*) as total
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
        `),
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT COUNT(*) as closed
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
          AND status = 'closed'
        `),
      pool.request()
        .input('startDate', sql.DateTime, startDate)
        .input('endDate', sql.DateTime, endDate)
        .query(`
          SELECT AVG(close_time_minute) as avgTime
          FROM [Dev_Born].[dbo].[ticket]
          WHERE created_date >= @startDate AND created_date <= @endDate
          AND status = 'closed'
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
    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month) : undefined
    return NextResponse.json(generateDashboardStats(currentYear, currentMonth))
  }
  // Don't close the pool - let it be reused for subsequent requests
}
