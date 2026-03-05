'use client'

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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="total"
            fill="#3b82f6"
            name="ทั้งหมด"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick}
          />
          <Bar
            dataKey="closed"
            fill="#22c55e"
            name="ปิดแล้ว"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
