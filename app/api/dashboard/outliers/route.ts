import { NextRequest, NextResponse } from 'next/server'
import { getOutlierRepository } from '../../../../repository/OutlierRepository'
import type { OutliersResponse } from '../../../../types/outlier'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // Validate year parameter
  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  if (isNaN(currentYear) || currentYear < 2020 || currentYear > 2100) {
    return NextResponse.json(
      { error: 'Invalid year parameter', details: 'Year must be between 2020 and 2100' },
      { status: 400 }
    )
  }

  // Validate month parameter (if provided)
  if (month) {
    const monthNum = parseInt(month)
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid month parameter', details: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }
  }

  // Build date range
  const startMonth = month ? parseInt(month) : 1
  const endMonth = month ? parseInt(month) : 12
  const startDate = new Date(currentYear, startMonth - 1, 1)
  const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

  const repository = getOutlierRepository()

  try {
    const { outliers, summary } = await repository.getOutliers(startDate, endDate)

    const response: OutliersResponse = {
      outliers,
      summary
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Outliers API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch outlier data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await repository.close()
  }
}
