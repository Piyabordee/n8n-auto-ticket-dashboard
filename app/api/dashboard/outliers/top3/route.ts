import { NextRequest, NextResponse } from 'next/server'
import { getOutlierRepository } from '@/repository/OutlierRepository'
import type { TopOutliersResponse } from '@/types/outlier'
import { generateTop3Outliers } from '@/data/mockData'

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

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(generateTop3Outliers(currentYear, month ? parseInt(month) : undefined))
  }

  const repository = getOutlierRepository()

  try {
    const top3 = await repository.getTopOutliers(startDate, endDate)
    const totalCount = top3.length

    const response: TopOutliersResponse = {
      top3,
      total_count: totalCount,
      cache_ttl: 60  // 1 minute cache recommendation
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Top Outliers API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    return NextResponse.json(generateTop3Outliers(currentYear, month ? parseInt(month) : undefined))
  } finally {
    await repository.close()
  }
}
