'use client'

import type { OutlierTicket } from '@/types/outlier'

interface TopOutliersListProps {
  outliers?: OutlierTicket[]
  onViewAll?: () => void
  loading?: boolean
}

export default function TopOutliersList({ outliers = [], onViewAll, loading = false }: TopOutliersListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (outliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✓</div>
          <div className="text-gray-600 font-medium">ไม่พบ Outliers</div>
          <div className="text-sm text-gray-500 mt-1">ทุก Ticket อยู่ในช่วงปกติ</div>
        </div>
      </div>
    )
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
      year: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Top Outliers (นานที่สุด)</h3>
        {outliers.length > 0 && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ดูทั้งหมด →
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {outliers.map((outlier, index) => (
          <div key={outlier.message_id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start gap-4">
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-red-100 text-red-700' :
                index === 1 ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {outlier.assigned_to}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(outlier.assigned_date)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 truncate mb-1">
                  {outlier.subject}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-600">
                    {formatMinutes(outlier.diff_minutes)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {outlier.deviation_score.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
