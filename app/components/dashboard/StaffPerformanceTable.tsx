'use client'

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

interface StaffPerformanceTableProps {
  staff?: StaffData[]
  showOutlierColumns?: boolean
  onOutlierClick?: (staffName: string) => void
}

export default function StaffPerformanceTable({ staff, showOutlierColumns = false, onOutlierClick }: StaffPerformanceTableProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800'
    if (rank === 2) return 'bg-gray-100 text-gray-600'
    if (rank === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-50 text-gray-600'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getOutlierBadgeClass = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600'
    if (count <= 2) return 'bg-yellow-100 text-yellow-700'
    if (count <= 5) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  // Check if any staff member has outlier data
  const hasOutlierData = showOutlierColumns && staff && staff.some(s => s.outlierCount !== undefined)

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">ผลงานทีม (Staff Performance)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อันดับ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อพนักงาน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รับงาน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ปิดแล้ว</th>
              {hasOutlierData && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Outliers</th>
              )}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เวลาเฉลี่ย (นาที)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(staff || []).map((person) => (
              <tr key={person.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankBadge(person.rank)}`}>
                    {getRankIcon(person.rank)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {person.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {person.totalAssigned}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="text-green-600 font-semibold">{person.totalClosed}</span>
                </td>
                {hasOutlierData && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {(person.outlierCount !== undefined) && (
                      <button
                        onClick={() => person.outlierCount && person.outlierCount > 0 && onOutlierClick?.(person.name)}
                        disabled={!person.outlierCount || person.outlierCount === 0}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          getOutlierBadgeClass(person.outlierCount)
                        } ${
                          person.outlierCount > 0 && onOutlierClick
                            ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 active:scale-95'
                            : 'cursor-default'
                        }`}
                        title={person.outlierCount > 0 ? `ดู Outliers ของ ${person.name}` : 'ไม่มี Outliers'}
                      >
                        {person.outlierCount}
                        {person.outlierCount > 0 && <span className="ml-1">→</span>}
                      </button>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {hasOutlierData && person.avgTimeNormal !== undefined && person.avgTimeOutlier !== undefined ? (
                    <div className="flex flex-col items-center">
                      <span className="text-gray-900">{person.avgTimeNormal.toFixed(1)}</span>
                      {person.outlierCount && person.outlierCount > 0 && (
                        <span className="text-red-600 text-xs">({person.avgTimeOutlier.toFixed(1)})</span>
                      )}
                    </div>
                  ) : (
                    person.avgTimeAll > 0 ? person.avgTimeAll.toFixed(1) : '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
