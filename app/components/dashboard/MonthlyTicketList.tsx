'use client'

import { useState } from 'react'

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

interface MonthlyTicketListProps {
  tickets: Ticket[]
  loading: boolean
}

type SortColumn = 'created_date' | 'assigned_to' | 'status' | 'close_time_minute' | 'branch_name'
type SortDirection = 'asc' | 'desc'

export default function MonthlyTicketList({ tickets, loading }: MonthlyTicketListProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const getSortedTickets = () => {
    const sorted = [...tickets].sort((a, b) => {
      let aVal: any = a[sortColumn]
      let bVal: any = b[sortColumn]

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = ''
      if (bVal === null || bVal === undefined) bVal = ''

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal, 'th')
          : bVal.localeCompare(aVal, 'th')
      }

      // Number comparison
      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
    return sorted
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'closed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'unsent': 'bg-gray-100 text-gray-600',
    }
    const statusLabelMap: Record<string, string> = {
      'closed': 'ปิดแล้ว',
      'pending': 'รอดำเนินการ',
      'assigned': 'มอบหมายแล้ว',
      'unsent': 'ยังไม่ส่ง',
    }
    const className = statusMap[status] || 'bg-gray-100 text-gray-600'
    const label = statusLabelMap[status] || status
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null
    return <span className="ml-1 text-gray-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <div>ไม่มีข้อมูลงานในเดือนนี้</div>
        </div>
      </div>
    )
  }

  const sortedTickets = getSortedTickets()

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">📋 รายการงานทั้งหมด ({tickets.length} งาน)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_date')}
              >
                วันที่สร้าง <SortIcon column="created_date" />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                หัวข้อ
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('assigned_to')}
              >
                รับงานโดย <SortIcon column="assigned_to" />
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                สถานะ <SortIcon column="status" />
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('branch_name')}
              >
                สาขา <SortIcon column="branch_name" />
              </th>
              <th
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('close_time_minute')}
              >
                เวลาที่ใช้ <SortIcon column="close_time_minute" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedTickets.map((ticket) => (
              <tr key={ticket.message_id} className="hover:bg-blue-50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                  {formatDate(ticket.created_date)}
                </td>
                <td className="px-3 py-2 max-w-xs">
                  <div className="text-gray-900 font-medium truncate" title={ticket.subject}>
                    {ticket.subject}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                  {ticket.assigned_to}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {getStatusBadge(ticket.status)}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {ticket.branch_name}
                </td>
                <td className="px-3 py-2 text-center text-gray-900">
                  {ticket.close_time_minute ? (
                    <span className="font-semibold text-blue-600">
                      {formatMinutes(ticket.close_time_minute)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
