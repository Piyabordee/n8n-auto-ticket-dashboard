'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import MonthlyTicketList from './MonthlyTicketList'

interface Ticket {
  message_id: string
  subject: string
  assigned_to: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string | null
  assigned_date: string | null
  close_time_minute: number | null
  is_outlier?: number
}

interface TicketListModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number | null
  day?: string
  filterType: 'all' | 'pending' | 'closed' | 'outliers'
  title: string
  staffName?: string
}

const FILTER_LABELS: Record<string, string> = {
  all: 'ทั้งหมด',
  pending: 'ยังไม่ปิด',
  closed: 'ปิดแล้ว',
  outliers: 'Outliers'
}

const titleId = 'ticket-modal-title'
const descId = 'ticket-modal-desc'

export default function TicketListModal({
  isOpen,
  onClose,
  year,
  month,
  day,
  filterType,
  title,
  staffName
}: TicketListModalProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
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
      // Small delay to ensure DOM is ready before animation
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  // Focus trap implementation
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

  // Fetch tickets data
  useEffect(() => {
    if (!isOpen) return

    const fetchTickets = async () => {
      setLoading(true)
      setError(null)
      try {
        // Handle outliers filter type - use outliers API endpoint
        if (filterType === 'outliers') {
          const monthParam = month ? `&month=${month}` : ''
          const url = `/api/dashboard/outliers?year=${year}${monthParam}`
          const res = await fetch(url)

          if (!res.ok) {
            throw new Error(`Failed to fetch outliers: ${res.status}`)
          }

          const data = await res.json()

          // Convert OutlierTicket[] to Ticket[] format
          const outlierTickets: Ticket[] = (data.outliers || []).map((o: any) => ({
            message_id: o.message_id,
            subject: o.subject,
            assigned_to: o.assigned_to,
            status: 'closed', // Outliers are tickets that took too long to close
            category: '-',
            sub_category: '-',
            branch_name: '-',
            created_date: o.created_date,
            assigned_date: o.assigned_date,
            close_time_minute: o.diff_minutes,
            is_outlier: 1 // Mark as outlier for red styling
          }))
          setTickets(outlierTickets)
        } else {
          // Handle regular ticket filters
          const monthParam = month ? `&month=${month}` : ''
          const dayParam = day ? `&day=${day}` : ''
          const staffParam = staffName ? `&staff=${encodeURIComponent(staffName)}` : ''
          const url = `/api/dashboard/tickets?year=${year}${monthParam}${dayParam}&status=${filterType}${staffParam}`
          const res = await fetch(url)

          if (!res.ok) {
            throw new Error(`Failed to fetch tickets: ${res.status}`)
          }

          const data = await res.json()
          setTickets(data.tickets || [])
        }
      } catch (err) {
        console.error('Error fetching tickets:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [isOpen, year, month, day, filterType, staffName])

  // Handle click on backdrop
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  const titleText = staffName ? `${title} - ${staffName}` : title

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
        className="bg-white rounded-xl shadow-elevated max-w-full sm:max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-all duration-200"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
          transitionTimingFunction: 'var(--ease-out-quart)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base sm:text-xl font-semibold text-neutral-900 truncate">
              {titleText}
            </h2>
            <p id={descId} className="text-xs sm:text-sm text-neutral-500 mt-1">
              {day ? `${day} ` : ''}{FILTER_LABELS[filterType]} - {tickets.length} งาน
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:scale-110 active:scale-95 transition-transform duration-150"
            aria-label="ปิดหน้าต่าง"
            style={{
              transitionTimingFunction: 'var(--ease-out-quart)'
            }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : (
            <MonthlyTicketList tickets={tickets} loading={loading} />
          )}
        </div>
      </div>
    </div>
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
