import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { generateMonthlyData } from '@/data/mockData'

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

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')

  const currentYear = year ? parseInt(year) : new Date().getFullYear()

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    const monthlyData = generateMonthlyData(currentYear)
    return NextResponse.json({ data: monthlyData })
  }
  // Use UTC dates to ensure consistent behavior across timezones
  const startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0))
  const endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999))

  try {
    const pool = await getPool()

    // Get monthly totals
    const monthlyResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT
          MONTH(created_date) as month,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        GROUP BY MONTH(created_date)
        ORDER BY month
      `)

    // Build data for all 12 months (fill missing with 0)
    const monthlyData = THAI_MONTHS.map((monthName, index) => {
      const found = monthlyResult.recordset.find(r => r.month === index + 1)
      return {
        month: monthName,
        total: found?.total || 0,
        closed: found?.closed || 0
      }
    })

    return NextResponse.json({ data: monthlyData })
  } catch (error) {
    console.error('Monthly API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    const monthlyData = generateMonthlyData(currentYear)
    return NextResponse.json({ data: monthlyData })
  }
}
