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
}

interface TicketListModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number | null
  filterType: 'all' | 'pending' | 'closed'
  title: string
  staffName?: string
}

const FILTER_LABELS: Record<string, string> = {
  all: 'ทั้งหมด',
  pending: 'ยังไม่ปิด',
  closed: 'ปิดแล้ว'
}

export default function TicketListModal({
  isOpen,
  onClose,
  year,
  month,
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
        const monthParam = month ? `&month=${month}` : ''
        const staffParam = staffName ? `&staff=${encodeURIComponent(staffName)}` : ''
        const url = `/api/dashboard/tickets?year=${year}${monthParam}&status=${filterType}${staffParam}`
        const res = await fetch(url)
        const data = await res.json()
        setTickets(data.tickets || [])
      } catch (error) {
        console.error('Error fetching tickets:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [isOpen, year, month, filterType, staffName])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {FILTER_LABELS[filterType]} - {tickets.length} งาน
              {staffName && <span className="ml-2">• พนักงาน: {staffName}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <MonthlyTicketList tickets={tickets} loading={loading} />
        </div>
      </div>
    </div>
  )
}
