'use client'

import { useEffect, useState } from 'react'
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

interface SearchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number | null
  searchQuery: string
}

export default function SearchResultsModal({
  isOpen,
  onClose,
  year,
  month,
  searchQuery
}: SearchResultsModalProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !searchQuery.trim()) return

    const fetchResults = async () => {
      setLoading(true)
      try {
        const monthParam = month ? `&month=${month}` : ''
        const response = await fetch(
          `/api/dashboard/tickets?year=${year}${monthParam}&status=all&search=${encodeURIComponent(searchQuery)}`
        )
        const data = await response.json()
        setTickets(data.tickets || [])
      } catch (error) {
        console.error('Search results error:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [isOpen, year, month, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">
              ผลการค้นหา: "{searchQuery}"
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              พบ {tickets.length} ผลลัพธ์
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
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
