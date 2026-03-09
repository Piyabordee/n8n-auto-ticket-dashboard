/**
 * Fresh Mock Data for IT Helpdesk Dashboard
 * All data is completely fictional and not based on any real data
 */

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

// Fictional staff names (completely made up)
const STAFF_NAMES = [
  'สมชาย ใจดี',
  'วิภาดา รักงาน',
  'ปิติ มุ่งมั่น',
  'นภา สุขุม',
  'กิตติ เก่งมาก',
  'มานี ขยันหมั่นเพียร',
  'สมศักดิ์ รับผิดชอบ',
  'พร้อมนุช รักเรียน'
]

// Fictional ticket subjects
const TICKET_SUBJECTS = [
  'เปิดเครื่องไม่ติด',
  'เน็ตช้ามาก',
  'เปิดโปรแกรมไม่ได้',
  'ปริ้นเตอร์ไม่ทำงาน',
  'ลืมรหัสผ่าน',
  'จอภาพมีปัญหา',
  'คีย์บอร์ดพิมพ์ไม่ได้',
  'เมาส์ใช้ไม่ได้',
  'ติดตั้งโปรแกรมให้หน่อย',
  'ไฟล์หาย',
  'อีเมลส่งไม่ออก',
  'วายไฟอินเทอร์เน็ตไม่ได้',
  'คอมพิวเตอร์ค้าง',
  'ขอสิทธิ์เข้าระบบ',
  'ตั้งค่า Outlook ใหม่',
  'สแกนเนอร์ใช้ไม่ได้',
  'ปัญหา VPN',
  'โปรแกรมค้างบ่อย',
  'ขอติดตั้ง Office',
  'เซิร์ฟเวอร์เข้าไม่ได้'
]

// Fictional branches
const BRANCHES = [
  'สำนักงานใหญ่',
  'สาขาลาดพร้าว',
  'สาขาสยาม',
  'สาขาเชียงใหม่',
  'สาขาภูเก็ต',
  'สาขาหาดใหญ่'
]

// Fictional categories
const CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'User Account',
  'Printer/Scanner',
  'Email',
  'Server',
  'Other'
]

const SUB_CATEGORIES = [
  'Computer',
  'Monitor',
  'Keyboard/Mouse',
  'Printer',
  'Network Issue',
  'WiFi',
  'VPN',
  'Installation',
  'Configuration',
  'Login Issue',
  'Password Reset',
  'Email Setup',
  'Other'
]

// ============================================================================
// Helper Functions
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(year: number, month: number): Date {
  const day = randomInt(1, 28)
  const hour = randomInt(8, 18)
  const minute = randomInt(0, 59)
  return new Date(year, month - 1, day, hour, minute)
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

// ============================================================================
// Generate Monthly Data (for bar chart)
// ============================================================================

export function generateMonthlyData(year: number) {
  return THAI_MONTHS.map((monthName, index) => {
    const total = randomInt(45, 120)
    const closed = Math.floor(total * randomInt(60, 95) / 100)
    return {
      month: monthName,
      monthIndex: index + 1,
      total,
      closed
    }
  })
}

// ============================================================================
// Generate Daily Data (for selected month)
// ============================================================================

export function generateDailyData(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const total = randomInt(0, 8)
    const closed = Math.floor(total * randomInt(60, 95) / 100)
    return {
      day: `${day}`,
      total,
      closed
    }
  })
}

// ============================================================================
// Generate Dashboard Stats
// ============================================================================

export function generateDashboardStats(year: number, month?: number) {
  const multiplier = month ? 0.08 : 1 // Approx monthly fraction
  const total = Math.floor(randomInt(700, 1000) * multiplier)
  const closed = Math.floor(total * randomInt(75, 92) / 100)
  const pending = total - closed
  const closeRate = Math.round((closed / total) * 100)

  // Avg time with some variance
  const baseAvgTime = randomInt(85, 180) // 1.5 - 3 hours average
  const avgTime = Math.round(baseAvgTime * 10) / 10

  return {
    total,
    closed,
    pending,
    closeRate,
    avgTime
  }
}

// ============================================================================
// Generate Staff Performance (with outliers)
// ============================================================================

export function generateStaffPerformance(year: number, month?: number) {
  const multiplier = month ? 0.08 : 1

  // Generate stats for each staff member
  const staffStats = STAFF_NAMES.map((name, index) => {
    const totalAssigned = Math.floor(randomInt(60, 140) * multiplier)
    const totalClosed = Math.floor(totalAssigned * randomInt(75, 95) / 100)
    const totalPending = totalAssigned - totalClosed

    // Generate times with realistic distribution
    // Some staff are faster, some slower
    const speedFactor = 0.7 + (index * 0.1) // 0.7 to 1.5 speed multiplier
    const avgTimeAll = Math.round(randomInt(90, 150) * speedFactor)
    const avgTimeNormal = Math.round(avgTimeAll * 0.85) // Normal tickets are faster
    const avgTimeOutlier = Math.round(avgTimeAll * 2.5) // Outliers take much longer

    // Each person has 0-3 outliers
    const outlierCount = randomInt(0, 3)

    return {
      rank: 0, // Will be calculated after sorting
      name,
      totalAssigned,
      totalClosed,
      totalPending,
      avgTimeAll,
      avgTimeNormal,
      avgTimeOutlier,
      outlierCount
    }
  })

  // Sort by totalAssigned and assign ranks
  const sortedStaff = [...staffStats].sort((a, b) => b.totalAssigned - a.totalAssigned)
  sortedStaff.forEach((s, i) => s.rank = i + 1)

  // Calculate summary stats
  const totalAssigned = staffStats.reduce((sum, s) => sum + s.totalAssigned, 0)
  const totalClosed = staffStats.reduce((sum, s) => sum + s.totalClosed, 0)
  const totalPending = staffStats.reduce((sum, s) => sum + s.totalPending, 0)
  const totalOutliers = staffStats.reduce((sum, s) => sum + s.outlierCount, 0)

  const weightedAvgAll = Math.round(
    staffStats.reduce((sum, s) => sum + (s.avgTimeAll * s.totalClosed), 0) / totalClosed
  )
  const weightedAvgNormal = Math.round(
    staffStats.reduce((sum, s) => sum + (s.avgTimeNormal * (s.totalClosed - s.outlierCount)), 0) /
    (totalClosed - totalOutliers)
  )
  const weightedAvgOutlier = Math.round(
    staffStats.reduce((sum, s) => sum + (s.avgTimeOutlier * s.outlierCount), 0) / totalOutliers
  )

  // Outlier threshold is calculated per-person, but we use an average for display
  const outlierThreshold = Math.round(weightedAvgNormal + (2 * (weightedAvgOutlier - weightedAvgNormal) * 0.3))

  return {
    staff: sortedStaff,
    summary: {
      totalOutliers,
      avgTimeAll: weightedAvgAll,
      avgTimeNormal: weightedAvgNormal,
      avgTimeOutlier: weightedAvgOutlier,
      outlierThreshold
    }
  }
}

// ============================================================================
// Generate Top 3 Outliers
// ============================================================================

export function generateTop3Outliers(year: number, month?: number) {
  const multiplier = month ? 0.08 : 1
  const totalOutliers = Math.floor(randomInt(15, 35) * multiplier)

  // Generate exactly 3 outliers (top ones)
  const top3 = [
    generateSingleOutlier(year, month, 3.5),  // Very high deviation
    generateSingleOutlier(year, month, 2.8),  // High deviation
    generateSingleOutlier(year, month, 2.2)   // Just above threshold
  ]

  return {
    top3,
    total_count: totalOutliers,
    cache_ttl: 60
  }
}

function generateSingleOutlier(year: number, month: number, deviationScore: number) {
  const m = month || randomInt(1, 12)
  const staff = randomItem(STAFF_NAMES)
  const createdDate = randomDate(year, m)
  const assignedDate = addMinutes(createdDate, randomInt(5, 30))

  // Outliers take much longer than normal
  const diffMinutes = randomInt(300, 1440) // 5 hours to 24 hours

  return {
    message_id: `TKT${year}${String(m).padStart(2, '0')}${randomInt(1000, 9999)}`,
    assigned_to: staff,
    subject: randomItem(TICKET_SUBJECTS),
    diff_minutes: diffMinutes,
    created_date: createdDate.toISOString(),
    assigned_date: assignedDate.toISOString(),
    deviation_score: Math.round(deviationScore * 10) / 10
  }
}

// ============================================================================
// Generate All Outliers
// ============================================================================

export function generateAllOutliers(year: number, month?: number) {
  const multiplier = month ? 0.08 : 1
  const totalOutliers = Math.floor(randomInt(15, 35) * multiplier)

  const outliers = Array.from({ length: totalOutliers }, () => {
    const deviationScore = 2 + Math.random() * 3 // 2.0 to 5.0
    return generateSingleOutlier(year, month, deviationScore)
  })

  // Sort by deviation score (highest first)
  outliers.sort((a, b) => b.deviation_score - a.deviation_score)

  const avgTime = Math.round(
    outliers.reduce((sum, o) => sum + o.diff_minutes, 0) / outliers.length
  )
  const maxTime = Math.max(...outliers.map(o => o.diff_minutes))
  const minTime = Math.min(...outliers.map(o => o.diff_minutes))
  const threshold = Math.round(avgTime * 0.6) // Threshold is lower than outlier times

  return {
    outliers,
    summary: {
      total: outliers.length,
      avgTime,
      maxTime,
      minTime,
      threshold
    }
  }
}

// ============================================================================
// Generate Filtered Tickets
// ============================================================================

export function generateTickets(
  year: number,
  month?: number,
  status: 'all' | 'pending' | 'closed' = 'all',
  staffName?: string,
  day?: number
) {
  const multiplier = month ? 0.08 : 1
  let count = Math.floor(randomInt(20, 50) * multiplier)

  // Filter based on parameters
  let tickets = Array.from({ length: count }, () => {
    const m = month || randomInt(1, 12)
    const createdDate = randomDate(year, m)
    const assignedDate = addMinutes(createdDate, randomInt(5, 45))
    const isClosed = Math.random() > 0.2 // 80% closed rate

    const closeTime = isClosed ? randomInt(15, 500) : null

    return {
      message_id: `TKT${year}${String(m).padStart(2, '0')}${randomInt(10000, 99999)}`,
      subject: randomItem(TICKET_SUBJECTS),
      assigned_to: randomItem(STAFF_NAMES),
      status: isClosed ? 'closed' : 'pending',
      category: randomItem(CATEGORIES),
      sub_category: randomItem(SUB_CATEGORIES),
      branch_name: randomItem(BRANCHES),
      created_date: createdDate.toISOString(),
      assigned_date: assignedDate.toISOString(),
      close_time_minute: closeTime
    }
  })

  // Apply filters
  if (status === 'pending') {
    tickets = tickets.filter(t => t.status === 'pending')
  } else if (status === 'closed') {
    tickets = tickets.filter(t => t.status === 'closed')
  }

  if (staffName) {
    tickets = tickets.filter(t => t.assigned_to === staffName)
  }

  if (day !== undefined) {
    tickets = tickets.filter(t => {
      const ticketDate = new Date(t.created_date || '')
      return ticketDate.getDate() === day
    })
  }

  // Sort by created_date DESC
  tickets.sort((a, b) =>
    new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
  )

  return { tickets }
}

// ============================================================================
// Generate Available Months
// ============================================================================

export function generateAvailableMonths() {
  const currentYear = new Date().getFullYear()

  const years = [currentYear, currentYear - 1, currentYear - 2]

  const months = []
  years.forEach(year => {
    THAI_MONTHS.forEach((_, index) => {
      const monthIndex = index + 1
      // Skip future months in current year
      if (year === currentYear && monthIndex > 3) {
        return
      }
      months.push({
        year,
        month: monthIndex,
        count: randomInt(45, 120)
      })
    })
  })

  return {
    years,
    months
  }
}
