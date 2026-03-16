/**
 * Format minutes into human-readable Thai time format
 * @param minutes - Time in minutes to format
 * @returns Formatted string (e.g., "2 ชม. 30 นาที", "1 วัน 3 ชม.")
 */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes < 0) return '-'
  if (minutes === 0) return '0 นาที'

  // More than 24 hours (1440 minutes) - show days
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440)
    const remainingMinutes = minutes % 1440
    const hours = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60

    let result = `${days} วัน`
    if (hours > 0) result += ` ${hours} ชม.`
    if (mins > 0) result += ` ${mins} นาที`
    return result
  }

  // More than 60 minutes - show hours
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชม.`
  }

  // Less than 60 minutes - show minutes
  return `${minutes} นาที`
}

/**
 * Format a date string into Thai locale format
 * @param dateStr - Date string to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateThai(
  dateStr: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '-'

  const date = new Date(dateStr)

  // Default options for Thai format
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  }

  return date.toLocaleDateString('th-TH', { ...defaultOptions, ...options })
}

/**
 * Format a date string with time into Thai locale format
 * @param dateStr - Date string to format
 * @returns Formatted date and time string
 */
export function formatDateTimeThai(dateStr: string | null | undefined): string {
  return formatDateThai(dateStr, {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
