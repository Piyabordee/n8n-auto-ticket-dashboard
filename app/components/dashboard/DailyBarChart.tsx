'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MonthlyTicketList from './MonthlyTicketList'

interface DailyData {
  day: string
  total: number
  closed: number
}

interface StaffData {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  totalPending: number
  avgTimeAll: number
}

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

interface DailyBarChartProps {
  data: DailyData[]
  monthName: string
  year: number
  monthIndex?: number
  staffData: StaffData[]
  onClose: () => void
  loading?: boolean
  onDayClick?: (day: string) => void
  onStaffClick?: (staffName: string) => void
  onStatClick?: (staffName: string, filterType: 'all' | 'pending' | 'closed') => void
}

export default function DailyBarChart({ data, monthName, year, monthIndex, staffData, onClose, loading, onDayClick, onStaffClick, onStatClick }: DailyBarChartProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [showTickets, setShowTickets] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Trigger entrance animation when modal opens
  useEffect(() => {
    if (monthIndex !== undefined) {
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
    }
  }, [monthIndex])

  // Focus trap and accessibility
  useEffect(() => {
    if (!monthIndex) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the close button when modal opens
    setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)

    // Handle tab key to trap focus within modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
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

    document.addEventListener('keydown', handleKeyDown)

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''

      // Restore focus to previous element
      previousActiveElement.current?.focus()
    }
  }, [monthIndex, onClose])

  // Fetch monthly tickets when modal opens
  useEffect(() => {
    if (monthIndex !== undefined) {
      const fetchTickets = async () => {
        setTicketsLoading(true)
        try {
          const res = await fetch(`/api/dashboard/monthly-tickets?year=${year}&month=${monthIndex}`)
          const data = await res.json()
          setTickets(data.tickets || [])
        } catch (error) {
          console.error('Error fetching monthly tickets:', error)
        } finally {
          setTicketsLoading(false)
        }
      }

      fetchTickets()
    }
  }, [year, monthIndex])

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-100 text-amber-800'
    if (rank === 2) return 'bg-neutral-100 text-neutral-600'
    if (rank === 3) return 'bg-warning-100 text-warning-800'
    return 'bg-neutral-50 text-neutral-600'
  }

  const getRankIcon = (rank: number) => {
    return `${rank}`
  }

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

  // Transform data to add pending count for stacked bar chart
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      pending: d.total - d.closed
    }))
  }, [data])

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 transition-opacity duration-150 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-elevated max-w-full sm:max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
          transitionTimingFunction: 'var(--ease-out-quart)',
          transitionDuration: '200ms'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`daily-modal-title-${monthIndex}`}
        aria-describedby={`daily-modal-desc-${monthIndex}`}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between bg-amber-500 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 id={`daily-modal-title-${monthIndex}`} className="text-base sm:text-xl font-semibold text-white truncate">
              รายละเอียดประจำเดือน - {monthName} {year + 543}
            </h2>
            <p id={`daily-modal-desc-${monthIndex}`} className="text-xs sm:text-sm text-white/90">
              กราฟรายวัน ผลงานทีม และรายการงานทั้งหมด
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-white hover:text-white/80 p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-amber-500 hover:scale-110 active:scale-95 transition-transform duration-150"
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              {/* Daily Chart Section */}
              <div className={`p-4 sm:p-6 border-b border-neutral-200 ${onDayClick ? 'cursor-pointer' : ''}`}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900">กราฟรายวัน</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 75)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: 'oklch(0.45 0.032 75)' }}
                      label={{ value: 'วัน', position: 'insideBottom', offset: -5, fill: 'oklch(0.45 0.032 75)' }}
                    />
                    <YAxis label={{ value: 'จำนวน', angle: -90, position: 'insideLeft', fill: 'oklch(0.45 0.032 75)' }} tick={{ fill: 'oklch(0.45 0.032 75)' }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="closed"
                      fill="oklch(0.55 0.080 260)"
                      name="ปิดแล้ว"
                      stackId="1"
                      cursor="pointer"
                      onClick={(data) => onDayClick?.(data.payload?.day)}
                    />
                    <Bar
                      dataKey="pending"
                      fill="oklch(0.52 0.125 25)"
                      name="ยังไม่ปิด"
                      stackId="1"
                      cursor="pointer"
                      onClick={(data) => onDayClick?.(data.payload?.day)}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Daily Summary */}
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-primary-50 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {data.reduce((sum, d) => sum + d.total, 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">ทั้งหมด</div>
                  </div>
                  <div className="bg-success-50 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold text-success">
                      {data.reduce((sum, d) => sum + d.closed, 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">ปิดแล้ว</div>
                  </div>
                  <div className="bg-warning-50 rounded-lg p-2 sm:p-3">
                    <div className="text-xl sm:text-2xl font-bold text-warning">
                      {data.reduce((sum, d) => sum + d.total - d.closed, 0)}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-600">รอดำเนินการ</div>
                  </div>
                </div>
              </div>

              {/* Staff Performance Section */}
              <div className="p-4 sm:p-6 border-b border-neutral-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-neutral-900">ผลงานทีม (Staff Performance)</h3>
                </div>

                {staffData.length > 0 ? (
                  <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">อันดับ</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ชื่อพนักงาน</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase">รับงาน</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase">ยังไม่ปิด</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase">ปิดแล้ว</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase">เวลาเฉลี่ย</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {staffData.map((person) => (
                            <tr key={person.name} className="hover:bg-neutral-50 transition-colors duration-150">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`badge ${getRankBadge(person.rank)}`}>
                                  {getRankIcon(person.rank)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                {onStaffClick ? (
                                  <button
                                    onClick={() => onStaffClick(person.name)}
                                    className="text-primary hover:text-primary-700 hover:underline transition-all duration-150"
                                    title={`ดูงานทั้งหมดของ ${person.name}`}
                                    style={{
                                      transitionTimingFunction: 'var(--ease-out-quart)'
                                    }}
                                  >
                                    {person.name}
                                  </button>
                                ) : (
                                  <span className="text-neutral-900">{person.name}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                {onStatClick ? (
                                  <button
                                    onClick={() => onStatClick(person.name, 'all')}
                                    className="text-primary hover:text-primary-700 hover:underline cursor-pointer font-medium transition-all duration-150"
                                    title={`ดูงานทั้งหมดของ ${person.name}`}
                                    style={{
                                      transitionTimingFunction: 'var(--ease-out-quart)'
                                    }}
                                  >
                                    {person.totalAssigned}
                                  </button>
                                ) : (
                                  <span className="text-neutral-900">{person.totalAssigned}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                {onStatClick ? (
                                  <button
                                    onClick={() => onStatClick(person.name, 'pending')}
                                    className="text-error hover:text-error-700 hover:underline cursor-pointer font-semibold transition-all duration-150"
                                    title={`ดูงานที่ยังไม่ปิดของ ${person.name}`}
                                    style={{
                                      transitionTimingFunction: 'var(--ease-out-quart)'
                                    }}
                                  >
                                    {person.totalPending}
                                  </button>
                                ) : (
                                  <span className="text-error font-semibold">{person.totalPending}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                {onStatClick ? (
                                  <button
                                    onClick={() => onStatClick(person.name, 'closed')}
                                    className="text-success hover:text-success-700 hover:underline cursor-pointer font-semibold transition-all duration-150"
                                    title={`ดูงานที่ปิดแล้วของ ${person.name}`}
                                    style={{
                                      transitionTimingFunction: 'var(--ease-out-quart)'
                                    }}
                                  >
                                    {person.totalClosed}
                                  </button>
                                ) : (
                                  <span className="text-success font-semibold">{person.totalClosed}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 text-center">
                                {person.avgTimeAll > 0 ? formatMinutes(Math.round(person.avgTimeAll)) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 py-8">ไม่มีข้อมูลผลงานทีมในเดือนนี้</div>
                )}
              </div>

              {/* Monthly Tickets Section */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-semibold text-neutral-900">รายการงานทั้งหมด</h3>
                  </div>
                  <button
                    onClick={() => setShowTickets(!showTickets)}
                    className="text-sm text-primary hover:text-primary-700 font-medium flex items-center gap-1 transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      transitionTimingFunction: 'var(--ease-out-quart)'
                    }}
                  >
                    {showTickets ? 'ซ่อน' : 'แสดง'}
                    <svg className={`w-4 h-4 transition-transform duration-300 ${showTickets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showTickets && (
                  <MonthlyTicketList tickets={tickets} loading={ticketsLoading} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
