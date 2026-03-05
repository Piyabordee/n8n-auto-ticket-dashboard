'use client'

interface KPICardsProps {
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
}

export default function KPICards({
  total,
  closed,
  closeRate,
  avgTime,
  pending,
  avgTimeNormal,
  avgTimeOutlier,
  outlierCount,
  outlierThreshold
}: KPICardsProps) {
  // Determine if we have outlier data
  const hasOutlierData = avgTimeNormal !== undefined && avgTimeOutlier !== undefined

  return (
    <div className={`grid gap-4 mb-6 ${hasOutlierData ? 'grid-cols-5' : 'grid-cols-4'}`}>
      {/* Total Tickets */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
        <div className="text-sm text-gray-600 mb-1">จำนวนงานทั้งหมด</div>
        <div className="text-3xl font-bold text-gray-900">{total}</div>
        <div className="text-xs text-gray-500 mt-1">Tickets</div>
      </div>

      {/* Closed Tickets */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
        <div className="text-sm text-gray-600 mb-1">ปิดแล้ว</div>
        <div className="text-3xl font-bold text-green-600">{closed}</div>
        <div className="text-xs text-gray-500 mt-1">Tickets</div>
      </div>

      {/* Close Rate */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
        <div className="text-sm text-gray-600 mb-1">อัตราการปิดงาน</div>
        <div className="text-3xl font-bold text-purple-600">{closeRate}%</div>
        <div className="text-xs text-gray-500 mt-1">Closed / Total</div>
      </div>

      {/* Avg Resolution Time - Normal vs Outlier breakdown */}
      {hasOutlierData ? (
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">เวลาเฉลี่ย (ปกติ / Outlier)</div>
          <div className="text-xl font-bold text-orange-600">
            {avgTimeNormal > 0 ? `${avgTimeNormal} / ` : '- / '}
            <span className="text-red-600">{avgTimeOutlier > 0 ? avgTimeOutlier : '-'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">นาที (Per-Person Threshold)</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">เวลาเฉลี่ย</div>
          <div className="text-3xl font-bold text-orange-600">
            {avgTime > 0 ? `${avgTime} นาที` : '-'}
          </div>
          <div className="text-xs text-gray-500 mt-1">ต่อ Ticket</div>
        </div>
      )}

      {/* Outlier Count (only show when outlier data exists) */}
      {hasOutlierData && (
        <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
          (outlierCount || 0) === 0 ? 'border-gray-300' :
          (outlierCount || 0) <= 3 ? 'border-yellow-400' :
          (outlierCount || 0) <= 7 ? 'border-orange-400' :
          'border-red-500'
        }`}>
          <div className="text-sm text-gray-600 mb-1">Outliers</div>
          <div className={`text-3xl font-bold ${
            (outlierCount || 0) === 0 ? 'text-gray-500' :
            (outlierCount || 0) <= 3 ? 'text-yellow-600' :
            (outlierCount || 0) <= 7 ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {outlierCount || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Tickets</div>
        </div>
      )}
    </div>
  )
}
