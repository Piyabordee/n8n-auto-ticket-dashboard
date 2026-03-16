'use client'

import { useState, useEffect, useRef } from 'react'
import type { StaffStats } from '@/types/outlier'

interface OutlierExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
}

// Utility function to format minutes into human-readable format
const formatMinutes = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null) return '-'
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

const titleId = 'outlier-modal-title'

export default function OutlierExplanationModal({
  isOpen,
  onClose,
  year
}: OutlierExplanationModalProps) {
  const [staffStats, setStaffStats] = useState<StaffStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Trigger entrance animation when modal opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  // Focus trap and accessibility
  useEffect(() => {
    if (!isOpen) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the close button when modal opens
    closeButtonRef.current?.focus()

    // Handle tab key to trap focus within modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      // If shift+tab on first element, move to last
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
      // If tab on last element, move to first
      else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleEscape)

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''

      // Restore focus to previous element
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dashboard/staff?year=${year}`)
        if (!res.ok) throw new Error('Failed to fetch data')
        const data = await res.json()
        setStaffStats(data.staff || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, year])

  // Handle click on backdrop
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 transition-opacity duration-150 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-elevated max-w-full sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
          transitionTimingFunction: 'var(--ease-out-quart)',
          transitionDuration: '200ms'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 id={titleId} className="text-lg sm:text-xl font-semibold text-neutral-900 truncate">
              คำอธิบายวิธีคำนวณ Outlier (Median + 15×MAD)
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:scale-110 active:scale-95 transition-transform duration-150"
            style={{
              transitionTimingFunction: 'var(--ease-out-quart)'
            }}
            aria-label="ปิดหน้าต่าง"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <>
              <ELI5Section />
              <TechnicalSection />
              <StaffDataTable staffStats={staffStats} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ELI5Section() {
  return (
    <section className="bg-info-50 border border-info-200 rounded-lg p-4" aria-labelledby="eli5-title">
      <h3 id="eli5-title" className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Outlier คืออะไร? (ELI5)
      </h3>
      <div className="space-y-3 text-sm sm:text-base text-neutral-700">
        <p>
          Outlier คือ <strong>"งานที่ใช้เวลานานผิดปกติ"</strong> เมื่อเปรียบเทียบกับเวลาที่ตัวเองปกติทำ
        </p>
        <div className="bg-white rounded p-3 border border-info-100">
          <p className="font-medium mb-2">ตัวอย่าง:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>คุณ A ปกติปิดงาน 1-2 ชม. → งาน 3 วัน = Outlier</li>
            <li>คุณ B ปกติปิดงาน 2-3 วัน → งาน 1 สัปดาห์ = Outlier</li>
          </ul>
        </div>
        <p className="italic text-neutral-600">
          ทุกคนมีเกณฑ์ของตัวเอง เพราะงานแต่ละประเภทต่างกัน!
        </p>
      </div>
    </section>
  )
}

function TechnicalSection() {
  return (
    <section className="bg-warning-50 border border-warning-200 rounded-lg p-4" aria-labelledby="technical-title">
      <h3 id="technical-title" className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        วิธีคำนวณ (Technical)
      </h3>
      <div className="space-y-3 text-sm sm:text-base text-neutral-700">
        <div>
          <p className="font-medium mb-1">Step 1: หาค่ามัธยฐาน (Median) ของเวลาปิดงานทั้งปี</p>
          <p className="font-medium mb-1">Step 2: หาค่า MAD (Median Absolute Deviation)</p>
          <p className="font-medium">Step 3: Threshold = Median + (15 × MAD)</p>
        </div>

        <div className="bg-white rounded p-3 border border-warning-100">
          <p className="font-medium mb-1">สูตร MAD:</p>
          <code className="block bg-neutral-100 px-3 py-2 rounded text-sm font-mono" tabIndex={0}>
            MAD = Median(|Xi - Median|)
          </code>
        </div>

        <div>
          <p className="font-medium mb-2">ทำไมใช้ 15×MAD?</p>
          <ul className="space-y-1 list-disc list-inside text-sm">
            <li>MAD ทนทานต่อค่าผิดปกติ (robust)</li>
            <li>15× เป็นค่าที่เหมาะสมจากการทดลองกับข้อมูลจริง</li>
            <li>ระบุเฉพาะงานที่ผิดปกติ "จริงๆ" เท่านั้น</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function StaffDataTable({ staffStats }: { staffStats: StaffStats[] }) {
  return (
    <section className="bg-success-50 border border-success-200 rounded-lg p-4" aria-labelledby="staff-data-title">
      <h3 id="staff-data-title" className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        ข้อมูลเฉพาะบุคคล (Per-Person Stats)
      </h3>

      {staffStats.length === 0 ? (
        <p className="text-neutral-600 text-center py-4">ไม่มีข้อมูลพนักงาน</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden" role="table" aria-label="ข้อมูลสถิติรายบุคคล">
              <thead className="bg-success-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-neutral-900" scope="col">Staff</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-neutral-900" scope="col">Median</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-neutral-900" scope="col">MAD</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-neutral-900" scope="col">Threshold</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-neutral-900" scope="col">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {staffStats.map((staff) => (
                  <tr key={staff.name} className="hover:bg-neutral-50 transition-colors duration-150">
                    <td className="px-4 py-2 text-sm text-neutral-900">{staff.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-neutral-700">
                      {formatMinutes(staff.personalMedian)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-neutral-700">
                      {formatMinutes(staff.personalMAD)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-warning">
                      {formatMinutes(staff.personalThreshold)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-error">
                      {staff.outlierCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {staffStats.map((staff) => (
              <div key={staff.name} className="bg-white rounded-lg p-3 border border-success-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-900">{staff.name}</span>
                  <span className="text-sm font-semibold text-error">
                    Outliers: {staff.outlierCount}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500">Median</span>
                    <p className="text-neutral-900">{formatMinutes(staff.personalMedian)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">MAD</span>
                    <p className="text-neutral-900">{formatMinutes(staff.personalMAD)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Threshold</span>
                    <p className="text-warning font-medium">
                      {formatMinutes(staff.personalThreshold)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8" role="alert" aria-live="polite">
      <svg className="w-12 h-12 mx-auto mb-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-error font-medium mb-2">ไม่สามารถโหลดข้อมูลได้</p>
      <p className="text-neutral-600 text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:scale-105 active:scale-95 transition-transform duration-150"
        style={{
          transitionTimingFunction: 'var(--ease-out-quart)'
        }}
      >
        ลองใหม่
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="text-center py-8" role="status" aria-live="polite">
      <svg className="w-12 h-12 mx-auto mb-4 text-neutral-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <p className="text-neutral-600">กำลังโหลดข้อมูล...</p>
    </div>
  )
}
