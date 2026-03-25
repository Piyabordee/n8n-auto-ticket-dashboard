/**
 * TeamMemberCache - Centralized cache for staff lookups
 * Loads active staff members from it_team table at server startup
 *
 * UserId Format: U + 32 hex characters (e.g., Ub4c47e7e4f26bc5cee8868372fb6d759)
 */

import sql from 'mssql'
import { getConnection } from './sql'

export interface TeamMember {
  userId: string
  fromUser: string
  email: string | null
  active: 'Y' | 'N'
}

export interface TeamMemberCacheConfig {
  fallbackToUserId: boolean    // If true, return userId when not found
  unknownLabel: string         // Label to return when fallback is false
}

class TeamMemberCache {
  private cache: Map<string, string>         // userId → fromUser
  private emailCache: Map<string, string>    // userId → email
  private initialized: boolean = false
  private config: TeamMemberCacheConfig

  constructor(config?: Partial<TeamMemberCacheConfig>) {
    this.cache = new Map()
    this.emailCache = new Map()
    this.config = {
      fallbackToUserId: true,
      unknownLabel: 'Unknown Staff',
      ...config
    }
  }

  /**
   * Load all active staff from database
   * Safe to call multiple times - only initializes once
   */
  async init(): Promise<void> {
    if (this.initialized) return

    try {
      const pool = await getConnection()
      const result = await pool.request()
        .query(`
          SELECT userId, fromUser, email_spiceworks, active
          FROM [Dev_Born].[dbo].[it_team]
          WHERE active = 'Y'
        `)

      for (const row of result.recordset) {
        this.cache.set(row.userId, row.fromUser)
        this.emailCache.set(row.userId, row.email_spiceworks || '')
      }

      this.initialized = true
      console.log(`✅ TeamMemberCache loaded: ${this.cache.size} staff members`)
    } catch (error) {
      console.error('❌ TeamMemberCache init failed:', error)
      // Don't throw - allow app to continue with empty cache
      this.initialized = false
    }
  }

  /**
   * Get display name by userId
   * Returns fallback (userId or 'Unknown Staff') if not found
   */
  getDisplayName(userId: string): string {
    if (!userId) return this.config.unknownLabel
    return this.cache.get(userId)
      ?? (this.config.fallbackToUserId ? userId : this.config.unknownLabel)
  }

  /**
   * Get email by userId
   */
  getEmail(userId: string): string | null {
    if (!userId) return null
    return this.emailCache.get(userId) ?? null
  }

  /**
   * Reverse lookup: get userId by display name
   * Useful for filtering by display name from UI
   */
  getUserIdByDisplayName(displayName: string): string | null {
    for (const [userId, name] of this.cache.entries()) {
      if (name === displayName) {
        return userId
      }
    }
    return null
  }

  /**
   * Check if userId exists in cache
   */
  has(userId: string): boolean {
    return this.cache.has(userId)
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      initialized: this.initialized
    }
  }

  /**
   * Reset cache (for testing or manual refresh)
   */
  reset(): void {
    this.cache.clear()
    this.emailCache.clear()
    this.initialized = false
  }
}

// Singleton instance
export const teamMemberCache = new TeamMemberCache()
