import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/sql'
import sql from 'mssql'
import { mapTicketsToReportStructure } from '@/lib/reportDataMapping'

/**
 * Monthly Report API - Fixed Structure
 * Returns report data with fixed categories as specified
 * Query params:
 * - year (required): Year to report on
 * - month (required): Month number (1-12)
 */

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getThaiMonthName(month: number): string {
  return THAI_MONTHS[month - 1]
}

function getEnglishMonthName(month: number): string {
  return ENGLISH_MONTHS[month - 1]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // Validate parameters
  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  if (isNaN(currentYear) || currentYear < 2020 || currentYear > 2100) {
    return NextResponse.json(
      { error: 'Invalid year parameter' },
      { status: 400 }
    )
  }

  const monthNum = month ? parseInt(month) : new Date().getMonth() + 1
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return NextResponse.json(
      { error: 'Invalid month parameter' },
      { status: 400 }
    )
  }

  try {
    const pool = await getConnection()

    const startDate = new Date(currentYear, monthNum - 1, 1)
    const endDate = new Date(currentYear, monthNum, 0, 23, 59, 59)

    // Fetch all tickets for the month
    const query = `
      SELECT
        category,
        sub_category,
        subject
      FROM [Dev_Born].[dbo].[ticket]
      WHERE created_date >= @startDate
        AND created_date <= @endDate
        AND status != 'unsent'
    `

    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(query)

    const tickets = result.recordset.map((row: any) => ({
      category: row.category || '',
      sub_category: row.sub_category || '',
      subject: row.subject || ''
    }))

    // Debug: Show unique categories and sub-categories in database
    const uniqueCategories = [...new Set(tickets.map(t => t.category).filter(c => c))]
    const uniqueSubCategories = [...new Set(tickets.map(t => t.sub_category).filter(s => s))]

    console.log('=== Database Values ===')
    console.log('Unique Categories:', uniqueCategories)
    console.log('Unique Sub-categories:', uniqueSubCategories)
    console.log('======================')

    // Map to fixed structure
    const reportData = mapTicketsToReportStructure(tickets)

    // Debug logging
    console.log('=== Report Data Debug ===')
    console.log('Total tickets:', tickets.length)
    console.log('Section 1 (Category):', reportData.section1.map(s => `${s.name}: ${s.count}`))
    console.log('Section 2 (Software):', reportData.section2.map(s => `${s.name}: ${s.count}`))
    console.log('Section 3 (Problem Groups):', reportData.section3.map(s => `${s.name}: ${s.count}`))
    console.log('Section 4 (Causes):', reportData.section4.map(s => `${s.name}: ${s.count}`))
    console.log('========================')

    return NextResponse.json({
      year: currentYear,
      month: monthNum,
      monthNameThai: getThaiMonthName(monthNum),
      monthNameEnglish: getEnglishMonthName(monthNum),
      totalTickets: tickets.length,
      ...reportData
    })

  } catch (error) {
    console.error('Monthly Report API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}
