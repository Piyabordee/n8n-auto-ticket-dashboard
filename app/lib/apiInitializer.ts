/**
 * API Initializer
 * Ensures outlier detection is initialized before serving API requests
 * Uses lazy initialization - only runs once
 */

import { initializeOutlierDetection } from './outlierInitialization'

let initPromise: Promise<any> | null = null

/**
 * Ensure outlier detection is initialized
 * Safe to call multiple times - will only initialize once
 */
export async function ensureOutlierInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeOutlierDetection()
      .catch(error => {
        console.error('Failed to initialize outlier detection:', error)
        // Don't throw - allow API to function with fallback
        initPromise = null  // Allow retry
      })
  }
  return initPromise
}
