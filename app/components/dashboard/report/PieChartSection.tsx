'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface ReportSectionItem {
  id: string
  name: string
  count: number
}

interface PieChartSectionProps {
  title: string
  data: ReportSectionItem[]
  total: number
  customTitle?: string
}

const CHART_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'
]

export default function PieChartSection({ title, data, total, customTitle }: PieChartSectionProps) {
  const displayTitle = customTitle || title
  const filteredData = data.filter(item => item.count > 0)
  const chartData = filteredData
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
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{displayTitle}</h3>
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
              <th className="text-left py-3 px-4 font-bold text-neutral-900">{displayTitle}</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-900">Count</th>
              <th className="text-right py-3 px-4 font-bold text-neutral-900">%</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={item.id} className="border-b border-neutral-300">
                <td className="py-3 px-4 text-neutral-700">{index + 1}</td>
                <td className="py-3 px-4 text-neutral-900">{item.name}</td>
                <td className="py-3 px-4 text-neutral-900 text-right">{item.count}</td>
                <td className="py-3 px-4 text-neutral-900 text-right">
                  {total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-neutral-400 font-bold bg-neutral-50">
              <td className="py-3 px-4 text-neutral-900" colSpan={2}>รวมทั้งหมด</td>
              <td className="py-3 px-4 text-neutral-900 text-right">{total}</td>
              <td className="py-3 px-4 text-neutral-900 text-right">100.0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
