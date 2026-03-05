'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeaderFilter from '../../components/dashboard/HeaderFilter'
import OutlierTable from '../../components/dashboard/OutlierTable'
import type { OutlierTicket, OutlierSummary } from '../../../types/outlier'

interface OutliersResponse {
  outliers: OutlierTicket[]
  summary: OutlierSummary
}

function OutliersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get filter params from URL
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')
  const staffParam = searchParams.get('staff')
  
  const [year, setYear] = useState(yearParam ? parseInt(yearParam) : 2026)
  const [month, setMonth] = useState<number | null>(monthParam ? parseInt(monthParam) : null)
  const [staffFilter, setStaffFilter] = useState<string | null>(staffParam)
  
  const [allOutliers, setAllOutliers] = useState<OutlierTicket[]>([])
  const [summary, setSummary] = useState<OutlierSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter outliers by staff name
  const filteredOutliers = staffFilter 
    ? allOutliers.filter(o => o.assigned_to === staffFilter)
    : allOutliers

  // Fetch outliers data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const monthQuery = month ? `&month=${month}` : ''
        const res = await fetch(`/api/dashboard/outliers?year=${year}${monthQuery}`)
        const data: OutliersResponse = await res.json()
        setAllOutliers(data.outliers)
        setSummary(data.summary)
      } catch (error) {
        console.error('Error fetching outliers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year, month])

  // Handle filter changes
  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    // Update URL
    const monthQuery = month ? `&month=${month}` : ''
    const staffQuery = staffFilter ? `&staff=${encodeURIComponent(staffFilter)}` : ''
    router.push(`/dashboard/outliers?year=${newYear}${monthQuery}${staffQuery}`)
  }

  const handleMonthChange = (newMonth: number | null) => {
    setMonth(newMonth)
    // Update URL
    const monthQuery = newMonth ? `&month=${newMonth}` : ''
    const staffQuery = staffFilter ? `&staff=${encodeURIComponent(staffFilter)}` : ''
    router.push(`/dashboard/outliers?year=${year}${monthQuery}${staffQuery}`)
  }

  const handleClearStaffFilter = () => {
    setStaffFilter(null)
    // Update URL without staff filter
    const monthQuery = month ? `&month=${month}` : ''
    router.push(`/dashboard/outliers?year=${year}${monthQuery}`)
  }

  const handleBackToDashboard = () => {
    const monthQuery = month ? `&month=${month}` : ''
    router.push(`/?year=${year}${monthQuery}`)
  }

  return (
    <>
      {/* Header with Filters */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              ← กลับหน้าหลัก
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Outlier Detection
              <span className="text-gray-500 text-lg font-normal ml-2">
                (Per-Person Threshold)
              </span>
            </h1>
            <div className="w-24"></div>
          </div>
          {/* Staff Filter Badge */}
          {staffFilter && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">
                กรอง Outliers ของ: <span className="font-bold text-blue-600">{staffFilter}</span>
              </span>
              <button
                onClick={handleClearStaffFilter}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6">
          <HeaderFilter
            year={year}
            setYear={handleYearChange}
            month={month}
            setMonth={handleMonthChange}
          />
        </div>

        {/* Outliers Table */}
        <OutlierTable
          outliers={filteredOutliers}
          summary={summary || undefined}
          loading={loading}
        />
      </div>
    </>
  )
}

export default function OutliersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      }>
        <OutliersContent />
      </Suspense>
    </div>
  )
}
