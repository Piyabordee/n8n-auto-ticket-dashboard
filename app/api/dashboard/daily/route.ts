import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { getConnection } from '../../../lib/sql'
import { generateDailyData } from '@/data/mockData'

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

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    const dailyData = generateDailyData(currentYear, currentMonth)
    return NextResponse.json({ data: dailyData })
  }

  // Get the number of days in the month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

  // Use UTC dates to ensure consistent behavior across timezones
  const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0))
  const endDate = new Date(Date.UTC(currentYear, currentMonth - 1, daysInMonth, 23, 59, 59, 999))

  try {
    const pool = await getConnection()

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
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    const dailyData = generateDailyData(currentYear, currentMonth)
    return NextResponse.json({ data: dailyData })
  }
}
