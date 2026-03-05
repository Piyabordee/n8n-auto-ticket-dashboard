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
  const status = searchParams.get('status') || 'all'

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

    // Add status filter
    if (status === 'pending') {
      query += ` AND status = 'pending'`
    } else if (status === 'closed') {
      query += ` AND status = 'closed'`
    }

    query += ` ORDER BY created_date DESC`

    const result = await requestQuery.query(query)

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
      close_time_minute: row.close_time_minute || null
    }))

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Filtered tickets API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
