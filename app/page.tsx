'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderFilter from './components/dashboard/HeaderFilter'
import KPICards from './components/dashboard/KPICards'
import MonthlyBarChart from './components/dashboard/MonthlyBarChart'
import StaffPerformanceTable from './components/dashboard/StaffPerformanceTable'
import DailyBarChart from './components/dashboard/DailyBarChart'
import TopOutliersList from './components/dashboard/TopOutliersList'
import type { OutlierTicket } from '../types/outlier'

interface KPIStats {
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

export default function TeamKPIDashboard() {
  const router = useRouter()
  // Filter states - default to year that has data
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState<number | null>(null)

  // Data states
  const [kpi, setKpi] = useState<KPIStats>({
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

  // Loading state
  const [loading, setLoading] = useState(true)
  const [outliersLoading, setOutliersLoading] = useState(false)

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Build query params
        const monthParam = month ? `&month=${month}` : ''
        const yearParam = `year=${year}`

        // Fetch KPI stats
        const kpiRes = await fetch(`/api/dashboard/kpi?${yearParam}${monthParam}`)
        const kpiData = await kpiRes.json()
        setKpi(kpiData)

        // Fetch monthly data (always for the selected year)
        const monthlyRes = await fetch(`/api/dashboard/monthly?${yearParam}`)
        const monthlyData = await monthlyRes.json()
        // Add monthIndex to each entry for click handling
        const monthlyWithIndex = monthlyData.data.map((d: MonthlyData, index: number) => ({
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
        setLoading(false)
      }
    }

    fetchData()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Filters */}
      <HeaderFilter
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI Cards */}
        <KPICards
          total={kpi.total}
          closed={kpi.closed}
          closeRate={kpi.closeRate}
          avgTime={kpi.avgTime}
          pending={kpi.pending}
          avgTimeNormal={outlierSummary?.avgTimeNormal}
          avgTimeOutlier={outlierSummary?.avgTimeOutlier}
          outlierCount={outlierSummary?.totalOutliers}
          outlierThreshold={outlierSummary?.outlierThreshold}
        />

        {/* Monthly Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyBarChart
              data={monthlyData}
              onMonthClick={handleMonthClick}
            />
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
        />
      </div>

      {/* Modal with Daily Chart + Staff Performance */}
      {selectedMonth && (
        <DailyBarChart
          data={dailyData}
          monthName={selectedMonthName}
          year={year}
          monthIndex={selectedMonth - 1}
          staffData={monthlyStaffData}
          onClose={handleCloseModal}
          loading={loadingModal}
        />
      )}
    </div>
  )
}
