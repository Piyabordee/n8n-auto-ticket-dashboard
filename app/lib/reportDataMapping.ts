/**
 * Fixed Category Structure for Monthly Report
 * This defines the fixed hierarchy used in the report regardless of database values
 */

export interface ReportCategory {
  id: string
  name: string
  // Keywords to match in database values (partial matching)
  keywords: string[]
}

export interface ReportSubCategory {
  id: string
  name: string
  // Keywords to match in database values
  keywords: string[]
}

export interface ReportProblemGroup {
  id: string
  name: string
  // Keywords to match in database values
  keywords: string[]
}

export interface ReportCause {
  id: string
  name: string
  // Keywords to match in database values
  keywords: string[]
}

// Section 1: Overall Ticket Summary - Fixed Categories
// IMPORTANT: Order matters! More specific keywords should come first.
export const SECTION_1_CATEGORIES: ReportCategory[] = [
  { id: 'password_reset', name: 'Password Reset', keywords: ['password', 'PASSWORD', 'รหัสผ่าน', 'pass', '[inc-password]'] },
  { id: 'hardware', name: 'Hardware', keywords: ['hw', 'hardware', 'ฮาร์ดแวร์', '[inc-hw]', 'it'] },
  { id: 'software', name: 'Software', keywords: ['sw', 'software', 'ซอฟต์แวร์', 'โปรแกรม', '[inc-sw]', 'pos', 'rate'] },
  { id: 'setup_user', name: 'Setup User', keywords: ['setup', 'ติดตั้ง', 'setup user', '[inc-setup]', 'request'] },
  { id: 'printer', name: 'Printer', keywords: ['printer', 'print', 'เครื่องพิมพ์', 'ปริ้นเตอร์', '[inc-printer]'] },
  { id: 'network', name: 'Network', keywords: ['network', 'net', 'เน็ตเวิร์ก', 'internet', 'เน็ต', 'wifi', '[inc-net]'] },
  { id: 'camera', name: 'Camera', keywords: ['camera', 'กล้อง', '[inc-camera]'] },
  { id: 'email', name: 'Email', keywords: ['email', 'mail', 'อีเมล', 'e-mail', '[inc-email]'] }
]

// Section 2: Software Deep Dive - Fixed Sub-categories
export const SECTION_2_SOFTWARE_SUBS: ReportSubCategory[] = [
  { id: 'spr_exchange_pos', name: 'SPR Exchange POS', keywords: ['spr', 'exchange pos', 'pos exchange'] },
  { id: 'other_programs', name: 'โปรแกรมอื่นๆ', keywords: ['อื่นๆ', 'other', 'อื่น'] },
  { id: 'rate_exchange_web', name: 'Rate Exchange WEB', keywords: ['rate exchange', 'rate web', 'exchange web', 'web rate'] },
  { id: 'windows', name: 'Windows', keywords: ['windows', 'วินโดว์', 'window'] },
  { id: 'office_word_excel', name: 'Office Word Excel', keywords: ['office', 'word', 'excel', 'ms office', 'microsoft'] },
  { id: 'sync_rate', name: 'Sync Rate', keywords: ['sync', 'ซิงก์', 'synchronize'] }
]

// Section 3: Software Problem Grouping - Fixed Groups
export const SECTION_3_PROBLEM_GROUPS: ReportProblemGroup[] = [
  {
    id: 'pos_rate_error',
    name: 'POS/RATE Error',
    keywords: [
      'pos/error',
      'rate/error',
      'pos error',
      'rate error',
      'exchange pos error',
      'error pos',
      'error rate',
      'เชื่อมต่อ pos ไม่ได้',
      'เชื่อมต่อ rate ไม่ได้',
      'pos ไม่ได้',
      'rate ไม่ได้',
      'โปส ผิดพลาด',
      'เรท ผิดพลาด'
    ]
  },
  {
    id: 'other_software',
    name: 'Software อื่นๆ',
    keywords: [
      'software อื่นๆ',
      'other software',
      'อื่นๆ',
      'other'
    ]
  }
]

// Section 4: Causes of POS/RATE Error - Fixed Causes
export const SECTION_4_CAUSES: ReportCause[] = [
  {
    id: 'windows_issue',
    name: 'เป็นที่วินโดว์',
    keywords: [
      'windows',
      'วินโดว์',
      'window',
      'windows update',
      'driver',
      'ไดรเวอร์',
      'update windows',
      'อัปเดตวินโดว์'
    ]
  },
  {
    id: 'user_inexperienced',
    name: 'เป็นกลุ่มคนที่ไม่ชำนาญ',
    keywords: [
      'การใช้งาน',
      'ดึง rate',
      'โยน rate',
      'การดึง/โยน rate',
      'ไม่ชำนาญ',
      'user error',
      'ใช้งาน exchange pos',
      'การใช้งาน pos',
      'สอนใช้',
      'ไม่รู้ใช้',
      'ใช้ไม่เป็น',
      'ดึง rate ผิด',
      'โยน rate ผิด'
    ]
  },
  {
    id: 'program_issue',
    name: 'เป็นที่โปรแกรม POS / RATE',
    keywords: [
      'sync rate',
      'sync rate ผิด',
      'การ sync',
      'sync ผิด',
      'โอนข้ามสาขา',
      'โอนข้ามสาขาไม่ได้',
      'โอนสาขา',
      'ใบเสร็จ',
      'ข้อมูลในใบเสร็จ',
      'ใบเสร็จผิด',
      'pos program',
      'rate program',
      'โปรแกรม pos',
      'โปรแกรม rate',
      'bug',
      'error'
    ]
  }
]

/**
 * Find which category a database value belongs to
 * Uses partial keyword matching for flexibility
 */
function findCategoryMatch(dbValue: string, categories: ReportCategory[]): string | null {
  if (!dbValue) return null
  const normalized = dbValue.toLowerCase().trim()

  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        console.log(`  ✓ Category "${dbValue}" -> ${cat.name} (keyword: "${keyword}")`)
        return cat.id
      }
    }
  }

  // Log only when no match found
  console.log(`  ✗ Category NOT MATCHED: "${dbValue}" (normalized: "${normalized}")`)
  return null
}

/**
 * Find which sub-category a database value belongs to
 */
function findSubCategoryMatch(dbValue: string, subCategories: ReportSubCategory[]): string | null {
  if (!dbValue) return null
  const normalized = dbValue.toLowerCase().trim()

  for (const sub of subCategories) {
    for (const keyword of sub.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        console.log(`  Matched sub-category "${dbValue}" -> ${sub.name} (keyword: ${keyword})`)
        return sub.id
      }
    }
  }
  return null
}

/**
 * Find which problem group a database value belongs to
 */
function findProblemGroupMatch(dbValue: string, groups: ReportProblemGroup[]): string | null {
  if (!dbValue) return null
  const normalized = dbValue.toLowerCase().trim()

  for (const group of groups) {
    for (const keyword of group.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        console.log(`  Matched problem group "${dbValue}" -> ${group.name} (keyword: ${keyword})`)
        return group.id
      }
    }
  }
  return null
}

/**
 * Find which cause a database value belongs to
 */
function findCauseMatch(dbValue: string, causes: ReportCause[]): string | null {
  if (!dbValue) return null
  const normalized = dbValue.toLowerCase().trim()

  for (const cause of causes) {
    for (const keyword of cause.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        console.log(`  Matched cause "${dbValue}" -> ${cause.name} (keyword: ${keyword})`)
        return cause.id
      }
    }
  }
  return null
}

export interface TicketData {
  category: string
  sub_category: string
  subject: string
}

/**
 * Map database tickets to fixed report structure
 */
export function mapTicketsToReportStructure(tickets: TicketData[]) {
  console.log('=== Mapping Tickets to Report Structure ===')
  console.log(`Total tickets to map: ${tickets.length}`)

  // Section 1: Overall Summary
  const section1Counts: Record<string, number> = {}
  SECTION_1_CATEGORIES.forEach(cat => {
    section1Counts[cat.id] = 0
  })

  // Section 2: Software Sub-categories (only Software tickets)
  const section2Counts: Record<string, number> = {}
  SECTION_2_SOFTWARE_SUBS.forEach(sub => {
    section2Counts[sub.id] = 0
  })

  // Section 3: Problem Groups (only Software tickets)
  const section3Counts: Record<string, number> = {}
  SECTION_3_PROBLEM_GROUPS.forEach(group => {
    section3Counts[group.id] = 0
  })

  // Section 4: Causes (only POS/RATE Error tickets)
  const section4Counts: Record<string, number> = {}
  SECTION_4_CAUSES.forEach(cause => {
    section4Counts[cause.id] = 0
  })

  let softwareCount = 0
  let posRateErrorCount = 0

  for (const ticket of tickets) {
    const category = ticket.category?.trim() || ''
    const subCategory = ticket.sub_category?.trim() || ''
    const subject = ticket.subject?.trim() || ''

    // Debug for PASSWORD tickets
    if (category.toUpperCase() === 'PASSWORD') {
      console.log(`=== PASSWORD TICKET FOUND ===`)
      console.log(`Category: "${category}"`)
      console.log(`Sub-category: "${subCategory}"`)
      console.log(`Subject: "${subject}"`)
    }

    // Section 1: Map by category
    const catMatch = findCategoryMatch(category, SECTION_1_CATEGORIES)
    if (catMatch) {
      section1Counts[catMatch]++
    }

    // Only Software tickets go to Sections 2-4
    if (catMatch === 'software') {
      softwareCount++
      console.log(`[Software Ticket] Category: "${category}", Sub: "${subCategory}", Subject: "${subject}"`)

      // Section 2: Map by sub-category
      const subMatch = findSubCategoryMatch(subCategory, SECTION_2_SOFTWARE_SUBS)
      if (subMatch) {
        section2Counts[subMatch]++
      } else {
        // Try to match by subject if no sub-category match
        let matched = false
        for (const sub of SECTION_2_SOFTWARE_SUBS) {
          for (const keyword of sub.keywords) {
            if (subject.toLowerCase().includes(keyword.toLowerCase())) {
              section2Counts[sub.id]++
              console.log(`    -> Section 2 matched by subject: ${sub.name}`)
              matched = true
              break
            }
          }
          if (matched) break
        }
        // If no match at all, put in "other_programs"
        if (!matched) {
          section2Counts['other_programs']++
          console.log(`    -> Section 2: No match, counted as "โปรแกรมอื่นๆ"`)
        }
      }

      // Section 3: Check if it's POS/RATE Error or Other
      // First try to match by sub_category
      let groupMatch = findProblemGroupMatch(subCategory, SECTION_3_PROBLEM_GROUPS)
      let isPosRateError = groupMatch === 'pos_rate_error'

      // If no match by sub_category, try by subject
      if (!groupMatch) {
        let matched = false
        for (const group of SECTION_3_PROBLEM_GROUPS) {
          for (const keyword of group.keywords) {
            if (subject.toLowerCase().includes(keyword.toLowerCase())) {
              section3Counts[group.id]++
              isPosRateError = group.id === 'pos_rate_error'
              console.log(`    -> Section 3 matched by subject: ${group.name}`)
              matched = true
              break
            }
          }
          if (matched) break
        }
        // If still no match, count as "other_software"
        if (!matched) {
          section3Counts['other_software']++
          console.log(`    -> Section 3: No match, counted as "Software อื่นๆ"`)
          groupMatch = 'other_software'
        }
      } else {
        section3Counts[groupMatch]++
      }

      // Section 4: Only for POS/RATE Error tickets specifically
      // Use isPosRateError flag to determine if THIS ticket is a POS/RATE error
      if (isPosRateError) {
        posRateErrorCount++

        // Determine cause by sub_category first
        let causeMatch = findCauseMatch(subCategory, SECTION_4_CAUSES)
        if (causeMatch) {
          section4Counts[causeMatch]++
        } else {
          // Try to match by subject
          let matched = false
          for (const cause of SECTION_4_CAUSES) {
            for (const keyword of cause.keywords) {
              if (subject.toLowerCase().includes(keyword.toLowerCase())) {
                section4Counts[cause.id]++
                console.log(`    -> Section 4 matched by subject: ${cause.name}`)
                matched = true
                break
              }
            }
            if (matched) break
          }
          // If no match, put in "program_issue" as default for POS/RATE errors
          if (!matched) {
            section4Counts['program_issue']++
            console.log(`    -> Section 4: No match, counted as "เป็นที่โปรแกรม POS / RATE"`)
          }
        }
      }
    }
  }

  console.log('=== Mapping Results ===')
  console.log('Section 1:', section1Counts)
  console.log('Section 2:', section2Counts)
  console.log('Section 3:', section3Counts)
  console.log('Section 4:', section4Counts)
  console.log('======================')

  return {
    section1: SECTION_1_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: section1Counts[cat.id] || 0
    })),
    section2: SECTION_2_SOFTWARE_SUBS.map(sub => ({
      id: sub.id,
      name: sub.name,
      count: section2Counts[sub.id] || 0
    })),
    section3: SECTION_3_PROBLEM_GROUPS.map(group => ({
      id: group.id,
      name: group.name,
      count: section3Counts[group.id] || 0
    })),
    section4: SECTION_4_CAUSES.map(cause => ({
      id: cause.id,
      name: cause.name,
      count: section4Counts[cause.id] || 0
    })),
    totals: {
      section1: tickets.length,
      section2: softwareCount,
      section3: softwareCount,
      section4: posRateErrorCount
    }
  }
}
