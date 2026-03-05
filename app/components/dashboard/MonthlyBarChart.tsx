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
}

export default function MonthlyBarChart({ data, onMonthClick }: MonthlyBarChartProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">ปริมาณงานรายเดือน</h3>
        {onMonthClick && (
          <span className="text-sm text-gray-500">👆 คลิกที่แท่งกราฟเพื่อดูรายละเอียด</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="closed" fill="#3b82f6" name="ปิดแล้ว" stackId="1" cursor="pointer" onClick={handleBarClick} />
          <Bar dataKey="pending" fill="#ef4444" name="ยังไม่ปิด" stackId="1" cursor="pointer" onClick={handleBarClick} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
