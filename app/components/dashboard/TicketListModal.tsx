'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (!isOpen) return

    const fetchTickets = async () => {
      setLoading(true)
      try {
        // Handle outliers filter type - use outliers API endpoint
        if (filterType === 'outliers') {
          const monthParam = month ? `&month=${month}` : ''
          const url = `/api/dashboard/outliers?year=${year}${monthParam}`
          const res = await fetch(url)
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
          const data = await res.json()
          setTickets(data.tickets || [])
        }
      } catch (error) {
        console.error('Error fetching tickets:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [isOpen, year, month, day, filterType, staffName])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-elevated max-w-full sm:max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-neutral-900 truncate">{title}</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              {day ? `${day} ` : ''}{FILTER_LABELS[filterType]} - {tickets.length} งาน
              {staffName && <span className="ml-1 sm:ml-2">• พนักงาน: {staffName}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <MonthlyTicketList tickets={tickets} loading={loading} />
        </div>
      </div>
    </div>
  )
}
