'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MonthlyTicketList from './MonthlyTicketList'

interface DailyData {
  day: string
  total: number
  closed: number
}

interface StaffData {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  avgTimeAll: number
}

interface Ticket {
  message_id: string
  subject: string
  assigned_to: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string | null
  assigned_date: string | null
  close_time_minute: number | null
}

interface DailyBarChartProps {
  data: DailyData[]
  monthName: string
  year: number
  monthIndex?: number
  staffData: StaffData[]
  onClose: () => void
  loading?: boolean
}

export default function DailyBarChart({ data, monthName, year, monthIndex, staffData, onClose, loading }: DailyBarChartProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [showTickets, setShowTickets] = useState(true)

  // Fetch monthly tickets when modal opens
  useEffect(() => {
    if (monthIndex !== undefined) {
      const fetchTickets = async () => {
        setTicketsLoading(true)
        try {
          const res = await fetch(`/api/dashboard/monthly-tickets?year=${year}&month=${monthIndex}`)
          const data = await res.json()
          setTickets(data.tickets || [])
        } catch (error) {
          console.error('Error fetching monthly tickets:', error)
        } finally {
          setTicketsLoading(false)
        }
      }

      fetchTickets()
    }
  }, [year, monthIndex])

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800'
    if (rank === 2) return 'bg-gray-100 text-gray-600'
    if (rank === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-50 text-gray-600'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const formatMinutes = (minutes: number) => {
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
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชม.`
    }
    return `${minutes} นาที`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-header-yellow shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              รายละเอียดประจำเดือน - {monthName} {year + 543}
            </h2>
            <p className="text-sm text-gray-700">กราฟรายวัน ผลงานทีม และรายการงานทั้งหมด</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              {/* Daily Chart Section */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 กราฟรายวัน</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      label={{ value: 'วัน', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis label={{ value: 'จำนวน', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="ทั้งหมด" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="closed" fill="#22c55e" name="ปิดแล้ว" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Daily Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.reduce((sum, d) => sum + d.total, 0)}
                    </div>
                    <div className="text-sm text-gray-600">ทั้งหมด</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {data.reduce((sum, d) => sum + d.closed, 0)}
                    </div>
                    <div className="text-sm text-gray-600">ปิดแล้ว</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.reduce((sum, d) => sum + d.total - d.closed, 0)}
                    </div>
                    <div className="text-sm text-gray-600">รอดำเนินการ</div>
                  </div>
                </div>
              </div>

              {/* Staff Performance Section */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 ผลงานทีม (Staff Performance)</h3>

                {staffData.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">อันดับ</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อพนักงาน</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">รับงาน</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ปิดแล้ว</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">เวลาเฉลี่ย</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {staffData.map((person) => (
                            <tr key={person.name} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankBadge(person.rank)}`}>
                                  {getRankIcon(person.rank)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {person.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                {person.totalAssigned}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                <span className="text-green-600 font-semibold">{person.totalClosed}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                {person.avgTimeAll > 0 ? formatMinutes(Math.round(person.avgTimeAll)) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">ไม่มีข้อมูลผลงานทีมในเดือนนี้</div>
                )}
              </div>

              {/* Monthly Tickets Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📋 รายการงานทั้งหมด</h3>
                  <button
                    onClick={() => setShowTickets(!showTickets)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showTickets ? 'ซ่อน' : 'แสดง'} ↓
                  </button>
                </div>

                {showTickets && (
                  <MonthlyTicketList tickets={tickets} loading={ticketsLoading} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
