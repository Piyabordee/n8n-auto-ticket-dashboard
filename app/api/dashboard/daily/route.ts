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
    enableArithAbort: true
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (!year || !month) {
    return NextResponse.json(
      { error: 'year and month parameters are required' },
      { status: 400 }
    )
  }

  const currentYear = parseInt(year)
  const currentMonth = parseInt(month)

  // Get the number of days in the month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString()
  const endDate = new Date(currentYear, currentMonth - 1, daysInMonth, 23, 59, 59).toISOString()

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Get daily totals
    const dailyResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT
          DAY(created_date) as day,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        GROUP BY DAY(created_date)
        ORDER BY day
      `)

    // Build data for all days of the month (fill missing with 0)
    const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const found = dailyResult.recordset.find(r => r.day === day)
      return {
        day: `${day}`,
        total: found?.total || 0,
        closed: found?.closed || 0
      }
    })

    return NextResponse.json({ data: dailyData })
  } catch (error) {
    console.error('Daily API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
