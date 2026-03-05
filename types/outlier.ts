/**
 * Outlier Detection Feature Types
 * Statistical outlier detection using Mean + 2SD method
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
  deviation_score: number  // How many SD above mean (e.g., 2.3)
}

export interface OutlierSummary {
  total: number
  avgTime: number
  maxTime: number
  minTime: number
  threshold: number  // Mean + 2SD
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
  mean_val: number
  sd_val: number
  upper_threshold: number
  is_outlier: 'Normal' | 'Outlier'
}

export interface StaffOutlierRow {
  assigned_to: string
  totalAssigned: number
  totalClosed: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierCount: number
}
