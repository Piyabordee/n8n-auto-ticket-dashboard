'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

const CHART_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'
]

function PrintReportContent() {
  const searchParams = useSearchParams()
  const year = Number(searchParams.get('year')) || new Date().getFullYear()
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <div className="flex justify-center gap-4">
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
        {reportData.totals.section1 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Ticket ${reportData.monthNameEnglish} ${reportData.year}`}
              subtitle="ส่วนที่ 1: ภาพรวม Ticket ทั้งหมด"
            />
            <PieChartSection
              title="Category"
              data={reportData.section1}
              total={reportData.totals.section1}
            />
          </div>
        )}

        {/* Section 2: Software */}
        {reportData.totals.section2 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Software ${reportData.totals.section2} Tickets`}
              subtitle="ส่วนที่ 2: เจาะลึกหมวด Software"
            />
            <PieChartSection
              title="Software"
              data={reportData.section2}
              total={reportData.totals.section2}
            />
          </div>
        )}

        {/* Section 3: Sub Services */}
        {reportData.totals.section3 > 0 && (
          <div className="print-page page-break-after">
            <PageHeader
              title={`Software ${reportData.totals.section3} Tickets`}
              subtitle="ส่วนที่ 3: การจัดกลุ่มปัญหา Software"
            />
            <PieChartSection
              title="Sub Services"
              data={reportData.section3}
              total={reportData.totals.section3}
            />
          </div>
        )}

        {/* Section 4: POS/RATE Causes */}
        {reportData.totals.section4 > 0 && (
          <div className="print-page">
            <PageHeader
              title={`POS/RATE Error ${reportData.section3.find((s: ReportSectionItem) => s.id === 'pos_rate_error')?.count || 0} Tickets`}
              subtitle="ส่วนที่ 4: สาเหตุของ POS/RATE Error"
            />
            <PieChartSection
              title="Causes"
              data={reportData.section4}
              total={reportData.totals.section4}
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

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h2>
      <p className="text-lg text-neutral-600">{subtitle}</p>
    </div>
  )
}

function PieChartSection({ title, data, total }: { title: string; data: ReportSectionItem[]; total: number }) {
  const chartData = data
    .filter(item => item.count > 0)
    .map((item, index) => ({
      name: item.name,
      value: item.count,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))

  return (
    <div className="flex flex-col gap-8">
      {/* Pie Chart */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
            <p className="text-4xl font-bold text-primary-600">{total} Tickets</p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-400">
              ไม่มีข้อมูล
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-400">
              <th className="text-left py-3 px-4 font-bold text-neutral-900">No</th>
              <th className="text-left py-3 px-4 font-bold text-neutral-900">{title}</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-900">Count</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-900">%</th>
            </tr>
          </thead>
          <tbody>
            {data.filter(item => item.count > 0).map((item, index) => (
              <tr key={item.id} className="border-b border-neutral-300">
                <td className="py-3 px-4 text-neutral-700">{index + 1}</td>
                <td className="py-3 px-4 text-neutral-900">{item.name}</td>
                <td className="py-3 px-4 text-neutral-900 text-right">{item.count}</td>
                <td className="py-3 px-4 text-neutral-900 text-right">
                  {((item.count / total) * 100).toFixed(1)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-neutral-400 font-bold bg-neutral-50">
              <td className="py-3 px-4 text-neutral-900" colSpan={2}>Grand Total</td>
              <td className="py-3 px-4 text-neutral-900 text-right">{total}</td>
              <td className="py-3 px-4 text-neutral-900 text-right">100.0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
