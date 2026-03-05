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
  try {
    const pool = await getPool()

    // Get all distinct year-month combinations that have tickets
    const result = await pool.request().query(`
      SELECT DISTINCT
        YEAR(created_date) as year,
        MONTH(created_date) as month,
        COUNT(*) as count
      FROM [Dev_Born].[dbo].[ticket]
      WHERE created_date IS NOT NULL
      GROUP BY YEAR(created_date), MONTH(created_date)
      ORDER BY year DESC, month DESC
    `)

    const availableMonths = result.recordset.map((row: any) => ({
      year: row.year,
      month: row.month,
      count: row.count
    }))

    // Get unique years
    const years = [...new Set(availableMonths.map(m => m.year))].sort((a, b) => b - a)

    return NextResponse.json({
      years,
      months: availableMonths
    })
  } catch (error) {
    console.error('Available months API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available months', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
