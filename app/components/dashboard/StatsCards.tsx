'use client'

type FilterType = 'all' | 'pending' | 'closed' | 'outliers' | 'outlier-explanation'

interface StatsCardsProps {
  total: number
  closed: number
  closeRate: number
  avgTime: number
  pending: number
  // Outlier stats (optional)
  avgTimeNormal?: number
  avgTimeOutlier?: number
  outlierCount?: number
  outlierThreshold?: number
  // Click handler
  onCardClick?: (filterType: FilterType) => void
}

export default function StatsCards({
  total,
  closed,
  closeRate,
  avgTime,
  pending,
  avgTimeNormal,
  avgTimeOutlier,
  outlierCount,
  outlierThreshold,
  onCardClick
}: StatsCardsProps) {
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

  // Determine if we have outlier data
  const hasOutlierData = avgTimeNormal !== undefined && avgTimeOutlier !== undefined

  return (
    <div className={`grid gap-3 mb-6 ${hasOutlierData ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
      {/* Pending Tickets */}
      <div
        onClick={() => onCardClick?.('pending')}
        className={`card border-l-error p-4 relative ${onCardClick ? 'cursor-pointer hover:shadow-elevated transition-all duration-300' : ''}`}
      >
        <div className="text-xs sm:text-sm text-neutral-600 mb-1">ยังไม่ปิด</div>
        <div className="text-2xl sm:text-3xl font-bold text-error">{pending}</div>
        <div className="text-xs text-neutral-500 mt-1">Tickets</div>
      </div>

      {/* Total Tickets */}
      <div
        onClick={() => onCardClick?.('all')}
        className={`card border-l-primary p-4 relative ${onCardClick ? 'cursor-pointer hover:shadow-elevated transition-all duration-300' : ''}`}
      >
        <div className="text-xs sm:text-sm text-neutral-600 mb-1">จำนวนงานทั้งหมด</div>
        <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{total}</div>
        <div className="text-xs text-neutral-500 mt-1">Tickets</div>
      </div>

      {/* Close Rate - not clickable */}
      <div className="card border-l-amber p-4 relative">
        <div className="text-xs sm:text-sm text-neutral-600 mb-1">อัตราการปิดงาน</div>
        <div className="text-2xl sm:text-3xl font-bold text-amber-600">{closeRate}%</div>
        <div className="text-xs text-neutral-500 mt-1">Closed / Total</div>
      </div>

      {/* Avg Resolution Time - Normal vs Outlier breakdown - clickable for explanation */}
      <div
        onClick={() => hasOutlierData && onCardClick?.('outlier-explanation')}
        className={`card border-l-warning p-4 relative ${
          hasOutlierData && onCardClick ? 'cursor-pointer hover:shadow-elevated transition-all duration-300' : ''
        }`}
      >
        {hasOutlierData ? (
          <>
            <div className="text-xs sm:text-sm text-neutral-600 mb-1">
              เวลาเฉลี่ย (<span className="text-green-600 font-medium">ปกติ</span> / <span className="text-error font-medium">Outlier</span>)
            </div>
            <div className="text-base sm:text-lg font-bold flex flex-col gap-0.5">
              <span className="text-green-600">{avgTimeNormal > 0 ? formatMinutes(Math.round(avgTimeNormal)) : '-'}</span>
              <span className="text-error">{avgTimeOutlier > 0 ? formatMinutes(Math.round(avgTimeOutlier)) : '-'}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">ค่ามัธยฐาน + 15×MAD</div>
          </>
        ) : (
          <>
            <div className="text-xs sm:text-sm text-neutral-600 mb-1">เวลาเฉลี่ย</div>
            <div className="text-2xl sm:text-3xl font-bold text-warning">
              {avgTime > 0 ? formatMinutes(Math.round(avgTime)) : '-'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">ต่อ Ticket</div>
          </>
        )}
      </div>

      {/* Outlier Count (only show when outlier data exists) */}
      {hasOutlierData && (
        <div
          onClick={() => onCardClick?.('outliers')}
          className={`card hover:shadow-elevated p-4 border-l-4 transition-all duration-300 ${
            (outlierCount || 0) === 0 ? 'border-l-neutral-300' :
            (outlierCount || 0) <= 3 ? 'border-l-warning-400' :
            (outlierCount || 0) <= 7 ? 'border-l-error-400' :
            'border-l-error'
          } ${onCardClick ? 'cursor-pointer relative' : ''}`}
        >
          <div className="text-xs sm:text-sm text-neutral-600 mb-1">Outliers</div>
          <div className={`text-2xl sm:text-3xl font-bold ${
            (outlierCount || 0) === 0 ? 'text-neutral-500' :
            (outlierCount || 0) <= 3 ? 'text-warning' :
            (outlierCount || 0) <= 7 ? 'text-error-500' :
            'text-error'
          }`}>
            {outlierCount || 0}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Tickets</div>
        </div>
      )}
    </div>
  )
}
