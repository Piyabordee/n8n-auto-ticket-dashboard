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
