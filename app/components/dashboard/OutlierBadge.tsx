'use client'

interface OutlierBadgeProps {
  count: number
  avgTimeOutlier: number
  onClick?: () => void
}

export default function OutlierBadge({ count, avgTimeOutlier, onClick }: OutlierBadgeProps) {
  // Color coding based on severity
  const getColorClass = () => {
    if (count === 0) return 'bg-gray-50 text-gray-600 border-gray-200'
    if (count <= 3) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    if (count <= 7) return 'bg-orange-50 text-orange-700 border-orange-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  const getIcon = () => {
    if (count === 0) return '✓'
    if (count <= 3) return '⚠️'
    if (count <= 7) return '🔶'
    return '🚨'
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${getColorClass()}`}
      onClick={onClick}
    >
      <span className="text-sm">{getIcon()}</span>
      <div className="flex flex-col">
        <span className="text-xs font-medium">Outliers</span>
        <span className="text-lg font-bold">{count}</span>
      </div>
      {count > 0 && (
        <div className="flex flex-col ml-2 pl-2 border-l border-current/20">
          <span className="text-xs opacity-75">Avg</span>
          <span className="text-sm font-semibold">{avgTimeOutlier.toFixed(0)} นาที</span>
        </div>
      )}
    </div>
  )
}
