'use client'

import { useState } from 'react'
import type { OutlierTicket } from '@/types/outlier'

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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (outliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <div className="text-5xl mb-3">✓</div>
          <div className="text-gray-700 font-semibold text-lg">ไม่พบ Outliers</div>
          <div className="text-gray-500 mt-2">
            ทุก Ticket อยู่ในช่วงปกติ (Per-Person Mean + 2SD)
          </div>
        </div>
      </div>
    )
  }

  const sortedOutliers = getSortedOutliers()

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Summary Header */}
      {summary && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Total Outliers</div>
              <div className="text-xl font-bold text-gray-900">{summary.total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Time</div>
              <div className="text-xl font-bold text-orange-600">
                {formatMinutes(Math.round(summary.avgTime))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Max Time</div>
              <div className="text-xl font-bold text-red-600">
                {formatMinutes(summary.maxTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Min Time</div>
              <div className="text-xl font-bold text-blue-600">
                {formatMinutes(Math.round(summary.minTime))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            * Using Per-Person Threshold (Mean + 2SD for each staff member)
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('assigned_to')}
              >
                พนักงาน <SortIcon column="assigned_to" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                หัวข้อ
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('assigned_date')}
              >
                วันที่ส่ง <SortIcon column="assigned_date" />
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('diff_minutes')}
              >
                เวลาที่ใช้ <SortIcon column="diff_minutes" />
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('deviation_score')}
              >
                Deviation <SortIcon column="deviation_score" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOutliers.map((outlier) => (
              <tr key={outlier.message_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {outlier.assigned_to}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {outlier.subject}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(outlier.assigned_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <span className="font-bold text-red-600">
                    {formatMinutes(outlier.diff_minutes)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
