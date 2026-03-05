'use client'

import { useState, useEffect } from 'react'
import HeaderFilter from './components/dashboard/HeaderFilter'
import KPICards from './components/dashboard/KPICards'
import MonthlyBarChart from './components/dashboard/MonthlyBarChart'
import StaffPerformanceTable from './components/dashboard/StaffPerformanceTable'
import DailyBarChart from './components/dashboard/DailyBarChart'

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
  avgTime: number
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
  // Filter states
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
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

  // Modal states
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedMonthName, setSelectedMonthName] = useState<string>('')
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [monthlyStaffData, setMonthlyStaffData] = useState<StaffData[]>([])
  const [loadingModal, setLoadingModal] = useState(false)

  // Loading state
  const [loading, setLoading] = useState(true)

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

        // Fetch staff performance
        const staffRes = await fetch(`/api/dashboard/staff?${yearParam}${monthParam}`)
        const staffData = await staffRes.json()
        setStaffData(staffData.staff)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
        />

        {/* Monthly Bar Chart */}
        <MonthlyBarChart
          data={monthlyData}
          onMonthClick={handleMonthClick}
        />

        {/* Staff Performance Table */}
        <StaffPerformanceTable staff={staffData} />
      </div>

      {/* Modal with Daily Chart + Staff Performance */}
      {selectedMonth && (
        <DailyBarChart
          data={dailyData}
          monthName={selectedMonthName}
          year={year}
          staffData={monthlyStaffData}
          onClose={handleCloseModal}
          loading={loadingModal}
        />
      )}
    </div>
  )
}
