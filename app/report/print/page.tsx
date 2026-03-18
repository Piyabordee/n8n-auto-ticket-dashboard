'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadSectionPreferences, saveSectionPreferences, type ReportSectionConfig } from '@/lib/reportSections'
import { loadCustomNames, mergeCustomNames, getSectionDisplayName, getChartDisplayName } from '@/lib/reportConfig'
import PageHeader from '@/components/dashboard/report/PageHeader'
import PieChartSection from '@/components/dashboard/report/PieChartSection'
import ReportConfigModal from '@/components/dashboard/ReportConfigModal'

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

function PrintReportContent() {
  const searchParams = useSearchParams()
  const year = Number(searchParams.get('year')) || new Date().getFullYear()
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [sectionConfig, setSectionConfig] = useState<ReportSectionConfig[]>(loadSectionPreferences())

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/dashboard/report?year=${year}&month=${month}`)
        if (!res.ok) throw new Error('Failed to fetch report')
        const data = await res.json()
        setReportData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [year, month])

  // Load custom names on mount
  useEffect(() => {
    const customNames = loadCustomNames()
    const merged = mergeCustomNames(sectionConfig, customNames)
    setSectionConfig(merged)
  }, [])

  const handleConfigSave = (newConfig: ReportSectionConfig[]) => {
    setSectionConfig(newConfig)
    saveSectionPreferences(newConfig) // Persist enabled/disabled state
  }

  useEffect(() => {
    // Auto-trigger print dialog after content loads
    if (!loading && !error && reportData) {
      // Short delay to ensure rendering is complete (no animations)
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [loading, error, reportData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
          <p className="text-neutral-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">ไม่สามารถโหลดข้อมูลได้</p>
          <button onClick={() => window.close()} className="px-4 py-2 bg-primary-600 text-white rounded">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="print-container">
      {/* Header - no print */}
      <div className="no-print bg-neutral-100 p-4 text-center border-b sticky top-0 z-10">
        <p className="text-sm text-neutral-600 mb-2">
          หน้าต่างนี้จะปิดอัตโนมัติหลังจากพิมพ์เสร็จ หรือกดปุ่มด้านล่าง
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ตั้งค่ารายงาน
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            พิมพ์ / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Config Modal */}
      <ReportConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleConfigSave}
        sections={sectionConfig}
      />

      {/* Print Content */}
      <div className="print-content">
        {/* Cover Page */}
        <div className="print-page page-break-after">
          <div className="flex flex-col items-center justify-center min-h-[A4-height]">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              รายงานประจำเดือน{reportData.monthNameThai}
            </h1>
            <h2 className="text-3xl font-semibold text-neutral-700 mb-8">
              {reportData.year}
            </h2>
            <div className="bg-primary-50 border-4 border-primary-600 rounded-lg p-8 text-center">
              <p className="text-2xl font-semibold text-primary-700 mb-2">ภาพรวม</p>
              <p className="text-5xl font-bold text-primary-600">
                {reportData.totalTickets.toLocaleString()}
              </p>
              <p className="text-xl text-neutral-600 mt-2">Tickets ทั้งหมด</p>
            </div>
            <p className="mt-auto text-sm text-neutral-500">
              พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
            </p>
          </div>
        </div>

        {/* Section 1: Category */}
        {sectionConfig.find(s => s.id === 'section1')?.enabled && reportData.totals.section1 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Ticket ${reportData.monthNameEnglish} ${reportData.year}`}
              subtitle="ส่วนที่ 1: ภาพรวม Ticket ทั้งหมด"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section1')!)}
            />
            <PieChartSection
              title="Category"
              data={reportData.section1}
              total={reportData.totals.section1}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section1')!)}
            />
          </div>
        )}

        {/* Section 2: Software */}
        {sectionConfig.find(s => s.id === 'section2')?.enabled && reportData.totals.section2 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Software ${reportData.totals.section2} Tickets`}
              subtitle="ส่วนที่ 2: เจาะลึกหมวด Software"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section2')!)}
            />
            <PieChartSection
              title="Software"
              data={reportData.section2}
              total={reportData.totals.section2}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section2')!)}
            />
          </div>
        )}

        {/* Section 3: Sub Services */}
        {sectionConfig.find(s => s.id === 'section3')?.enabled && reportData.totals.section3 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Software ${reportData.totals.section3} Tickets`}
              subtitle="ส่วนที่ 3: การจัดกลุ่มปัญหา Software"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section3')!)}
            />
            <PieChartSection
              title="Sub Services"
              data={reportData.section3}
              total={reportData.totals.section3}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section3')!)}
            />
          </div>
        )}

        {/* Section 4: POS/RATE Causes */}
        {sectionConfig.find(s => s.id === 'section4')?.enabled && reportData.totals.section4 > 0 && (
          <div className="print-page">
            <PageHeader
              title={`POS/RATE Error ${reportData.section3.find((s: ReportSectionItem) => s.id === 'pos_rate_error')?.count || 0} Tickets`}
              subtitle="ส่วนที่ 4: สาเหตุของ POS/RATE Error"
              customTitle={getSectionDisplayName(sectionConfig.find(s => s.id === 'section4')!)}
            />
            <PieChartSection
              title="Causes"
              data={reportData.section4}
              total={reportData.totals.section4}
              customTitle={getChartDisplayName(sectionConfig.find(s => s.id === 'section4')!)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PrintReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
          <p className="text-neutral-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    }>
      <PrintReportContent />
    </Suspense>
  )
}
