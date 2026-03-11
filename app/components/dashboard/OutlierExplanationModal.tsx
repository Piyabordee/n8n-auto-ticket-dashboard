'use client'

import { useState, useEffect } from 'react'
import type { StaffStats } from '@/types/outlier'

interface OutlierExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
}

// Utility function to format minutes into human-readable format
const formatMinutes = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === null) return '-'
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

export default function OutlierExplanationModal({
  isOpen,
  onClose,
  year
}: OutlierExplanationModalProps) {
  const [staffStats, setStaffStats] = useState<StaffStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dashboard/staff?year=${year}`)
        if (!res.ok) throw new Error('Failed to fetch data')
        const data = await res.json()
        setStaffStats(data.staff || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, year])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            📊 คำอธิบายวิธีคำนวณ Outlier (Median + 15×MAD)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <>
              <ELI5Section />
              <TechnicalSection />
              <StaffDataTable staffStats={staffStats} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ELI5Section() {
  return (
    <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        📖 Outlier คืออะไร? (ELI5)
      </h3>
      <div className="space-y-3 text-sm sm:text-base text-gray-700">
        <p>
          Outlier คือ <strong>"งานที่ใช้เวลานานผิดปกติ"</strong> เมื่อเทียบกับเวลาที่ตัวเองปกติทำ
        </p>
        <div className="bg-white rounded p-3 border border-blue-100">
          <p className="font-medium mb-2">ตัวอย่าง:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>คุณ A ปกติปิดงาน 1-2 ชม. → งาน 3 วัน = Outlier</li>
            <li>คุณ B ปกติปิดงาน 2-3 วัน → งาน 1 สัปดาห์ = Outlier</li>
          </ul>
        </div>
        <p className="italic text-gray-600">
          ทุกคนมีเกณฑ์ของตัวเอง เพราะงานแต่ละประเภทต่างกัน!
        </p>
      </div>
    </section>
  )
}

function TechnicalSection() {
  return (
    <section className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        🔧 วิธีคำนวณ (Technical)
      </h3>
      <div className="space-y-3 text-sm sm:text-base text-gray-700">
        <div>
          <p className="font-medium mb-1">Step 1: หาค่ามัธยฐาน (Median) ของเวลาปิดงานทั้งปี</p>
          <p className="font-medium mb-1">Step 2: หาค่า MAD (Median Absolute Deviation)</p>
          <p className="font-medium">Step 3: Threshold = Median + (15 × MAD)</p>
        </div>

        <div className="bg-white rounded p-3 border border-orange-100">
          <p className="font-medium mb-1">สูตร MAD:</p>
          <code className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono">
            MAD = Median(|Xi - Median|)
          </code>
        </div>

        <div>
          <p className="font-medium mb-2">ทำไมใช้ 15×MAD?</p>
          <ul className="space-y-1 list-disc list-inside text-sm">
            <li>MAD ทนทานต่อค่าผิดปกติ (robust)</li>
            <li>15× เป็นค่าที่เหมาะสมจากการทดลองกับข้อมูลจริง</li>
            <li>ระบุเฉพาะงานที่ผิดปกติ "จริงๆ" เท่านั้น</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function StaffDataTable({ staffStats }: { staffStats: StaffStats[] }) {
  return (
    <section className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        👥 ข้อมูลเฉพาะบุคคล (Per-Person Stats)
      </h3>

      {staffStats.length === 0 ? (
        <p className="text-gray-600 text-center py-4">ไม่มีข้อมูลพนักงาน</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Staff</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Median</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">MAD</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Threshold</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffStats.map((staff) => (
                  <tr key={staff.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{staff.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-700">
                      {formatMinutes(staff.personalMedian)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-700">
                      {formatMinutes(staff.personalMAD)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-orange-600">
                      {formatMinutes(staff.personalThreshold)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-red-600">
                      {staff.outlierCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {staffStats.map((staff) => (
              <div key={staff.name} className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{staff.name}</span>
                  <span className="text-sm font-semibold text-red-600">
                    Outliers: {staff.outlierCount}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Median</span>
                    <p className="text-gray-900">{formatMinutes(staff.personalMedian)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">MAD</span>
                    <p className="text-gray-900">{formatMinutes(staff.personalMAD)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Threshold</span>
                    <p className="text-orange-600 font-medium">
                      {formatMinutes(staff.personalThreshold)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-red-600 mb-4">❌ {message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        ลองใหม่
      </button>
    </div>
  )
}

function LoadingState() {
  return <p className="text-center py-8 text-gray-600">⏳ กำลังโหลดข้อมูล...</p>
}
