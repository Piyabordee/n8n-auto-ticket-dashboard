'use client'

export default function HeaderFilter() {
  return (
    <div className="bg-header-yellow">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Logo and Title */}
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Team Dashboard</h1>
            <p className="text-sm text-gray-700">ระบบวัดผลงานทีม IT Support</p>
          </div>
        </div>
      </div>
    </div>
  )
}
