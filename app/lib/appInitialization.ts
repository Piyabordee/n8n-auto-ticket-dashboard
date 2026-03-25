/**
 * Application Initialization
 * Coordinates startup initialization for all app services
 *
 * Initialization order:
 * 1. TeamMemberCache (fast, < 100ms)
 * 2. Outlier detection (slower, may take seconds)
 */

import { teamMemberCache } from './teamMemberCache'
import { ensureOutlierInitialized } from './apiInitializer'

let appInitialized = false

/**
 * Ensure all app services are initialized
 * Safe to call multiple times - only initializes once
 */
export async function ensureAppInitialized(): Promise<void> {
  if (appInitialized) return

  try {
    // Initialize team member cache first (fast)
    await teamMemberCache.init()

    // Then initialize outlier detection (slower, may trigger recalculation)
    await ensureOutlierInitialized()

    appInitialized = true
    console.log('✅ Application fully initialized')
  } catch (error) {
    console.error('❌ App initialization failed:', error)
    // Don't throw - allow APIs to function with fallbacks
  }
}

/**
 * Manual cache refresh
 * Use this after updating it_team table
 */
export async function refreshAppCache(): Promise<void> {
  teamMemberCache.reset()
  await teamMemberCache.init()
  console.log('🔄 App cache refreshed')
}
