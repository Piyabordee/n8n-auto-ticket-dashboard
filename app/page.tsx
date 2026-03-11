'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderFilter from './components/dashboard/HeaderFilter'
import StatsCards from './components/dashboard/StatsCards'
import MonthlyBarChart from './components/dashboard/MonthlyBarChart'
import StaffPerformanceTable from './components/dashboard/StaffPerformanceTable'
import DailyBarChart from './components/dashboard/DailyBarChart'
import InlineDailyChart from './components/dashboard/InlineDailyChart'
import TopOutliersList from './components/dashboard/TopOutliersList'
import TicketListModal from './components/dashboard/TicketListModal'
import OutlierExplanationModal from './components/dashboard/OutlierExplanationModal'
import GlobalSearch from './components/dashboard/GlobalSearch'
import { useModal } from './components/modals/ModalProvider'
import type { OutlierTicket } from '../types/outlier'

type TicketFilterType = 'all' | 'pending' | 'closed' | 'outliers'
type FilterType = TicketFilterType | 'outlier-explanation'

interface DashboardStats {
  total: number
  closed: number
  closeRate: number
  avgTime: number
  pending: number
}

interface MonthlyData {
  month: string
  total: number
  closed: number
  monthIndex?: number
}

interface StaffData {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  totalPending: number
  avgTimeAll: number
  avgTimeNormal?: number
  avgTimeOutlier?: number
  outlierCount?: number
}

interface OutlierSummaryStats {
  totalOutliers: number
  avgTimeAll: number
  avgTimeNormal: number
  avgTimeOutlier: number
  outlierThreshold: number
}

interface StaffApiResponse {
  staff: StaffData[]
  summary: OutlierSummaryStats
}

interface DailyData {
  day: string
  total: number
  closed: number
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

const FILTER_TITLES: Record<FilterType, string> = {
  all: 'รายการงานทั้งหมด',
  pending: 'รายการงานที่ยังไม่ปิด',
  closed: 'รายการงานที่ปิดแล้ว',
  outliers: 'รายการงาน Outliers',
  'outlier-explanation': 'คำอธิบายวิธีคำนวณ Outlier'
}

const getFilterTypeLabel = (filterType: FilterType): string => {
  switch (filterType) {
    case 'all': return 'ทั้งหมด'
    case 'pending': return 'ที่ยังไม่ปิด'
    case 'closed': return 'ที่ปิดแล้ว'
    case 'outliers': return 'Outliers'
    case 'outlier-explanation': return 'คำอธิบาย'
    default: return ''
  }
}

export default function TeamDashboard() {
  const router = useRouter()
  // Filter states - default to year that has data
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState<number | null>(null)

  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    closed: 0,
    closeRate: 0,
    avgTime: 0,
    pending: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [staffData, setStaffData] = useState<StaffData[]>([])
  const [outlierSummary, setOutlierSummary] = useState<OutlierSummaryStats | null>(null)
  const [topOutliers, setTopOutliers] = useState<OutlierTicket[]>([])

  // Modal states
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedMonthName, setSelectedMonthName] = useState<string>('')
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [monthlyStaffData, setMonthlyStaffData] = useState<StaffData[]>([])
  const [loadingModal, setLoadingModal] = useState(false)

  // Ticket list modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketFilterType, setTicketFilterType] = useState<TicketFilterType>('all')

  // Staff tickets modal state
  const [staffTicketModalOpen, setStaffTicketModalOpen] = useState(false)
  const [selectedStaffName, setSelectedStaffName] = useState<string>('')

  // Monthly modal staff tickets state
  const [monthlyStaffTicketModalOpen, setMonthlyStaffTicketModalOpen] = useState(false)
  const [monthlySelectedStaffName, setMonthlySelectedStaffName] = useState<string>('')
  const [monthlyFilterType, setMonthlyFilterType] = useState<TicketFilterType>('all')

  // Outlier explanation modal state
  const [outlierExplanationOpen, setOutlierExplanationOpen] = useState(false)

  // Day click state
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true)
  const [outliersLoading, setOutliersLoading] = useState(false)

  // Modal hooks
  const { openModal, closeModal } = useModal()

  // Available months state
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<{ year: number; month: number; count: number }[]>([])

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      // Only show loading screen on initial load
      if (initialLoading) {
        setInitialLoading(true)
      }
      try {
        // Build query params
        const monthParam = month ? `&month=${month}` : ''
        const yearParam = `year=${year}`

        // Fetch stats
        const statsRes = await fetch(`/api/dashboard/stats?${yearParam}${monthParam}`)
        const statsData = await statsRes.json()
        setStats(statsData)

        // Fetch monthly data (always for the selected year)
        const monthlyRes = await fetch(`/api/dashboard/monthly?${yearParam}`)
        const monthlyData = await monthlyRes.json()
        // Add monthIndex to each entry for click handling
        const monthlyWithIndex = (monthlyData.data || []).map((d: MonthlyData, index: number) => ({
          ...d,
          monthIndex: index
        }))
        setMonthlyData(monthlyWithIndex)

        // Fetch staff performance with outlier stats
        const staffRes = await fetch(`/api/dashboard/staff?${yearParam}${monthParam}`)
        const staffResponse: StaffApiResponse = await staffRes.json()
        setStaffData(staffResponse.staff)
        setOutlierSummary(staffResponse.summary)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchData()
  }, [year, month])

  // Fetch available years and months
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const res = await fetch('/api/dashboard/available-months')
        const data = await res.json()
        setAvailableYears(data.years || [])
        setAvailableMonths(data.months || [])
      } catch (error) {
        console.error('Error fetching available months:', error)
      }
    }

    fetchAvailableMonths()
  }, [])

  // Reset selected day when year or month changes
  useEffect(() => {
    setSelectedDay(null)
  }, [year, month])

  // Fetch top 3 outliers
  useEffect(() => {
    const fetchTopOutliers = async () => {
      setOutliersLoading(true)
      try {
        const monthParam = month ? `&month=${month}` : ''
        const res = await fetch(`/api/dashboard/outliers/top3?year=${year}${monthParam}`)
        const data = await res.json()
        setTopOutliers(data.top3 || [])
      } catch (error) {
        console.error('Error fetching top outliers:', error)
      } finally {
        setOutliersLoading(false)
      }
    }

    fetchTopOutliers()
  }, [year, month])

  // Handle stat card click - open ticket list modal or outlier explanation
  const handleStatCardClick = (filterType: FilterType) => {
    if (filterType === 'outlier-explanation') {
      setOutlierExplanationOpen(true)
    } else {
      setTicketFilterType(filterType)
      setTicketModalOpen(true)
    }
  }

  // Handle staff name click - open modal with all tickets for that staff
  const handleStaffClick = (staffName: string) => {
    setSelectedStaffName(staffName)
    setTicketFilterType('all')  // Reset to 'all' to show all tickets
    setStaffTicketModalOpen(true)
  }

  // Handle stat click from main staff table - open modal with filtered tickets
  const handleStatClick = (staffName: string, filterType: 'all' | 'pending' | 'closed') => {
    setSelectedStaffName(staffName)
    setTicketFilterType(filterType)
    setTicketModalOpen(true)
  }

  // Handle staff name click from monthly modal - open modal with all tickets for that staff in the selected month
  const handleStaffClickFromModal = (staffName: string) => {
    setMonthlySelectedStaffName(staffName)
    setMonthlyFilterType('all')  // Reset to 'all' to show all tickets
    setMonthlyStaffTicketModalOpen(true)
  }

  // Handle stat click from monthly modal - open modal with filtered tickets
  const handleStatClickFromModal = (staffName: string, filterType: 'all' | 'pending' | 'closed') => {
    setMonthlySelectedStaffName(staffName)
    setMonthlyFilterType(filterType)
    setMonthlyStaffTicketModalOpen(true)
  }

  // Handle month click - open modal with daily + staff data
  const handleMonthClick = async (monthIndex: number, monthName: string) => {
    setSelectedMonth(monthIndex + 1)
    setSelectedMonthName(monthName)
    setLoadingModal(true)

    try {
      // Fetch daily data
      const dailyRes = await fetch(`/api/dashboard/daily?year=${year}&month=${monthIndex + 1}`)
      const dailyData = await dailyRes.json()
      setDailyData(dailyData.data)

      // Fetch staff data for this month
      const staffRes = await fetch(`/api/dashboard/staff?year=${year}&month=${monthIndex + 1}`)
      const staffData = await staffRes.json()
      setMonthlyStaffData(staffData.staff)
    } catch (error) {
      console.error('Error fetching modal data:', error)
    } finally {
      setLoadingModal(false)
    }
  }

  // Handle day click - open ticket list modal for that day
  const handleDayClick = (day: string) => {
    setSelectedDay(day)
    setTicketFilterType('all')
    setTicketModalOpen(true)
  }

  // Handle day click from DailyBarChart modal - open TicketListModal
  const handleDayClickForModal = (day: string) => {
    openModal(TicketListModal, {
      isOpen: true,
      onClose: closeModal,
      year: year,
      month: month,
      day: day,
      filterType: 'all',
      title: FILTER_TITLES.all
    })
  }

  // Navigate to outliers page
  const handleViewAllOutliers = () => {
    const monthParam = month ? `?month=${month}` : ''
    router.push(`/dashboard/outliers?year=${year}${monthParam}`)
  }

  // Navigate to outliers page filtered by staff
  const handleViewStaffOutliers = (staffName: string) => {
    const monthParam = month ? `&month=${month}` : ''
    router.push(`/dashboard/outliers?year=${year}${monthParam}&staff=${encodeURIComponent(staffName)}`)
  }

  // Close modal
  const handleCloseModal = () => {
    setSelectedMonth(null)
    setSelectedMonthName('')
    setDailyData([])
    setMonthlyStaffData([])
  }

  // Close ticket list modal
  const handleCloseTicketModal = () => {
    setTicketModalOpen(false)
    setSelectedDay(null)
    setTicketFilterType('all')  // Reset filter type
  }

  // Close staff ticket modal
  const handleCloseStaffTicketModal = () => {
    setStaffTicketModalOpen(false)
    setSelectedStaffName('')
  }

  // Close monthly staff ticket modal
  const handleCloseMonthlyStaffTicketModal = () => {
    setMonthlyStaffTicketModalOpen(false)
    setMonthlySelectedStaffName('')
    setMonthlyFilterType('all')
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HeaderFilter />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Global Search */}
        <div className="mb-4">
          <GlobalSearch year={year} month={month} />
        </div>

        {/* Stats Cards */}
        <StatsCards
          total={stats.total}
          closed={stats.closed}
          closeRate={stats.closeRate}
          avgTime={stats.avgTime}
          pending={stats.pending}
          avgTimeNormal={outlierSummary?.avgTimeNormal}
          avgTimeOutlier={outlierSummary?.avgTimeOutlier}
          outlierCount={outlierSummary?.totalOutliers}
          outlierThreshold={outlierSummary?.outlierThreshold}
          onCardClick={handleStatCardClick}
        />

        {/* Chart - Monthly or Daily based on selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            {month ? (
              <InlineDailyChart
                year={year}
                month={month}
                monthName={THAI_MONTHS[month - 1]}
                onDayClick={handleDayClick}
                setYear={setYear}
                setMonth={setMonth}
                availableYears={availableYears}
                availableMonths={availableMonths}
              />
            ) : (
              <MonthlyBarChart
                data={monthlyData}
                onMonthClick={handleMonthClick}
                year={year}
                setYear={setYear}
                month={month}
                setMonth={setMonth}
                availableYears={availableYears}
                availableMonths={availableMonths}
              />
            )}
          </div>

          {/* Top Outliers List */}
          <div>
            <TopOutliersList
              outliers={topOutliers}
              onViewAll={handleViewAllOutliers}
              loading={outliersLoading}
            />
          </div>
        </div>

        {/* Staff Performance Table */}
        <StaffPerformanceTable
          staff={staffData}
          showOutlierColumns={true}
          onOutlierClick={handleViewStaffOutliers}
          onStaffClick={handleStaffClick}
          onStatClick={handleStatClick}
        />
      </div>

      {/* Modal with Daily Chart + Staff Performance */}
      {selectedMonth && (
        <DailyBarChart
          data={dailyData}
          monthName={selectedMonthName}
          year={year}
          monthIndex={selectedMonth}
          staffData={monthlyStaffData}
          onClose={handleCloseModal}
          loading={loadingModal}
          onDayClick={handleDayClickForModal}
          onStaffClick={handleStaffClickFromModal}
          onStatClick={handleStatClickFromModal}
        />
      )}

      {/* Ticket List Modal */}
      <TicketListModal
        isOpen={ticketModalOpen}
        onClose={handleCloseTicketModal}
        year={year}
        month={month}
        day={selectedDay}
        filterType={ticketFilterType}
        title={selectedStaffName ? `งาน${getFilterTypeLabel(ticketFilterType)}ของ ${selectedStaffName}` : FILTER_TITLES[ticketFilterType]}
        staffName={selectedStaffName}
      />

      {/* Staff Tickets Modal */}
      <TicketListModal
        isOpen={staffTicketModalOpen}
        onClose={handleCloseStaffTicketModal}
        year={year}
        month={month}
        filterType={ticketFilterType}
        title={`งาน${getFilterTypeLabel(ticketFilterType)}ของพนักงาน`}
        staffName={selectedStaffName}
      />

      {/* Monthly Staff Tickets Modal */}
      <TicketListModal
        isOpen={monthlyStaffTicketModalOpen}
        onClose={handleCloseMonthlyStaffTicketModal}
        year={year}
        month={selectedMonth}
        filterType={monthlyFilterType}
        title={`งาน${getFilterTypeLabel(monthlyFilterType)}ของ ${monthlySelectedStaffName} - ${selectedMonthName} ${year + 543}`}
        staffName={monthlySelectedStaffName}
      />

      {/* Outlier Explanation Modal */}
      <OutlierExplanationModal
        isOpen={outlierExplanationOpen}
        onClose={() => setOutlierExplanationOpen(false)}
        year={year}
      />
    </div>
  )
}
