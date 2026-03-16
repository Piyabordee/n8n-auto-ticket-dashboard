'use client'

import { useState } from 'react'
import type { OutlierTicket } from '@/types/outlier'
import ClickableSubject from './ClickableSubject'

interface OutlierTableProps {
  outliers?: OutlierTicket[]
  summary?: {
    total: number
    avgTime: number
    maxTime: number
    minTime: number
    threshold: number
  }
  loading?: boolean
}

type SortColumn = 'diff_minutes' | 'assigned_to' | 'assigned_date' | 'deviation_score'
type SortDirection = 'asc' | 'desc'

export default function OutlierTable({ outliers = [], summary, loading = false }: OutlierTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('diff_minutes')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const getSortedOutliers = () => {
    const sorted = [...outliers].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
    return sorted
  }

  const formatMinutes = (minutes: number) => {
    // More than 24 hours (1440 minutes) - show days
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440)
      const remainingMinutes = minutes % 1440
      const hours = Math.floor(remainingMinutes / 60)
      const mins = remainingMinutes % 60

      let result = `${days} วัน`
      if (hours > 0) {
        result += ` ${hours} ชม.`
      }
      if (mins > 0) {
        result += ` ${mins} นาที`
      }
      return result
    }
    // More than 60 minutes - show hours
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชม.`
    }
    return `${minutes} นาที`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (outliers.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 mb-4">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-neutral-700 font-semibold text-lg">ไม่พบ Outliers</div>
          <div className="text-neutral-500 mt-2">
            ทุก Ticket อยู่ในช่วงปกติ (ค่ามัธยฐาน + 15×MAD)
          </div>
        </div>
      </div>
    )
  }

  const sortedOutliers = getSortedOutliers()

  return (
    <div className="card overflow-hidden">
      {/* Summary Header */}
      {summary && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50 border-b border-neutral-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xs sm:text-sm text-neutral-600">Total Outliers</div>
              <div className="text-lg sm:text-xl font-bold text-neutral-900">{summary.total}</div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-neutral-600">Avg Time</div>
              <div className="text-lg sm:text-xl font-bold text-warning">
                {formatMinutes(Math.round(summary.avgTime))}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-neutral-600">Max Time</div>
              <div className="text-lg sm:text-xl font-bold text-error">
                {formatMinutes(summary.maxTime)}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-neutral-600">Min Time</div>
              <div className="text-lg sm:text-xl font-bold text-primary">
                {formatMinutes(Math.round(summary.minTime))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-neutral-500 px-2">
            * ใช้เกณฑ์ต่อบุคคล (ค่ามัธยฐาน + 15×MAD ของแต่ละพนักงาน)
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-neutral-200">
        {sortedOutliers.map((outlier) => (
          <div key={outlier.message_id} className="p-4 hover:bg-neutral-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-neutral-900">{outlier.assigned_to}</span>
              <span className="badge-error">
                {outlier.deviation_score.toFixed(1)}x
              </span>
            </div>
            <div className="text-sm mb-2">
              <ClickableSubject
                subject={outlier.subject}
                messageId={outlier.message_id}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatDate(outlier.assigned_date)}</span>
              <span className="font-bold text-error">
                {formatMinutes(outlier.diff_minutes)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('assigned_to')}
              >
                พนักงาน <SortIcon column="assigned_to" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                หัวข้อ
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('assigned_date')}
              >
                วันที่ส่ง <SortIcon column="assigned_date" />
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('diff_minutes')}
              >
                เวลาที่ใช้ <SortIcon column="diff_minutes" />
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('deviation_score')}
              >
                Deviation <SortIcon column="deviation_score" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedOutliers.map((outlier) => (
              <tr key={outlier.message_id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                  {outlier.assigned_to}
                </td>
                <td className="px-6 py-4 text-sm max-w-xs truncate">
                  <ClickableSubject
                    subject={outlier.subject}
                    messageId={outlier.message_id}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {formatDate(outlier.assigned_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <span className="font-bold text-error">
                    {formatMinutes(outlier.diff_minutes)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="badge-error">
                    {outlier.deviation_score.toFixed(1)}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
