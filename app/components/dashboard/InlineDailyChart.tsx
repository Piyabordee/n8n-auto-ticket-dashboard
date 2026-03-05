'use client'

import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface InlineDailyChartProps {
  year: number
  month: number
  monthName: string
}

interface DailyData {
  day: string
  total: number
  closed: number
}

export default function InlineDailyChart({ year, month, monthName }: InlineDailyChartProps) {
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">ปริมาณงานรายวัน - {monthName} {year + 543}</h3>
        </div>
        <div className="text-center text-gray-500 py-12">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.total, 0)
  const closed = data.reduce((sum, d) => sum + d.closed, 0)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">ปริมาณงานรายวัน - {monthName} {year + 543}</h3>
        <div className="text-sm text-gray-500">
          ทั้งหมด: <span className="font-semibold text-gray-900">{total}</span> •
          ปิดแล้ว: <span className="font-semibold text-green-600">{closed}</span> •
          รอดำเนินการ: <span className="font-semibold text-red-600">{total - closed}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
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
          <Bar dataKey="closed" fill="#3b82f6" name="ปิดแล้ว" stackId="1" />
          <Bar dataKey="pending" fill="#ef4444" name="ยังไม่ปิด" stackId="1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
