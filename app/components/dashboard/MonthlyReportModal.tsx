'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ReportSectionItem {
  id: string
  name: string
  count: number
}

interface ReportData {
  year: number
  month: number
  monthNameThai: string
  monthNameEnglish: string
  totalTickets: number
  section1: ReportSectionItem[]
  section2: ReportSectionItem[]
  section3: ReportSectionItem[]
  section4: ReportSectionItem[]
  totals: {
    section1: number
    section2: number
    section3: number
    section4: number
  }
}

interface MonthlyReportModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number
}

const titleId = 'report-modal-title'
const descId = 'report-modal-desc'

// Chart colors - matching the reference images
const CHART_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#22c55e', // green
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
]

export default function MonthlyReportModal({
  isOpen,
  onClose,
  year,
  month
}: MonthlyReportModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const reportContentRef = useRef<HTMLDivElement>(null)

  // Trigger entrance animation
  useEffect(() => {
    if (isOpen) {
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

    previousActiveElement.current = document.activeElement as HTMLElement
    closeButtonRef.current?.focus()

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

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose])

  // Fetch report data
  useEffect(() => {
    if (!isOpen) return

    const fetchReportData = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `/api/dashboard/report?year=${year}&month=${month}`
        const res = await fetch(url)

        if (!res.ok) {
          throw new Error(`Failed to fetch report data: ${res.status}`)
        }

        const data = await res.json()
        setReportData(data)
      } catch (err) {
        console.error('Error fetching report data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setReportData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [isOpen, year, month])

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [onClose])

  // Handle PDF export using browser's print functionality
  const handleExportPDF = useCallback(async () => {
    if (!reportContentRef.current || isExporting) return

    setIsExporting(true)

    try {
      // Create print-specific styles
      const printStyles = document.createElement('style')
      printStyles.textContent = `
        @media print {
          body * { visibility: hidden; }
          #monthly-report-content, #monthly-report-content * { visibility: visible; }
          #monthly-report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .report-page { page-break-after: always; }
          .report-page:last-child { page-break-after: auto; }
          .no-print { display: none !important; }
        }
      `
      document.head.appendChild(printStyles)

      // Add ID to content for print targeting
      reportContentRef.current.id = 'monthly-report-content'

      // Print
      window.print()

      // Cleanup
      setTimeout(() => {
        document.head.removeChild(printStyles)
        if (reportContentRef.current) {
          reportContentRef.current.id = ''
        }
      }, 1000)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }, [isExporting])

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
        className="bg-white rounded-xl shadow-elevated max-w-full sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-all duration-200"
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex items-center justify-between gap-2 no-print">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base sm:text-xl font-semibold text-neutral-900 truncate">
              รายงานประจำเดือน{reportData?.monthNameThai || ''} {year}
            </h2>
            <p id={descId} className="text-xs sm:text-sm text-neutral-500 mt-1">
              สรุปปริมาณงานและการแจกแจงตามหมวดหมู่
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              disabled={loading || !reportData || isExporting}
              className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-1.5"
              aria-label="Export to PDF"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden sm:inline">กำลัง Export...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Export PDF</span>
                </>
              )}
            </button>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="ปิดหน้าต่าง"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={reportContentRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6"
        >
          {error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : loading ? (
            <LoadingState />
          ) : reportData ? (
            <ReportContent data={reportData} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ReportContent({ data }: { data: ReportData }) {
  const posRateCount = data.section3.find(s => s.id === 'pos_rate_error')?.count || 0

  return (
    <div className="space-y-6">
      {/* Section 1: Overall Ticket Summary */}
      <ReportPage
        title={`Ticket ${data.monthNameEnglish} ${data.year}`}
        subtitle="ส่วนที่ 1: ภาพรวม Ticket ทั้งหมด"
      >
        <PieChartSection
          title="Category"
          data={data.section1}
          total={data.totals.section1}
        />
      </ReportPage>

      {/* Section 2: Software Deep Dive */}
      <ReportPage
        title={`Software ${data.totals.section2} Tickets`}
        subtitle="ส่วนที่ 2: เจาะลึกหมวด Software"
      >
        <PieChartSection
          title="Software"
          data={data.section2}
          total={data.totals.section2}
        />
      </ReportPage>

      {/* Section 3: Software Problem Grouping */}
      <ReportPage
        title={`Software ${data.totals.section3} Tickets`}
        subtitle="ส่วนที่ 3: การจัดกลุ่มปัญหา Software"
      >
        <PieChartSection
          title="Sub Services"
          data={data.section3}
          total={data.totals.section3}
        />
      </ReportPage>

      {/* Section 4: Causes of POS/RATE Error */}
      <ReportPage
        title={`POS/RATE Error ${posRateCount} Tickets`}
        subtitle="ส่วนที่ 4: สาเหตุของ POS/RATE Error"
      >
        <PieChartSection
          title="Causes"
          data={data.section4}
          total={data.totals.section4}
        />
      </ReportPage>
    </div>
  )
}

interface PieChartSectionProps {
  title: string
  data: Array<{ id: string; name: string; count: number }>
  total: number
}

function PieChartSection({ title, data, total }: PieChartSectionProps) {
  const chartData = data
    .filter(item => item.count > 0)
    .map((item, index) => ({
      name: item.name,
      value: item.count,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Pie Chart */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">
            {title}
          </h3>
          <div className="text-3xl font-bold text-neutral-900 text-center mb-4">
            {total} Tickets
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-neutral-400">
              ไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* Legend and Table */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {title}
          </h3>

          {/* Legend */}
          <div className="space-y-2 mb-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-neutral-700 flex-1 truncate">
                  {item.name}
                </span>
                <span className="text-sm font-medium text-neutral-900">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-300">
                <th className="text-left py-2 px-2 font-semibold text-neutral-900">No</th>
                <th className="text-left py-2 px-2 font-semibold text-neutral-900">{title}</th>
                <th className="text-right py-2 px-2 font-semibold text-neutral-900">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(item => item.count > 0).map((item, index) => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="py-2 px-2 text-neutral-700">{index + 1}</td>
                  <td className="py-2 px-2 text-neutral-900">{item.name}</td>
                  <td className="py-2 px-2 text-neutral-900 text-right">{item.count}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-neutral-300 font-semibold">
                <td className="py-2 px-2 text-neutral-900" colSpan={2}>Grand Total</td>
                <td className="py-2 px-2 text-neutral-900 text-right">{total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReportPage({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="report-page bg-white p-4 sm:p-6 rounded-lg border border-neutral-200">
      <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1 text-center">
        {title}
      </h2>
      <p className="text-sm sm:text-base text-neutral-600 mb-6 text-center">
        {subtitle}
      </p>
      {children}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <div className="text-center">
        <svg className="animate-spin w-12 h-12 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-neutral-600">กำลังโหลดข้อมูลรายงาน...</p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8" role="alert" aria-live="polite">
      <svg className="w-12 h-12 mx-auto mb-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-error font-medium mb-2">ไม่สามารถโหลดข้อมูลได้</p>
      <p className="text-neutral-600 text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        ลองใหม่
      </button>
    </div>
  )
}
