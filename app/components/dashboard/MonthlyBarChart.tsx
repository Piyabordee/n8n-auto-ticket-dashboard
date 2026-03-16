'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface MonthlyData {
  month: string
  total: number
  closed: number
  monthIndex?: number
}

interface MonthlyBarChartProps {
  data: MonthlyData[]
  onMonthClick?: (monthIndex: number, monthName: string) => void
  year?: number
  setYear?: (year: number) => void
  month?: number | null
  setMonth?: (month: number | null) => void
  availableYears?: number[]
  availableMonths?: { year: number; month: number; count: number }[]
}

const THAI_MONTHS = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export default function MonthlyBarChart({
  data,
  onMonthClick,
  year,
  setYear,
  month,
  setMonth,
  availableYears,
  availableMonths
}: MonthlyBarChartProps) {
  // Transform data to add pending count for stacked bar chart
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      pending: d.total - d.closed
    }))
  }, [data])

  const handleBarClick = (entry: any) => {
    if (onMonthClick && entry.monthIndex !== undefined) {
      onMonthClick(entry.monthIndex, entry.month)
    }
  }

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
  const years = availableYears || (year ? [year] : [])

  // Calculate totals from data
  const total = data.reduce((sum, d) => sum + d.total, 0)
  const closed = data.reduce((sum, d) => sum + d.closed, 0)

  return (
    <div className="card p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900">ปริมาณงานรายเดือน</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs sm:text-sm text-neutral-500">
            ทั้งหมด: <span className="font-semibold text-neutral-900">{total}</span> •
            ปิดแล้ว: <span className="font-semibold text-success">{closed}</span> •
            รอดำเนินการ: <span className="font-semibold text-error">{total - closed}</span>
          </div>
          {/* Filter Dropdowns */}
          {year && setYear && (
            <select
              value={year}
              onChange={(e) => {
                const newYear = parseInt(e.target.value)
                setYear(newYear)
                // Reset month when year changes (since different years have different data)
                if (setMonth) setMonth(null)
              }}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y + 543}
                </option>
              ))}
            </select>
          )}
          {month !== undefined && setMonth && (
            <select
              value={month ?? 'all'}
              onChange={(e) => setMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={monthOptions.length <= 1}
            >
              {monthOptions.map((m) => (
                <option key={m.label} value={m.value ?? 'all'}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 75)" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'oklch(0.45 0.032 75)' }} />
          <YAxis tick={{ fill: 'oklch(0.45 0.032 75)' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="closed" fill="oklch(0.55 0.080 260)" name="ปิดแล้ว" stackId="1" cursor="pointer" onClick={handleBarClick} />
          <Bar dataKey="pending" fill="oklch(0.52 0.125 25)" name="ยังไม่ปิด" stackId="1" cursor="pointer" onClick={handleBarClick} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
