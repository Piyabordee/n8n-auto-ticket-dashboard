/**
 * Outlier Detection Feature Types
 * Statistical outlier detection using Median + 15×MAD method
 * - Per-person baseline calculated from FULL YEAR data
 * - MAD (Median Absolute Deviation) is robust against outliers
 */

// ============================================================================
// Core Outlier Types
// ============================================================================

export interface OutlierTicket {
  message_id: string
  assigned_to: string
  subject: string
  diff_minutes: number
  created_date: string
  assigned_date: string
  deviation_score: number  // Ratio of ticket time to personal median (e.g., 136.5 = ticket is 136.5x the median)
}

export interface OutlierSummary {
  total: number
  avgTime: number
  maxTime: number
  minTime: number
  threshold: number  // Per-person threshold (not applicable globally, set to 0)
}

export interface OutliersResponse {
  outliers: OutlierTicket[]
  summary: OutlierSummary
}

// ============================================================================
// Top Outliers Types
// ============================================================================

export interface TopOutliersResponse {
  top3: OutlierTicket[]
  total_count: number
  cache_ttl?: number
}

// ============================================================================
// Staff Performance Types (Updated with Outlier Stats)
// ============================================================================

export interface StaffStats {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  totalPending: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierCount: number
}

export interface OutlierSummaryStats {
  totalOutliers: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierThreshold: number
}

export interface StaffPerformanceResponse {
  staff: StaffStats[]
  summary: OutlierSummaryStats
}

// ============================================================================
// SQL Result Types (Raw from database)
// ============================================================================

export interface OutlierRow {
  message_id: string
  assigned_to: string
  subject: string
  diff_minutes: number
  created_date: Date
  assigned_date: Date
  personal_median: number
  personal_mad: number
  personal_threshold: number
  is_outlier: 'Normal' | 'Outlier'
}

export interface StaffOutlierRow {
  assigned_to: string
  totalAssigned: number
  totalClosed: number
  totalPending: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierCount: number
}
