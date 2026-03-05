import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

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

  try {
    const pool = await getPool()

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
    return NextResponse.json(
      { error: 'Failed to fetch Stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
  // Don't close the pool - let it be reused for subsequent requests
}
