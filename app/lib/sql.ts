import sql from 'mssql'

const sqlConfig = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false, // Disable encryption for Node.js 18 compatibility
    trustServerCertificate: true,
    enableArithAbort: true,
    useUTC: false
  },
  parseJSON: true,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}

/**
 * Outlier Detection Version
 * Increment this value when the outlier detection algorithm changes
 * This triggers automatic recalculation of all is_outlier values on server startup
 */
export const OUTLIER_VERSION = '1.0'

/**
 * Enable/disable automatic outlier recalculation on startup
 * Set to 'false' in .env for emergency deployments
 */
export const AUTO_RECALC_OUTLIERS = process.env.AUTO_RECALC_OUTLIERS !== 'false'

/**
 * Shared singleton connection pool
 * All API routes use this same pool instance to avoid race conditions
 */
let sharedPool: sql.ConnectionPool | null = null
let connectingPromise: Promise<sql.ConnectionPool> | null = null
let connectionError: Error | null = null

/**
 * Get or create the shared connection pool
 * Uses a promise to ensure only one connection attempt happens even with concurrent calls
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  // Return cached connected pool immediately
  if (sharedPool && sharedPool.connected) {
    return sharedPool
  }

  // If there was a previous connection error, throw it
  if (connectionError) {
    throw connectionError
  }

  // If connection is in progress, wait for it
  if (connectingPromise) {
    return connectingPromise
  }

  // Create new connection pool
  connectingPromise = (async () => {
    try {
      console.log('Connecting to SQL Server...')
      const pool = await sql.connect(sqlConfig)

      // Verify connection is established
      if (!pool.connected) {
        throw new Error('Connection pool created but not connected')
      }

      console.log('SQL Server connected successfully')
      sharedPool = pool
      // Don't clear connectingPromise - keep it to indicate connection is complete
      return pool
    } catch (error) {
      console.error('SQL connection error:', error)
      connectionError = error as Error
      connectingPromise = null
      throw error
    }
  })()

  return connectingPromise
}

/**
 * Close the shared connection pool
 * Call this when shutting down the application
 */
export async function closeConnection(): Promise<void> {
  if (sharedPool && sharedPool.connected) {
    try {
      await sharedPool.close()
      sharedPool = null
      connectingPromise = null
      connectionError = null
      console.log('SQL Server connection closed')
    } catch (error) {
      console.error('SQL close error:', error)
    }
  }
}

/**
 * Initialize database schema for outlier storage
 * Creates is_outlier column and outlier_version table if they don't exist
 * Call this once during application startup
 */
export async function initializeOutlierSchema(): Promise<void> {
  try {
    const pool = await getConnection()
    console.log('🔍 Initializing outlier detection schema...')

    // 1. Add is_outlier column if it doesn't exist (with default value to avoid NULLs during transition)
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('[Dev_Born].[dbo].[ticket]')
        AND name = 'is_outlier'
      )
      BEGIN
        ALTER TABLE [Dev_Born].[dbo].[ticket]
        ADD is_outlier BIT NULL CONSTRAINT DF_ticket_is_outlier DEFAULT 0
        PRINT 'Added is_outlier column to ticket table with default value 0'
      END
      ELSE
      PRINT 'is_outlier column already exists'
    `)

    // 2. Create index on is_outlier for query performance
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.indexes
        WHERE object_id = OBJECT_ID('[Dev_Born].[dbo].[ticket]')
        AND name = 'IX_ticket_is_outlier'
      )
      BEGIN
        CREATE INDEX IX_ticket_is_outlier
        ON [Dev_Born].[dbo].[ticket](is_outlier)
        INCLUDE (message_id, assigned_to, close_time_minute, created_date)
        PRINT 'Created index on is_outlier column'
      END
      ELSE
      PRINT 'Index IX_ticket_is_outlier already exists'
    `)

    // 3. Create version tracking table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'outlier_version')
      BEGIN
        CREATE TABLE [Dev_Born].[dbo].[outlier_version] (
          version NVARCHAR(50) NOT NULL,
          updated_at DATETIME DEFAULT GETDATE(),
          PRIMARY KEY (version)
        )
        PRINT 'Created outlier_version table'
      END
      ELSE
      PRINT 'outlier_version table already exists'
    `)

    // 4. Create rollback table to store original schema info
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'outlier_rollback_info')
      BEGIN
        CREATE TABLE [Dev_Born].[dbo].[outlier_rollback_info] (
          id INT IDENTITY(1,1) PRIMARY KEY,
          rollback_sql NVARCHAR(MAX),
          applied_at DATETIME DEFAULT GETDATE(),
          description NVARCHAR(500)
        )
        PRINT 'Created outlier_rollback_info table'
      END
    `)

    console.log('✅ Outlier schema initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing outlier schema:', error)
    throw error
  }
}

/**
 * Get the current outlier version from the database
 * Returns null if no version is stored yet
 */
export async function getCurrentOutlierVersion(): Promise<string | null> {
  try {
    const pool = await getConnection()
    const result = await pool.request()
      .query(`SELECT TOP 1 version FROM [Dev_Born].[dbo].[outlier_version] ORDER BY updated_at DESC`)

    if (result.recordset.length > 0) {
      return result.recordset[0].version
    }
    return null
  } catch (error) {
    console.error('Error getting outlier version:', error)
    return null
  }
}

/**
 * Update the outlier version in the database
 * Call this after recalculating all outliers
 */
export async function updateOutlierVersion(version: string): Promise<void> {
  try {
    const pool = await getConnection()
    await pool.request()
      .input('version', sql.NVarChar, version)
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        MERGE [Dev_Born].[dbo].[outlier_version] AS target
        USING (SELECT @version AS version) AS source
        ON (1=1)
        WHEN MATCHED THEN
          UPDATE SET version = @version, updated_at = @updated_at
        WHEN NOT MATCHED THEN
          INSERT (version, updated_at)
          VALUES (@version, @updated_at);
      `)

    console.log(`✅ Outlier version updated to ${version}`)
  } catch (error) {
    console.error('Error updating outlier version:', error)
    throw error
  }
}

/**
 * Check if outlier recalculation is needed
 * Returns true if the stored version doesn't match the current version
 */
export async function needsOutlierRecalculation(): Promise<boolean> {
  const storedVersion = await getCurrentOutlierVersion()
  const needsRecalc = storedVersion !== OUTLIER_VERSION

  if (needsRecalc) {
    console.log(`🔄 Outlier recalculation needed: stored=${storedVersion}, current=${OUTLIER_VERSION}`)
  } else {
    console.log(`✅ Outlier data up to date (version ${OUTLIER_VERSION})`)
  }

  return needsRecalc
}
