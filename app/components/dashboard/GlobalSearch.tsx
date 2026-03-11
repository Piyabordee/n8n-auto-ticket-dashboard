'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchResultsModal from './SearchResultsModal'

interface GlobalSearchProps {
  year: number
  month: number | null
}

interface SearchResult {
  message_id: string
  subject: string
  assigned_to: string
  status: string
  created_date: string | null
}

export default function GlobalSearch({ year, month }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Debounced search function
  const debounceRef = useRef<NodeJS.Timeout>()

  const searchTickets = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const monthParam = month ? `&month=${month}` : ''
      const response = await fetch(
        `/api/dashboard/tickets?year=${year}${monthParam}&status=all&search=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()
      // Show top 10 results for dropdown
      setResults((data.tickets || []).slice(0, 10))
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [year, month])

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout for debounced search (300ms)
    debounceRef.current = setTimeout(() => {
      searchTickets(value)
    }, 300)
  }

  // Handle search on Enter key - show all results in modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      setShowResults(false)
      setShowModal(true)
    }
  }

  // Handle result click
  const handleResultClick = (ticketId: string) => {
    setShowResults(false)
    setQuery('')
    // Could open ticket detail modal or navigate to ticket detail
    router.push(`/?year=${year}${month ? `&month=${month}` : ''}&ticketId=${ticketId}`)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Clear search
  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="ค้นหางาน... (หัวข้อ, พนักงาน, สาขา, ประเภท)"
          className="w-full pl-9 sm:pl-11 pr-8 sm:pr-10 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-gray-600">
              พบ {results.length} ผลลัพธ์ <span className="text-gray-400">(กด Enter เพื่อดูทั้งหมด)</span>
            </p>
          </div>
          {results.map((ticket) => (
            <button
              key={ticket.message_id}
              onClick={() => handleResultClick(ticket.message_id)}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {ticket.subject}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-600">{ticket.assigned_to}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {ticket.created_date ? new Date(ticket.created_date).toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                  }) : '-'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && query && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-4">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-1">🔍</div>
            <p className="text-sm">ไม่พบผลลัพธ์สำหรับ "{query}"</p>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      <SearchResultsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        year={year}
        month={month}
        searchQuery={query}
      />
    </div>
  )
}
