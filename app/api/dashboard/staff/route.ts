import { NextRequest, NextResponse } from 'next/server'
import { getOutlierRepository } from '@/repository/OutlierRepository'
import type { StaffPerformanceResponse } from '@/types/outlier'
import { generateStaffPerformance } from '@/data/mockData'
import { ensureOutlierInitialized } from '@/lib/apiInitializer'

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

  // Ensure outlier detection is initialized
  await ensureOutlierInitialized()

  // Build date range
  const startMonth = month ? parseInt(month) : 1
  const endMonth = month ? parseInt(month) : 12
  const startDate = new Date(currentYear, startMonth - 1, 1)
  const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

  // Use mock data if USE_MOCK_DATA is enabled
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(generateStaffPerformance(currentYear, month ? parseInt(month) : undefined))
  }

  const repository = getOutlierRepository()

  try {
    const data = await repository.getStaffPerformanceWithOutliers(startDate, endDate)

    const response: StaffPerformanceResponse = {
      staff: data.staff,
      summary: data.summary
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Staff API Error:', error)
    // Fallback to mock data if database connection fails
    console.log('Falling back to mock data due to database error')
    return NextResponse.json(generateStaffPerformance(currentYear, month ? parseInt(month) : undefined))
  } finally {
    await repository.close()
  }
}
