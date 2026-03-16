'use client'

import { useState } from 'react'
import ClickableSubject from './ClickableSubject'

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
  is_outlier?: number
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
      'closed': 'bg-success-100 text-success-700',
      'pending': 'bg-warning-100 text-warning-700',
      'assigned': 'bg-info-100 text-info-700',
      'unsent': 'bg-neutral-100 text-neutral-600',
    }
    const statusLabelMap: Record<string, string> = {
      'closed': 'ปิดแล้ว',
      'pending': 'รอดำเนินการ',
      'assigned': 'มอบหมายแล้ว',
      'unsent': 'ยังไม่ส่ง',
    }
    const className = statusMap[status] || 'bg-neutral-100 text-neutral-600'
    const label = statusLabelMap[status] || status
    return <span className={`badge ${className}`}>{label}</span>
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null
    return <span className="ml-1 text-gray-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8 text-neutral-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div>ไม่มีข้อมูลงานในเดือนนี้</div>
        </div>
      </div>
    )
  }

  const sortedTickets = getSortedTickets()

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900">รายการงานทั้งหมด ({tickets.length} งาน)</h3>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-neutral-100">
        {sortedTickets.map((ticket) => (
          <div key={ticket.message_id} className="p-3 hover:bg-primary-50 transition-colors">
            <div className="mb-2">
              <ClickableSubject
                subject={ticket.subject}
                messageId={ticket.message_id}
              />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span className="text-neutral-600">{formatDate(ticket.created_date)}</span>
              <span className="text-neutral-700">• {ticket.assigned_to}</span>
              <span>{getStatusBadge(ticket.status)}</span>
              <span className="text-neutral-600">{ticket.branch_name}</span>
              {ticket.close_time_minute && (
                <span className={`font-semibold ${ticket.is_outlier ? 'text-error' : 'text-success'}`}>
                  {formatMinutes(ticket.close_time_minute)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('created_date')}
              >
                วันที่สร้าง <SortIcon column="created_date" />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                หัวข้อ
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('assigned_to')}
              >
                รับงานโดย <SortIcon column="assigned_to" />
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('status')}
              >
                สถานะ <SortIcon column="status" />
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('branch_name')}
              >
                สาขา <SortIcon column="branch_name" />
              </th>
              <th
                className="px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('close_time_minute')}
              >
                เวลาที่ใช้ <SortIcon column="close_time_minute" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-100">
            {sortedTickets.map((ticket) => (
              <tr key={ticket.message_id} className="hover:bg-primary-50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-neutral-600">
                  {formatDate(ticket.created_date)}
                </td>
                <td className="px-3 py-2 max-w-xs">
                  <ClickableSubject
                    subject={ticket.subject}
                    messageId={ticket.message_id}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-neutral-700">
                  {ticket.assigned_to}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {getStatusBadge(ticket.status)}
                </td>
                <td className="px-3 py-2 text-neutral-600">
                  {ticket.branch_name}
                </td>
                <td className="px-3 py-2 text-center text-neutral-900">
                  {ticket.close_time_minute ? (
                    <span className={`font-semibold ${ticket.is_outlier ? 'text-error' : 'text-success'}`}>
                      {formatMinutes(ticket.close_time_minute)}
                    </span>
                  ) : (
                    <span className="text-neutral-400">-</span>
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
