'use client'

import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const THAI_MONTHS = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

interface InlineDailyChartProps {
  year: number
  month: number
  monthName: string
  onDayClick?: (day: string) => void
  setYear?: (year: number) => void
  setMonth?: (month: number | null) => void
  availableYears?: number[]
  availableMonths?: { year: number; month: number; count: number }[]
}

interface DailyData {
  day: string
  total: number
  closed: number
}

export default function InlineDailyChart({
  year,
  month,
  monthName,
  onDayClick,
  setYear,
  setMonth,
  availableYears,
  availableMonths
}: InlineDailyChartProps) {
  const [data, setData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/daily?year=${year}&month=${month}`)
        const result = await res.json()
        setData(result.data || [])
      } catch (error) {
        console.error('Error fetching daily data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year, month])

  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      pending: d.total - d.closed
    }))
  }, [data])

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">ปริมาณงานรายวัน - {monthName} {year + 543}</h3>
        </div>
        <div className="text-center text-gray-500 py-12">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.total, 0)
  const closed = data.reduce((sum, d) => sum + d.closed, 0)

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 ${onDayClick ? 'cursor-pointer' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">ปริมาณงานรายวัน - {monthName} {year + 543}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs sm:text-sm text-gray-500">
            ทั้งหมด: <span className="font-semibold text-gray-900">{total}</span> •
            ปิดแล้ว: <span className="font-semibold text-green-600">{closed}</span> •
            รอดำเนินการ: <span className="font-semibold text-red-600">{total - closed}</span>
          </div>
          {/* Filter Dropdowns */}
          {setYear && years.length > 0 && (
            <select
              value={year}
              onChange={(e) => {
                const newYear = parseInt(e.target.value)
                setYear(newYear)
                // Reset month when year changes
                if (setMonth) setMonth(null)
              }}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y + 543}
                </option>
              ))}
            </select>
          )}
          {setMonth && (
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            label={{ value: 'วัน', position: 'insideBottom', offset: -5 }}
          />
          <YAxis label={{ value: 'จำนวน', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="closed"
            fill="#3b82f6"
            name="ปิดแล้ว"
            stackId="1"
            onClick={(data) => onDayClick?.(data.payload?.day)}
          />
          <Bar
            dataKey="pending"
            fill="#ef4444"
            name="ยังไม่ปิด"
            stackId="1"
            onClick={(data) => onDayClick?.(data.payload?.day)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
