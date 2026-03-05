'use client'

interface HeaderFilterProps {
  year: number
  setYear: (year: number) => void
  month: number | null
  setMonth: (month: number | null) => void
  availableYears?: number[]
  availableMonths?: { year: number; month: number; count: number }[]
}

const THAI_MONTHS = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export default function HeaderFilter({
  year,
  setYear,
  month,
  setMonth,
  availableYears,
  availableMonths
}: HeaderFilterProps) {
  // Filter months for the selected year that have data
  const monthsForSelectedYear = availableMonths
    ? availableMonths.filter(m => m.year === year)
    : []

  // Build month options - include "All Year" and months that have data
  const monthOptions = [
    { value: null as number | null, label: 'ทั้งปี' },
    ...monthsForSelectedYear
      .sort((a, b) => a.month - b.month)
      .map(m => ({
        value: m.month,
        label: THAI_MONTHS[m.month]
      }))
  ]

  // Use provided years or fallback to current year
  const years = availableYears || [year]

  return (
    <div className="bg-header-yellow">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Team Dashboard</h1>
              <p className="text-sm text-gray-700">ระบบวัดผลงานทีม IT Support</p>
            </div>
          </div>

          {/* Right: Filters */}
          <div className="flex items-center gap-3">
            {/* Year Filter */}
            <select
              value={year}
              onChange={(e) => {
                const newYear = parseInt(e.target.value)
                setYear(newYear)
                // Reset month when year changes (since different years have different data)
                setMonth(null)
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y + 543}
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={month ?? 'all'}
              onChange={(e) => setMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={monthOptions.length <= 1}
            >
              {monthOptions.map((m) => (
                <option key={m.label} value={m.value ?? 'all'}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
