'use client'

import type { OutlierTicket } from '@/types/outlier'
import ClickableSubject from './ClickableSubject'

interface TopOutliersListProps {
  outliers?: OutlierTicket[]
  onViewAll?: () => void
  loading?: boolean
}

export default function TopOutliersList({ outliers = [], onViewAll, loading = false }: TopOutliersListProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (outliers.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-100 mb-3">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-neutral-700 font-medium">ไม่พบ Outliers</div>
          <div className="text-sm text-neutral-500 mt-1">ทุก Ticket อยู่ในช่วงปกติ</div>
        </div>
      </div>
    )
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
      year: '2-digit'
    })
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex flex-row items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900">Top Outliers (นานที่สุด)</h3>
        {outliers.length > 0 && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm text-primary hover:text-primary-700 font-medium whitespace-nowrap"
          >
            ดูทั้งหมด →
          </button>
        )}
      </div>

      <div className="divide-y divide-neutral-100">
        {outliers.map((outlier, index) => (
          <div key={outlier.message_id} className="p-3 sm:p-4 hover:bg-neutral-50 transition-colors">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                index === 0 ? 'bg-error-100 text-error-700' :
                index === 1 ? 'bg-warning-100 text-warning-700' :
                'bg-warning-50 text-warning-600'
              }`}>
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                  <span className="text-xs sm:text-sm font-medium text-neutral-900">
                    {outlier.assigned_to}
                  </span>
                  <span className="text-xs text-neutral-500">•</span>
                  <span className="text-xs text-neutral-500">
                    {formatDate(outlier.assigned_date)}
                  </span>
                </div>
                <div className="text-xs sm:text-sm truncate mb-1">
                  <ClickableSubject
                    subject={outlier.subject}
                    messageId={outlier.message_id}
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-lg font-bold text-error">
                    {formatMinutes(outlier.diff_minutes)}
                  </span>
                  <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
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
