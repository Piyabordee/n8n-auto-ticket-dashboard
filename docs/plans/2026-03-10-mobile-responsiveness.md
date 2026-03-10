# Mobile Responsiveness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the IT Helpdesk Dashboard fully responsive for mobile devices (phones, tablets) while maintaining desktop functionality.

**Architecture:**
- Add responsive Tailwind CSS breakpoints (`sm:`, `md:`, `lg:`, `xl:`) to existing components
- Stack cards/tables vertically on mobile, use scrollable containers for wide tables
- Hide less important columns on mobile, show detail in expandable rows
- Adjust modal sizes and padding for small screens
- Optimize chart heights and font sizes

**Tech Stack:** Tailwind CSS responsive utilities, Next.js 14, Recharts (already responsive)

---

## Task 1: Update StatsCards for Mobile

**Files:**
- Modify: `app/components/dashboard/StatsCards.tsx:62`

**Step 1: Update grid to use responsive breakpoints**

Change line 62 from:
```tsx
<div className={`grid gap-4 mb-6 ${hasOutlierData ? 'grid-cols-5' : 'grid-cols-4'}`}>
```

To:
```tsx
<div className={`grid gap-3 mb-6 ${hasOutlierData ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
```

**Step 2: Reduce font sizes on mobile**

Update the text sizes in each card:
- Change `text-3xl` to `text-2xl sm:text-3xl` for the numbers
- Change `text-sm` to `text-xs sm:text-sm` for labels

**Step 3: Commit**

```bash
git add app/components/dashboard/StatsCards.tsx
git commit -m "feat: make StatsCards responsive for mobile devices"
```

---

## Task 2: Update HeaderFilter for Mobile

**Files:**
- Modify: `app/components/dashboard/HeaderFilter.tsx`

**Step 1: Make header layout responsive**

Update the component:
```tsx
// Change the flex container to be responsive
<div className="flex items-center gap-2 sm:gap-3">
  {/* Logo - slightly smaller on mobile */}
  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
    <span className="text-lg sm:text-xl">📊</span>
  </div>
  <div>
    <h1 className="text-base sm:text-lg font-semibold text-gray-900">Team Dashboard</h1>
    <p className="text-xs sm:text-sm text-gray-700">ระบบวัดผลงานทีม IT Support</p>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add app/components/dashboard/HeaderFilter.tsx
git commit -m "feat: make HeaderFilter responsive for mobile"
```

---

## Task 3: Update MonthlyBarChart for Mobile

**Files:**
- Modify: `app/components/dashboard/MonthlyBarChart.tsx`

**Step 1: Update header layout**

Change lines 74-109 (header section) to:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
  <h3 className="text-base sm:text-lg font-semibold text-gray-900">ปริมาณงานรายเดือน</h3>
  <div className="flex flex-wrap items-center gap-2">
    {/* Year select - smaller on mobile */}
    <select
      value={year}
      onChange={(e) => {
        const newYear = parseInt(e.target.value)
        setYear(newYear)
        if (setMonth) setMonth(null)
      }}
      className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y + 543}
        </option>
      ))}
    </select>
    {/* Month select - smaller on mobile */}
    {month !== undefined && setMonth && (
      <select
        value={month ?? 'all'}
        onChange={(e) => setMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
        className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={monthOptions.length <= 1}
      >
        {monthOptions.map((m) => (
          <option key={m.label} value={m.value ?? 'all'}>
            {m.label}
          </option>
        ))}
      </select>
    )}
  </div>
</div>
```

**Step 2: Reduce chart height on mobile**

Change line 111:
```tsx
<ResponsiveContainer width="100%" height={250}>
```

**Step 3: Commit**

```bash
git add app/components/dashboard/MonthlyBarChart.tsx
git commit -m "feat: make MonthlyBarChart responsive for mobile"
```

---

## Task 4: Update InlineDailyChart for Mobile

**Files:**
- Modify: `app/components/dashboard/InlineDailyChart.tsx`

**Step 1: Update header layout**

Change lines 64-70:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
  <h3 className="text-base sm:text-lg font-semibold text-gray-900">ปริมาณงานรายวัน - {monthName} {year + 543}</h3>
  <div className="text-xs sm:text-sm text-gray-500">
    ทั้งหมด: <span className="font-semibold text-gray-900">{total}</span> •
    ปิดแล้ว: <span className="font-semibold text-green-600">{closed}</span> •
    รอ: <span className="font-semibold text-red-600">{total - closed}</span>
  </div>
</div>
```

**Step 2: Reduce chart height on mobile**

Change line 72:
```tsx
<ResponsiveContainer width="100%" height={250}>
```

**Step 3: Commit**

```bash
git add app/components/dashboard/InlineDailyChart.tsx
git commit -m "feat: make InlineDailyChart responsive for mobile"
```

---

## Task 5: Update TopOutliersList for Mobile

**Files:**
- Modify: `app/components/dashboard/TopOutliersList.tsx`

**Step 1: Make header responsive**

Change lines 77-86:
```tsx
<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-row items-center justify-between gap-2">
  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Outliers (นานที่สุด)</h3>
  {outliers.length > 0 && onViewAll && (
    <button
      onClick={onViewAll}
      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
    >
      ดูทั้งหมด →
    </button>
  )}
</div>
```

**Step 2: Adjust outlier item layout**

Change lines 91-129:
```tsx
<div key={outlier.message_id} className="p-3 sm:p-4 hover:bg-gray-50">
  <div className="flex items-start gap-3 sm:gap-4">
    {/* Rank Badge */}
    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
      index === 0 ? 'bg-red-100 text-red-700' :
      index === 1 ? 'bg-orange-100 text-orange-700' :
      'bg-yellow-100 text-yellow-700'
    }`}>
      {index + 1}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
        <span className="text-xs sm:text-sm font-medium text-gray-900">
          {outlier.assigned_to}
        </span>
        <span className="text-xs text-gray-500">•</span>
        <span className="text-xs text-gray-500">
          {formatDate(outlier.assigned_date)}
        </span>
      </div>
      <div className="text-xs sm:text-sm truncate mb-1">
        <ClickableSubject
          subject={outlier.subject}
          messageId={outlier.message_id}
        />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-base sm:text-lg font-bold text-red-600">
          {formatMinutes(outlier.diff_minutes)}
        </span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {outlier.deviation_score.toFixed(1)}x
        </span>
      </div>
    </div>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add app/components/dashboard/TopOutliersList.tsx
git commit -m "feat: make TopOutliersList responsive for mobile"
```

---

## Task 6: Update StaffPerformanceTable for Mobile

**Files:**
- Modify: `app/components/dashboard/StaffPerformanceTable.tsx`

**Step 1: Add mobile card view**

Before the table (after line 70), add a mobile-only card view:

```tsx
{/* Mobile Card View */}
<div className="md:hidden px-4 py-4 space-y-4">
  {(staff || []).map((person) => (
    <div key={person.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRankBadge(person.rank)}`}>
            {getRankIcon(person.rank)}
          </span>
          {onStaffClick ? (
            <button
              onClick={() => onStaffClick(person.name)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              {person.name}
            </button>
          ) : (
            <span className="text-sm font-semibold text-gray-900">{person.name}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500">รับงาน</div>
          <div className="font-semibold text-gray-900">{person.totalAssigned}</div>
        </div>
        <div>
          <div className="text-gray-500">ยังไม่ปิด</div>
          <div className="font-semibold text-red-600">{person.totalPending}</div>
        </div>
        {hasOutlierData && (
          <div>
            <div className="text-gray-500">Outliers</div>
            <div className="font-semibold">
              <button
                onClick={() => person.outlierCount && person.outlierCount > 0 && onOutlierClick?.(person.name)}
                disabled={!person.outlierCount || person.outlierCount === 0}
                className={`text-xs font-medium ${getOutlierBadgeClass(person.outlierCount || 0)} ${
                  person.outlierCount && person.outlierCount > 0 && onOutlierClick ? 'cursor-pointer' : ''
                }`}
              >
                {person.outlierCount || 0}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 text-xs">
        <span className="text-gray-500">เวลาเฉลี่ย:</span>{' '}
        <span className="font-semibold text-gray-900">
          {hasOutlierData && person.avgTimeNormal !== undefined ? (
            <>
              {formatMinutes(Math.round(person.avgTimeNormal))}
              {person.outlierCount && person.outlierCount > 0 && (
                <span className="text-red-600"> ({formatMinutes(Math.round(person.avgTimeOutlier || 0))})</span>
              )}
            </>
          ) : (
            person.avgTimeAll > 0 ? formatMinutes(Math.round(person.avgTimeAll)) : '-'
          )}
        </span>
      </div>
    </div>
  ))}
</div>

{/* Desktop Table View - hidden on mobile */}
<div className="hidden md:block overflow-x-auto">
  {/* Keep existing table here */}
```

**Step 2: Wrap table in responsive container**

After the mobile card view, wrap the existing table:
```tsx
<div className="hidden md:block">
  <div className="overflow-x-auto">
    {/* existing table content */}
  </div>
</div>
```

**Step 3: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat: make StaffPerformanceTable responsive with mobile card view"
```

---

## Task 7: Update TicketListModal for Mobile

**Files:**
- Modify: `app/components/dashboard/TicketListModal.tsx`

**Step 1: Update modal sizing and padding**

Change lines 101-103:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
  <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
```

**Step 2: Update header for mobile**

Change lines 104-121:
```tsx
{/* Header */}
<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
  <div className="min-w-0 flex-1">
    <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">{title}</h2>
    <p className="text-xs sm:text-sm text-gray-500 mt-1">
      {day ? `${day} ` : ''}{FILTER_LABELS[filterType]} - {tickets.length} งาน
      {staffName && <span className="ml-1 sm:ml-2">• พนักงาน: {staffName}</span>}
    </p>
  </div>
  <button
    onClick={onClose}
    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
    aria-label="Close"
  >
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
```

**Step 3: Update content padding**

Change line 124:
```tsx
<div className="flex-1 overflow-y-auto p-3 sm:p-6">
```

**Step 4: Commit**

```bash
git add app/components/dashboard/TicketListModal.tsx
git commit -m "feat: make TicketListModal responsive for mobile"
```

---

## Task 8: Update DailyBarChart Modal for Mobile

**Files:**
- Modify: `app/components/dashboard/DailyBarChart.tsx`

**Step 1: Update modal sizing**

Change line 112:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
```

**Step 2: Update modal content max-width**

Change line 113:
```tsx
<div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
```

**Step 3: Update header**

Change lines 115-128:
```tsx
<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-header-yellow shrink-0">
  <div className="min-w-0">
    <h2 className="text-base sm:text-xl font-semibold text-gray-900">
      รายละเอียดประจำเดือน - {monthName} {year + 543}
    </h2>
    <p className="text-xs sm:text-sm text-gray-700">กราฟรายวัน ผลงานทีม และรายการงานทั้งหมด</p>
  </div>
  <button
    onClick={onClose}
    className="text-gray-600 hover:text-gray-900 text-xl sm:text-2xl font-bold leading-none flex-shrink-0"
  >
    ×
  </button>
</div>
```

**Step 4: Reduce chart height on mobile**

Change line 139:
```tsx
<ResponsiveContainer width="100%" height={250}>
```

**Step 5: Make daily summary responsive**

Change lines 170-189:
```tsx
<div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
  <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
    <div className="text-xl sm:text-2xl font-bold text-blue-600">
      {data.reduce((sum, d) => sum + d.total, 0)}
    </div>
    <div className="text-xs sm:text-sm text-gray-600">ทั้งหมด</div>
  </div>
  <div className="bg-green-50 rounded-lg p-2 sm:p-3">
    <div className="text-xl sm:text-2xl font-bold text-green-600">
      {data.reduce((sum, d) => sum + d.closed, 0)}
    </div>
    <div className="text-xs sm:text-sm text-gray-600">ปิดแล้ว</div>
  </div>
  <div className="bg-orange-50 rounded-lg p-2 sm:p-3">
    <div className="text-xl sm:text-2xl font-bold text-orange-600">
      {data.reduce((sum, d) => sum + d.total - d.closed, 0)}
    </div>
    <div className="text-xs sm:text-sm text-gray-600">รอดำเนินการ</div>
  </div>
</div>
```

**Step 6: Make section padding responsive**

Change `p-6` to `p-4 sm:p-6` in all section divs (lines 137, 193, 241).

**Step 7: Commit**

```bash
git add app/components/dashboard/DailyBarChart.tsx
git commit -m "feat: make DailyBarChart modal responsive for mobile"
```

---

## Task 9: Update OutlierTable for Mobile

**Files:**
- Modify: `app/components/dashboard/OutlierTable.tsx`

**Step 1: Make summary grid responsive**

Change lines 131-155:
```tsx
<div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
    <div>
      <div className="text-xs sm:text-sm text-gray-600">Total Outliers</div>
      <div className="text-lg sm:text-xl font-bold text-gray-900">{summary.total}</div>
    </div>
    <div>
      <div className="text-xs sm:text-sm text-gray-600">Avg Time</div>
      <div className="text-lg sm:text-xl font-bold text-orange-600">
        {formatMinutes(Math.round(summary.avgTime))}
      </div>
    </div>
    <div>
      <div className="text-xs sm:text-sm text-gray-600">Max Time</div>
      <div className="text-lg sm:text-xl font-bold text-red-600">
        {formatMinutes(summary.maxTime)}
      </div>
    </div>
    <div>
      <div className="text-xs sm:text-sm text-gray-600">Min Time</div>
      <div className="text-lg sm:text-xl font-bold text-blue-600">
        {formatMinutes(Math.round(summary.minTime))}
      </div>
    </div>
  </div>
  <div className="mt-2 text-center text-xs text-gray-500 px-2">
    * ใช้เกณฑ์ต่อบุคคล (ค่ามัธยฐาน + 15×MAD ของแต่ละพนักงาน)
  </div>
</div>
```

**Step 2: Add mobile card view before table**

After line 159 (after the summary section), add:

```tsx
{/* Mobile Card View */}
<div className="md:hidden divide-y divide-gray-200">
  {sortedOutliers.map((outlier) => (
    <div key={outlier.message_id} className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900">{outlier.assigned_to}</span>
        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
          {outlier.deviation_score.toFixed(1)}x
        </span>
      </div>
      <div className="text-sm mb-2">
        <ClickableSubject
          subject={outlier.subject}
          messageId={outlier.message_id}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(outlier.assigned_date)}</span>
        <span className="font-bold text-red-600">
          {formatMinutes(outlier.diff_minutes)}
        </span>
      </div>
    </div>
  ))}
</div>

{/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto">
  {/* existing table */}
```

**Step 3: Wrap existing table for desktop only**

Wrap the existing table starting at line 162 with:
```tsx
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    {/* existing table content */}
  </table>
</div>
```

**Step 4: Commit**

```bash
git add app/components/dashboard/OutlierTable.tsx
git commit -m "feat: make OutlierTable responsive with mobile card view"
```

---

## Task 10: Update MonthlyTicketList for Mobile

**Files:**
- Modify: `app/components/dashboard/MonthlyTicketList.tsx`

**Step 1: Add mobile card view**

After line 150 (after the header), add mobile card view:

```tsx
{/* Mobile Card View */}
<div className="md:hidden divide-y divide-gray-100">
  {sortedTickets.map((ticket) => (
    <div key={ticket.message_id} className="p-3 hover:bg-blue-50 transition-colors">
      <div className="mb-2">
        <ClickableSubject
          subject={ticket.subject}
          messageId={ticket.message_id}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span className="text-gray-600">{formatDate(ticket.created_date)}</span>
        <span className="text-gray-700">• {ticket.assigned_to}</span>
        <span>{getStatusBadge(ticket.status)}</span>
        <span className="text-gray-600">{ticket.branch_name}</span>
        {ticket.close_time_minute && (
          <span className="font-semibold text-blue-600">
            {formatMinutes(ticket.close_time_minute)}
          </span>
        )}
      </div>
    </div>
  ))}
</div>

{/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto">
  {/* existing table */}
```

**Step 2: Wrap existing table**

Wrap the existing table starting at line 152:
```tsx
<div className="hidden md:block overflow-x-auto">
  <table className="w-full text-sm">
    {/* existing table content */}
  </table>
</div>
```

**Step 3: Commit**

```bash
git add app/components/dashboard/MonthlyTicketList.tsx
git commit -m "feat: make MonthlyTicketList responsive with mobile card view"
```

---

## Task 11: Update Main Dashboard Page Layout

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update main container padding**

Change line 304:
```tsx
<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
```

**Step 2: Update chart grid layout**

Change lines 320-351:
```tsx
{/* Chart - Monthly or Daily based on selection */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
  <div className="lg:col-span-2">
    {month ? (
      <InlineDailyChart
        year={year}
        month={month}
        monthName={THAI_MONTHS[month - 1]}
        onDayClick={handleDayClick}
      />
    ) : (
      <MonthlyBarChart
        data={monthlyData}
        onMonthClick={handleMonthClick}
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        availableYears={availableYears}
        availableMonths={availableMonths}
      />
    )}
  </div>

  {/* Top Outliers List */}
  <div>
    <TopOutliersList
      outliers={topOutliers}
      onViewAll={handleViewAllOutliers}
      loading={outliersLoading}
    />
  </div>
</div>
```

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update main dashboard layout for mobile responsiveness"
```

---

## Task 12: Update Outliers Page for Mobile

**Files:**
- Modify: `app/dashboard/outliers/page.tsx`

**Step 1: Update header layout**

Change lines 87-103:
```tsx
{/* Header with Filters */}
<div className="bg-white shadow-sm border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <button
        onClick={handleBackToDashboard}
        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 self-start"
      >
        ← กลับหน้าหลัก
      </button>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
        Outlier Detection
        <span className="text-gray-500 text-base sm:text-lg font-normal ml-0 sm:ml-2 block sm:inline">
          (ค่ามัธยฐาน + 15×MAD)
        </span>
      </h1>
      <div className="hidden sm:block w-24"></div>
    </div>
```

**Step 2: Update filter layout**

Change lines 123-158:
```tsx
{/* Filters */}
<div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center bg-white p-3 sm:p-4 rounded-lg shadow-sm">
  <div className="flex-1 sm:flex-none">
    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ปี (Year)</label>
    <select
      value={year}
      onChange={(e) => handleYearChange(parseInt(e.target.value))}
      className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    >
      <option value={2025}>2025</option>
      <option value={2026}>2026</option>
      <option value={2027}>2027</option>
    </select>
  </div>
  <div className="flex-1 sm:flex-none">
    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">เดือน (Month)</label>
    <select
      value={month ?? ''}
      onChange={(e) => handleMonthChange(e.target.value ? parseInt(e.target.value) : null)}
      className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    >
      <option value="">ทั้งปี (All Year)</option>
      <option value="1">มกราคม (January)</option>
      <option value="2">กุมภาพันธ์ (February)</option>
      <option value="3">มีนาคม (March)</option>
      <option value="4">เมษายน (April)</option>
      <option value="5">พฤษภาคม (May)</option>
      <option value="6">มิถุนายน (June)</option>
      <option value="7">กรกฎาคม (July)</option>
      <option value="8">สิงหาคม (August)</option>
      <option value="9">กันยายน (September)</option>
      <option value="10">ตุลาคม (October)</option>
      <option value="11">พฤศจิกายน (November)</option>
      <option value="12">ธันวาคม (December)</option>
    </select>
  </div>
</div>
```

**Step 3: Update container padding**

Change line 121:
```tsx
<div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
```

**Step 4: Commit**

```bash
git add app/dashboard/outliers/page.tsx
git commit -m "feat: make outliers page responsive for mobile"
```

---

## Task 13: Test on Mobile Devices

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Test responsive breakpoints**

Open browser DevTools and test at:
- Mobile: 375px width (iPhone SE)
- Mobile: 390px width (iPhone 12/13)
- Tablet: 768px width (iPad)
- Desktop: 1024px+ width

**Step 3: Verify all pages**

Checklist:
- [ ] Main dashboard - cards stack vertically
- [ ] Charts are readable and interactive
- [ ] Tables show card view on mobile
- [ ] Modals fit on screen
- [ ] All text is readable
- [ ] Buttons/taps are accessible (min 44px height)

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: additional mobile responsiveness adjustments"
```

---

## Task 14: Create Ticket Detail Modal (if needed)

**Files:**
- Create: `app/components/dashboard/TicketDetailModal.tsx` (if not exists)

**Note:** Check if ClickableSubject opens a modal. If so, ensure it's also responsive.

**Step 1: Check TicketDetailModal**

```bash
ls app/components/dashboard/TicketDetailModal.tsx
```

**Step 2: If exists, update for mobile**

Apply same responsive patterns as TicketListModal.

**Step 3: Commit**

```bash
git add app/components/dashboard/TicketDetailModal.tsx
git commit -m "feat: make TicketDetailModal responsive for mobile"
```

---

## Task 15: Final Verification and Documentation

**Step 1: Create responsive design documentation**

Create: `docs/mobile-responsive.md`

```markdown
# Mobile Responsive Design

## Breakpoints Used
- `sm:` 640px - Small tablets, large phones
- `md:` 768px - Tablets
- `lg:` 1024px - Small desktops, laptops
- `xl:` 1280px - Desktops

## Component Patterns

### Cards (StatsCards, summaries)
- Mobile: 1 column
- Small: 2 columns
- Desktop: 4-5 columns

### Tables (StaffPerformanceTable, OutlierTable, MonthlyTicketList)
- Mobile: Card view with stacked info
- Desktop: Traditional table with horizontal scroll if needed

### Modals
- Mobile: Full width with small padding
- Desktop: Max width with centered position

### Charts
- Mobile: 250px height
- Desktop: 300px height

## Testing
Always test at 375px, 768px, and 1024px widths.
```

**Step 2: Run final test**

```bash
npm run build
```

**Step 3: Commit documentation**

```bash
git add docs/
git commit -m "docs: add mobile responsive design documentation"
```

---

## Summary

This plan adds mobile responsiveness to 12+ components across the dashboard. Key patterns:

1. **Cards**: Stack vertically on mobile, use `grid-cols-1 sm:grid-cols-2`
2. **Tables**: Show card view on mobile, table on desktop (`md:hidden` vs `hidden md:block`)
3. **Modals**: Full width on mobile, max-width on desktop
4. **Charts**: Reduced height on mobile (250px vs 300px)
5. **Text**: Smaller fonts on mobile (`text-xs sm:text-sm`)

All changes use existing Tailwind CSS responsive utilities - no new dependencies needed.
