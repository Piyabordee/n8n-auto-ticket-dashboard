'use client'

export default function HeaderFilter() {
  return (
    <div className="bg-header-yellow">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo and Title */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-lg sm:text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">Team Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-700">ระบบวัดผลงานทีม IT Support</p>
          </div>
        </div>
      </div>
    </div>
  )
}
