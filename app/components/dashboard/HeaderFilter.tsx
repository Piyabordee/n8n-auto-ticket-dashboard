'use client'

export default function HeaderFilter() {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 shadow-subtle">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo Image */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-lg flex items-center justify-center shadow-card flex-shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="IT Helpdesk Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              IT Helpdesk Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              ระบบวัดผลงานทีม IT Support
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
