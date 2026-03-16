'use client'

import { useState, useEffect, useRef, type KeyboardEvent } from 'react'

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

// Count-up animation hook for smooth number transitions
function useCountUp(endValue: number, duration: number = 800, isEnabled: boolean = true) {
  const [count, setCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const requestRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (!isEnabled || endValue === 0) {
      setCount(endValue)
      return
    }

    setIsAnimating(true)

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out-expo) for natural deceleration
      const easeOutExpo = (t: number): number => {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      }

      const easedProgress = easeOutExpo(progress)
      const currentCount = Math.round(easedProgress * endValue)

      setCount(currentCount)

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [endValue, duration, isEnabled])

  return { count, isAnimating }
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

  // Count-up animations for stats
  const totalAnim = useCountUp(total, 800)
  const closedAnim = useCountUp(closed, 800)
  const pendingAnim = useCountUp(pending, 800)
  const outlierAnim = useCountUp(outlierCount || 0, 800)

  // Keyboard handler for clickable cards
  const handleKeyDown = (filterType: FilterType) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onCardClick?.(filterType)
    }
  }

  // Generate ARIA labels for cards
  const getCardAriaLabel = (filterType: FilterType): string => {
    switch (filterType) {
      case 'pending':
        return `งานยังไม่ปิด จำนวน ${pending} งาน คลิกเพื่อดูรายการ`
      case 'all':
        return `จำนวนงานทั้งหมด ${total} งาน คลิกเพื่อดูรายการ`
      case 'outlier-explanation':
        return `เวลาเฉลี่ย ปกติ ${avgTimeNormal > 0 ? formatMinutes(Math.round(avgTimeNormal)) : '-'} Outlier ${avgTimeOutlier > 0 ? formatMinutes(Math.round(avgTimeOutlier)) : '-'} คลิกเพื่อดูคำอธิบาย`
      case 'outliers':
        return `งาน Outliers จำนวน ${outlierCount || 0} งาน คลิกเพื่อดูรายการ`
      default:
        return ''
    }
  }

  return (
    <div className={`grid gap-3 mb-6 ${hasOutlierData ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
      {/* Pending Tickets */}
      <InteractiveCard
        onClick={() => onCardClick?.('pending')}
        onKeyDown={handleKeyDown('pending')}
        ariaLabel={getCardAriaLabel('pending')}
        isClickable={!!onCardClick}
        className="border-l-error animate-on-mount animate-slide-up-fade animate-delay-0"
      >
        <div className="text-xs sm:text-sm text-neutral-600 mb-1">ยังไม่ปิด</div>
        <div className="text-2xl sm:text-3xl font-bold text-error">{pendingAnim.count}</div>
        <div className="text-xs text-neutral-500 mt-1">Tickets</div>
      </InteractiveCard>

      {/* Total Tickets */}
      <InteractiveCard
        onClick={() => onCardClick?.('all')}
        onKeyDown={handleKeyDown('all')}
        ariaLabel={getCardAriaLabel('all')}
        isClickable={!!onCardClick}
        className="border-l-primary animate-on-mount animate-slide-up-fade animate-delay-1"
      >
        <div className="text-xs sm:text-sm text-neutral-600 mb-1">จำนวนงานทั้งหมด</div>
        <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{totalAnim.count}</div>
        <div className="text-xs text-neutral-500 mt-1">Tickets</div>
      </InteractiveCard>

      {/* Close Rate - not clickable */}
      <div className="card border-l-amber p-4 relative animate-on-mount animate-slide-up-fade animate-delay-2">
        <div className="text-xs sm:text-sm text-neutral-600 mb-1">อัตราการปิดงาน</div>
        <div className="text-2xl sm:text-3xl font-bold text-amber-600">{closeRate}%</div>
        <div className="text-xs text-neutral-500 mt-1">Closed / Total</div>
      </div>

      {/* Avg Resolution Time - Normal vs Outlier breakdown - clickable for explanation */}
      <InteractiveCard
        onClick={() => hasOutlierData && onCardClick?.('outlier-explanation')}
        onKeyDown={handleKeyDown('outlier-explanation')}
        ariaLabel={getCardAriaLabel('outlier-explanation')}
        isClickable={hasOutlierData && !!onCardClick}
        className="border-l-warning animate-on-mount animate-slide-up-fade animate-delay-3"
      >
        {hasOutlierData ? (
          <>
            <div className="text-xs sm:text-sm text-neutral-600 mb-1">
              เวลาเฉลี่ย (<span className="text-success-600 font-medium">ปกติ</span> / <span className="text-error font-medium">Outlier</span>)
            </div>
            <div className="text-base sm:text-lg font-bold flex flex-col gap-0.5">
              <span className="text-success-600">{avgTimeNormal > 0 ? formatMinutes(Math.round(avgTimeNormal)) : '-'}</span>
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
      </InteractiveCard>

      {/* Outlier Count (only show when outlier data exists) */}
      {hasOutlierData && (
        <InteractiveCard
          onClick={() => onCardClick?.('outliers')}
          onKeyDown={handleKeyDown('outliers')}
          ariaLabel={getCardAriaLabel('outliers')}
          isClickable={!!onCardClick}
          className={`border-l-4 transition-all duration-300 animate-on-mount animate-slide-up-fade animate-delay-4 ${
            (outlierCount || 0) === 0 ? 'border-l-neutral-300' :
            (outlierCount || 0) <= 3 ? 'border-l-warning-400' :
            (outlierCount || 0) <= 7 ? 'border-l-error-400' :
            'border-l-error'
          }`}
        >
          <div className="text-xs sm:text-sm text-neutral-600 mb-1">Outliers</div>
          <div className={`text-2xl sm:text-3xl font-bold ${
            (outlierCount || 0) === 0 ? 'text-neutral-500' :
            (outlierCount || 0) <= 3 ? 'text-warning' :
            (outlierCount || 0) <= 7 ? 'text-error-500' :
            'text-error'
          }`}>
            {outlierAnim.count}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Tickets</div>
        </InteractiveCard>
      )}
    </div>
  )
}

// Helper component for interactive cards with proper keyboard support
interface InteractiveCardProps {
  children: React.ReactNode
  onClick?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
  ariaLabel: string
  isClickable: boolean
  className?: string
}

function InteractiveCard({
  children,
  onClick,
  onKeyDown,
  ariaLabel,
  isClickable,
  className = ''
}: InteractiveCardProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleMouseDown = () => {
    if (isClickable) {
      setIsPressed(true)
    }
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  const handleMouseLeave = () => {
    setIsPressed(false)
  }

  if (!isClickable) {
    return (
      <div className={`card border-l-4 p-4 relative ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`card border-l-4 p-4 relative cursor-pointer hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 ${className} ${
        isPressed ? 'scale-[0.98]' : 'hover:scale-[1.02]'
      }`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      style={{
        transitionProperty: 'transform, box-shadow, opacity',
        transitionTimingFunction: 'var(--ease-out-quart)',
        transitionDuration: '200ms'
      }}
    >
      {children}
    </div>
  )
}
