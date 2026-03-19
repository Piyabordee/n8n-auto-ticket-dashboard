/**
 * API Input Validation Utilities
 * Sanitizes and validates user inputs to prevent injection attacks
 */

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|EXECUTE)\b/i,
  /--/,
  /;/,
  /\/\*/,
  /xp_/i,
  /sp_/i,
  /\bOR\b.*\b1\s*=\s*1\b/i,
  /\bAND\b.*\b1\s*=\s*1\b/i,
  /WAITFOR\s+DELAY/i,
]

// Command injection patterns to detect
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$()]/,
  /\$\(/,
  /\{/,
  />/,
  /<\//,
  /\brm\s+/i,
  /\bnc\b/,
  /\bping\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bchmod\b/i,
]

/**
 * Validate and sanitize year parameter
 * @param value - The year value from query params
 * @returns Validated year number or null if invalid
 */
export function validateYear(value: string | null): number | null {
  if (!value) return null

  // Check for SQL injection
  const stringValue = value.toString()
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  // Check for command injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  // Parse as number
  const yearNum = parseInt(stringValue, 10)

  // Check if NaN
  if (isNaN(yearNum)) {
    return null
  }

  // Validate reasonable range (1900-2200)
  if (yearNum < 1900 || yearNum > 2200) {
    return null
  }

  return yearNum
}

/**
 * Validate and sanitize month parameter
 * @param value - The month value from query params
 * @returns Validated month number (1-12) or null if invalid
 */
export function validateMonth(value: string | null): number | null {
  if (!value) return null

  // Check for injection patterns
  const stringValue = value.toString()
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  // Parse as number
  const monthNum = parseInt(stringValue, 10)

  // Check if NaN
  if (isNaN(monthNum)) {
    return null
  }

  // Validate range (1-12)
  if (monthNum < 1 || monthNum > 12) {
    return null
  }

  return monthNum
}

/**
 * Validate and sanitize search query
 * @param value - The search query string
 * @returns Sanitized search query or null if dangerous patterns found
 */
export function validateSearch(value: string | null): string | null {
  if (!value) return null

  const stringValue = value.toString().trim()

  if (stringValue.length === 0) return null

  // Check for SQL injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  // Check for command injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  // Limit length
  if (stringValue.length > 500) {
    return null
  }

  return stringValue
}

/**
 * Validate message_id format
 * @param value - The message_id value
 * @returns Sanitized message_id or null if invalid
 */
export function validateMessageId(value: string | null): string | null {
  if (!value) return null

  const stringValue = value.toString().trim()

  if (stringValue.length === 0) return null

  // Check for path traversal
  if (stringValue.includes('..') || stringValue.includes('/') || stringValue.includes('\\')) {
    return null
  }

  // Check for injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(stringValue)) {
      return null
    }
  }

  // Limit length
  if (stringValue.length > 100) {
    return null
  }

  return stringValue
}

/**
 * Create a standardized error response
 * @param message - Error message
 * @param status - HTTP status code
 */
export function validationError(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
