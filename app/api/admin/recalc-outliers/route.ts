import { NextRequest, NextResponse } from 'next/server'
import { triggerManualRecalculation, getInitializationStatus } from '../../lib/outlierInitialization'

/**
 * POST /api/admin/recalc-outliers
 *
 * Manually trigger outlier recalculation
 *
 * Response:
 * {
 *   success: boolean,
 *   summary: { total, outliers, normal, errors },
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual recalculation requested...')

    // Check if already recalculating
    const status = getInitializationStatus()

    if (status.isRecalculating) {
      return NextResponse.json({
        success: false,
        message: 'Recalculation already in progress'
      }, { status: 409 })  // 409 Conflict
    }

    // Trigger recalculation
    const result = await triggerManualRecalculation()

    if (result.success) {
      return NextResponse.json({
        success: true,
        summary: result.summary,
        message: 'Outlier recalculation completed successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Manual recalculation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/recalc-outliers
 *
 * Get the current status of outlier detection
 *
 * Response:
 * {
 *   isInitialized: boolean,
 *   isRecalculating: boolean
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const status = getInitializationStatus()

    return NextResponse.json({
      isInitialized: status.isInitialized,
      isRecalculating: status.isRecalculating
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
