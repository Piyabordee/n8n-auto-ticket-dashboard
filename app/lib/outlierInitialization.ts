/**
 * Outlier Detection Initialization Service (Simplified)
 *
 * This service runs on server startup to:
 * 1. Initialize database schema (add column, index)
 * 2. Recalculate ALL outliers (no version check - always runs)
 *
 * Usage: Call this once during application startup
 */

import {
  getConnection,
  initializeOutlierSchema
} from './sql'
import { getOutlierRepository } from '@/repository/OutlierRepository'

let isInitialized = false
let isRecalculating = false

/**
 * Initialize outlier detection system
 * Should be called once during application startup
 * ALWAYS recalculates outliers (no version check)
 *
 * @returns Initialization result
 */
export async function initializeOutlierDetection(): Promise<{
  initialized: boolean
  recalculated: boolean
  summary?: any
}> {
  // Prevent multiple initializations
  if (isInitialized) {
    return {
      initialized: true,
      recalculated: false
    }
  }

  try {
    console.log('🚀 Initializing outlier detection system...')

    // 1. Initialize database schema
    await initializeOutlierSchema()

    // 2. Prevent concurrent recalculations
    if (isRecalculating) {
      console.log('⏳ Recalculation already in progress...')
      return {
        initialized: true,
        recalculated: false
      }
    }

    // 3. ALWAYS recalculate all outliers (no version check)
    isRecalculating = true
    console.log('🔄 Recalculating all outliers...')

    const repository = getOutlierRepository()
    const summary = await repository.recalculateAllOutliers((current, total) => {
      const percent = Math.round((current / total) * 100)
      console.log(`  📈 Recalculation progress: ${current}/${total} (${percent}%)`)
    })

    isInitialized = true
    isRecalculating = false

    console.log('✅ Outlier detection initialized successfully')
    console.log(`   Total: ${summary.total}`)
    console.log(`   Outliers: ${summary.outliers}`)
    console.log(`   Normal: ${summary.normal}`)
    console.log(`   Errors: ${summary.errors}`)

    return {
      initialized: true,
      recalculated: true,
      summary
    }
  } catch (error) {
    isRecalculating = false
    console.error('❌ Error initializing outlier detection:', error)
    throw error
  }
}

/**
 * Get the current initialization status
 */
export function getInitializationStatus(): {
  isInitialized: boolean
  isRecalculating: boolean
} {
  return {
    isInitialized,
    isRecalculating
  }
}

/**
 * Trigger a manual recalculation
 * Can be called via API endpoint for admin use
 */
export async function triggerManualRecalculation(): Promise<{
  success: boolean
  summary?: any
  error?: string
}> {
  try {
    console.log('🔄 Manual recalculation triggered...')

    const repository = getOutlierRepository()
    const summary = await repository.recalculateAllOutliers((current, total) => {
      const percent = Math.round((current / total) * 100)
      console.log(`  📈 Recalculation progress: ${current}/${total} (${percent}%)`)
    })

    return {
      success: true,
      summary
    }
  } catch (error) {
    console.error('❌ Manual recalculation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
