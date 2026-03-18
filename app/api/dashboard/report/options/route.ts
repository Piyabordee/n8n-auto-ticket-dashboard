import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'
import { getConnection } from '@/lib/sql'

/**
 * GET /api/dashboard/report/options
 * Returns unique values for dropdown fields in report configuration
 *
 * Query params:
 * - year, month: optional filters for data
 *
 * Returns:
 * - categories: unique category values
 * - subCategoriesSoftware: unique sub_category where category = 'Software'
 * - subCategoriesHardware: unique sub_category where category = 'Hardware'
 * - closeCauses: unique close_cause values
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const daysInMonth = new Date(year, month, 0).getDate()
    const endDate = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999))

    const pool = await getConnection()

    // Get unique categories
    const categoryResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT DISTINCT category
        FROM [Dev_Born].[dbo].[ticket]
        WHERE category IS NOT NULL
          AND category != ''
          AND status != 'unsent'
          AND created_date >= @startDate AND created_date <= @endDate
        ORDER BY category
      `)

    // Get unique sub_categories for Software
    const softwareResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT DISTINCT sub_category
        FROM [Dev_Born].[dbo].[ticket]
        WHERE category = 'Software'
          AND sub_category IS NOT NULL
          AND sub_category != ''
          AND status != 'unsent'
          AND created_date >= @startDate AND created_date <= @endDate
        ORDER BY sub_category
      `)

    // Get unique sub_categories for Hardware
    const hardwareResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT DISTINCT sub_category
        FROM [Dev_Born].[dbo].[ticket]
        WHERE category = 'Hardware'
          AND sub_category IS NOT NULL
          AND sub_category != ''
          AND status != 'unsent'
          AND created_date >= @startDate AND created_date <= @endDate
        ORDER BY sub_category
      `)

    // Get unique close_cause values
    const closeCauseResult = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        SELECT DISTINCT close_cause
        FROM [Dev_Born].[dbo].[ticket]
        WHERE close_cause IS NOT NULL
          AND close_cause != ''
          AND status != 'unsent'
          AND created_date >= @startDate AND created_date <= @endDate
        ORDER BY close_cause
      `)

    return NextResponse.json({
      categories: categoryResult.recordset.map((r: any) => r.category),
      subCategoriesSoftware: softwareResult.recordset.map((r: any) => r.sub_category),
      subCategoriesHardware: hardwareResult.recordset.map((r: any) => r.sub_category),
      closeCauses: closeCauseResult.recordset.map((r: any) => r.close_cause),
    })
  } catch (error) {
    console.error('Error fetching report options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report options' },
      { status: 500 }
    )
  }
}
