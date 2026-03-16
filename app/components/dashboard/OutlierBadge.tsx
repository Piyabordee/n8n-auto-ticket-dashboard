'use client'

interface OutlierBadgeProps {
  count: number
  avgTimeOutlier: number
  onClick?: () => void
}

export default function OutlierBadge({ count, avgTimeOutlier, onClick }: OutlierBadgeProps) {
  // Color coding based on severity
  const getColorClass = () => {
    if (count === 0) return 'bg-neutral-50 text-neutral-600 border-neutral-200'
    if (count <= 3) return 'bg-warning-50 text-warning-700 border-warning-200'
    if (count <= 7) return 'bg-error-50 text-error-600 border-error-200'
    return 'bg-error-50 text-error-700 border-error-300'
  }

  const getIcon = () => {
    if (count === 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    if (count <= 3) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
    if (count <= 7) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
      </svg>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:shadow-subtle transition-all ${getColorClass()}`}
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
