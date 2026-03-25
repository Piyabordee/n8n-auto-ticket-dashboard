# IT Helpdesk Dashboard - Project Context

> **Version**: 1.14.0
> **Purpose**: Web application for submitting and tracking IT Helpdesk tickets, including image attachments and Team KPI Dashboard.
> **Integration**: Next.js + n8n Webhook + Microsoft SQL Server
> **Last Updated**: 2026-03-25 - Staff Member ID Integration & Security Fixes

---

## 1. Tech Stack
* **Framework**: Next.js 14 App Router
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui
* **Charts**: Recharts
* **Authentication**: Placeholder (prepared for NextAuth.js, Clerk, etc.)
* **Database Client**: mssql (SQL Server)

---

## 2. System Architecture
1. **Frontend (Next.js)**: Handles UI/UX with mock authentication. Prepared for future auth integration.
2. **API Routes (Next.js)**: Dashboard queries SQL Server directly via /api/* endpoints using mssql package.
3. **API/Middleware (n8n)**: Frontend sends POST request to existing n8n webhook (Auto_Ticket_1.7) for ticket creation.
4. **Database**: Microsoft SQL Server [Dev_Born].[dbo].[ticket].

---

## 3. Core Features

### Feature 1: Auth Provider
A global context that provides authentication state. Currently uses mock user data.

**Files**:
- `app/components/auth/AuthProvider.tsx` - Provider component and useAuth() hook
- `types/auth.ts` - User and AuthContextType interfaces

**Mock User**:
```typescript
{
  id: 'admin',
  name: 'Admin User',
  role: 'admin'
}
```

**Usage**:
```typescript
import { useAuth } from '@/components/auth/AuthProvider'

const { user, loading, isAuthenticated } = useAuth()
```

**Future Auth**: Structure prepared for NextAuth.js, Clerk, Auth0, or Supabase Auth.

### Feature 2: Dashboard Page (/)
Shows KPI Cards, charts, staff performance table, and outliers list with year/month filtering.

**Key Components**:
- **StatsCards**: Clickable KPI cards (Total, Closed, Pending, Avg Time, Outliers)
- **MonthlyBarChart**: Full year monthly ticket volume with clickable months
- **InlineDailyChart**: Daily breakdown for selected month
- **StaffPerformanceTable**: Staff rankings with pending count and outlier breakdown
- **TopOutliersList**: Top 3 outliers with View All link
- **TicketListModal**: Modal for displaying filtered ticket lists

### Feature 3: Create Ticket Form (/create)
A form capturing Category, Sub-category, Branch, Problem details, and an Image Upload field with preview capability.

### Feature 4: Outlier Detection System
**Statistical outlier detection using Per-Person Median + 15×MAD method**

**Methodology**:
- Each staff member has their own threshold: personal_median + (15 × personal_mad)
- MAD (Median Absolute Deviation) is robust against outliers
- Baseline from FULL YEAR data
- Month filter affects display only, NOT baseline calculation
- Requires at least 2 tickets per person for MAD calculation

**Key Types**: types/outlier.ts
- OutlierTicket: message_id, updated_by, subject, diff_minutes, created_date, assigned_date, deviation_score
- StaffStats: rank, name, totalAssigned, totalClosed, totalPending, avgTimeAll, avgTimeNormal, avgTimeOutlier, outlierCount

**Repository**: repository/OutlierRepository.ts

### Feature 5: Mobile Responsive Design
**Mobile-first responsive UI using Tailwind CSS breakpoints**

**Breakpoints Used**:
- `< 640px` (default): Mobile phones - 1 column grids, card views for tables
- `sm: 640px+`: Small tablets, large phones - 2 columns
- `md: 768px+`: Tablets - Desktop table views enabled
- `lg: 1024px+`: Small desktops, laptops - 4-5 columns
- `xl: 1280px+`: Desktops

**Responsive Patterns**:
- **Cards**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4/5 gap-3`
- **Tables**: Mobile card view (`md:hidden`) + Desktop table (`hidden md:block`)
- **Modals**: `p-2 sm:p-4`, `max-w-full sm:max-w-6xl`, `max-h-[95vh] sm:max-h-[90vh]`
- **Charts**: `height={250}` (mobile) / `300` (desktop)
- **Typography**: `text-xs sm:text-sm` labels, `text-2xl sm:text-3xl` numbers
- **Spacing**: `px-3 sm:px-4`, `py-4 sm:py-6`, `gap-2 sm:gap-4`

**Modified Components**:
- StatsCards, HeaderFilter, MonthlyBarChart, InlineDailyChart
- TopOutliersList, StaffPerformanceTable, TicketListModal
- DailyBarChart, OutlierTable, MonthlyTicketList, TicketDetailModal
- Main page and outliers page

**Documentation**: See `docs/mobile-responsive.md` for detailed patterns

### Feature 6: Staff Member ID Integration (Version 1.14.0)
**Centralized staff management with userId references and it_team table lookup**

**Key Changes**:
- **TeamMemberCache Service**: Loads staff from `it_team` table at startup for fast lookups
- **SQL JOIN Pattern**: Report queries use `INNER JOIN it_team` to get display names
- **Database Schema**: `updated_by` and `assigned_to` now store userId (e.g., "Ub4c47e7e4f26bc5cee8868372fb6d759")
- **Display Names**: Thai names (หลวิชัย, พชร, อภิสิทธิ์) come from `it_team.fromUser`
- **Active Staff Filter**: `WHERE tm.active = 'Y'` excludes inactive staff
- **Removed normalizeStylizedText**: No longer needed since stylized names are stored in database

**Files**:
- `app/lib/teamMemberCache.ts` - Cache service for userId → displayName mapping
- `app/lib/appInitialization.ts` - App startup initialization
- `types/outlier.ts` - Added TeamMember and TeamMemberCacheConfig types
- All report queries updated with SQL JOIN pattern

**API Changes**:
- `/api/dashboard/staff` - Added SQL JOIN with it_team
- `/api/dashboard/report` - Added SQL JOIN with it_team
- `/api/dashboard/outliers/*` - Added SQL JOIN with it_team
- `/api/dashboard/tickets` - Uses TeamMemberCache for name lookup
- `/api/dashboard/ticket/[message_id]` - Uses TeamMemberCache for name lookup
- `/api/dashboard/monthly-tickets` - Uses TeamMemberCache for name lookup

**Documentation**: See `docs/migrations/staff-member-id-integration.md` for details

### Feature 7: Text Normalization
Utility to normalize stylized Unicode text to regular ASCII.

**File**: app/lib/normalizeText.ts

**Status**: Legacy - No longer used after Staff Member ID Integration

### Feature 7: Outlier Explanation Modal
**Modal explaining the outlier detection methodology with ELI5, technical, and per-person stats sections**

**Component**: `app/components/dashboard/OutlierExplanationModal.tsx`

**Sections**:
- **ELI5 Section**: Simple explanation of what outliers are with examples
- **Technical Section**: Median + 15×MAD calculation method explanation
- **Staff Data Table**: Per-person statistics showing:
  - personalMedian: Each staff member's median resolution time
  - personalMAD: Median Absolute Deviation for each person
  - personalThreshold: Median + (15 × MAD) - the outlier threshold
  - outlierCount: Number of outliers for each staff member

**Trigger**: Click on "Avg Time" card in StatsCards

**Props**:
- isOpen, onClose, year

### Feature 8: Global Search
**Global ticket search with debounced autocomplete and full results modal**

**Component**: `app/components/dashboard/GlobalSearch.tsx`

**Features**:
- **Debounced Search**: 300ms debounce for efficient API calls
- **Autocomplete Dropdown**: Shows top 10 results as you type
- **Full Results Modal**: Press Enter to see all results in modal
- **Search Scope**: Searches across subject, updated_by, branch, and category
- **Click Outside**: Automatically closes dropdown when clicking outside

**API Extension**: `/api/dashboard/tickets` now supports:
- `status=all`: Include all statuses
- `search=<query>`: Search query string

**Props**:
- year, month

### Feature 9: Stat Click Filtering
**Clickable stats in charts and tables to open filtered ticket modals**

**Affected Components**:
- **DailyBarChart**: Click on "All" or "Pending" bars to open filtered modal
- **StaffPerformanceTable**: Click on outlier count or staff stats to open filtered modal
- **MonthlyBarChart**: Click on month bars (already implemented)
- **StatsCards**: Click on cards (already implemented)

**Filter Types Added**:
- `outlier`: Filter by outlier tickets only
- `pending`: Filter by pending tickets only
- `all`: Filter by all tickets

**Modal Title Updates**: Titles now show the filter type (e.g., "งาน Outlier", "งานยังไม่ปิด", "งานทั้งหมด")

### Feature 10: Outlier Storage (Version 1.9.0)
**Persistent outlier classification stored in database**

**Key Changes**:
- `is_outlier BIT` column added to ticket table
- Outlier classification calculated once on server startup
- No version tracking - always recalculates on startup (simple)
- Simple `WHERE is_outlier = 1` queries instead of complex CTEs

**How It Works**:
1. Server starts → Initializes schema if needed
2. ALWAYS recalculates ALL outliers using current algorithm
3. Stores results in `is_outlier` column
4. All queries use stored values (10-20x faster)

**To Change Detection Algorithm**:
1. Update calculation logic in `OutlierRepository.recalculateAllOutliers()`
2. Restart server → Auto-recalculation runs
3. Or call `POST /api/admin/recalc-outliers`

**Performance**:
- Before: ~500-1000ms per request (complex CTEs)
- After: ~50-100ms per request (simple WHERE clause)
- Startup cost: ~30-60 seconds for 10,000 tickets (every startup)

**Files**:
- `app/lib/sql.ts` - Schema initialization
- `app/lib/outlierInitialization.ts` - Startup recalculation service
- `repository/OutlierRepository.ts` - Batch calculation methods
- `app/api/admin/recalc-outliers/route.ts` - Manual recalc endpoint

### Feature 11: Accessibility & Animations (Version 1.10.0)
**WCAG-compliant accessibility improvements with smooth animations**

**Accessibility Enhancements**:
- **ARIA Labels**: Descriptive labels for screen readers on all interactive elements
- **Keyboard Navigation**: Full keyboard support with Enter/Space handlers
- **Focus Management**: Visible focus rings with `ring-2 ring-primary-500 ring-offset-2`
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Semantic HTML**: Proper `role="button"`, `tabIndex={0}`, `aria-label` attributes

**Animation System**:
- **Count-Up Animations**: Smooth number transitions with `useCountUp` hook
  - Uses `requestAnimationFrame` for 60fps performance
  - Disabled in test environment for predictable values
  - Ease-out-expo easing for natural deceleration
- **Entrance Animations**: Staggered slide-up-fade on mount
  - `animate-on-mount`, `animate-slide-up-fade` classes
  - Staggered delays (0-4) for choreographed entrances
  - Disabled when `prefers-reduced-motion` is set
- **Press Feedback**: Micro-interaction scale effect on click
  - `scale-[0.98]` on press, `hover:scale-[1.02]` on hover
  - Smooth 200ms transitions with `--ease-out-quart`

**Custom Easing Curves**:
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);  /* Confident deceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1); /* Smooth, refined */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1); /* Slightly snappier */
```

**Files Modified**:
- `app/components/dashboard/StatsCards.tsx` - Count-up animations, keyboard handlers, ARIA labels
- `app/components/dashboard/DailyBarChart.tsx` - Accessibility labels
- `app/components/dashboard/StaffPerformanceTable.tsx` - Accessibility improvements
- `app/components/dashboard/OutlierExplanationModal.tsx` - Accessibility labels
- `app/globals.css` - Animation keyframes, reduced motion, easing curves

**InteractiveCard Component**:
- Reusable accessible card with keyboard support
- Proper `role="button"`, `tabIndex={0}`, `aria-label`
- Press state handling with mouse events
- Focus-visible styling for keyboard navigation

### Feature 12: Ticket Detail Enhancement (Version 1.10.0)
**Enhanced ticket detail modal with close cause and reason display**

**Enhancements**:
- **Close Cause Display**: Shows "ปัญหา/อาการ" (close_cause) in basic section
- **Close Reason Display**: Shows "การแก้ไขปัญหา" (close_reason) in basic section
- Both fields display "-" when empty

**Component**: `app/components/dashboard/TicketDetailModal.tsx`

**Props**: isOpen, onClose, messageId

### Feature 13: Lazy API Initializer (Version 1.10.0)
**Lazy initialization system for outlier detection to ensure API readiness**

**How It Works**:
- Ensures outlier detection is initialized before serving API requests
- Uses lazy initialization - only runs once
- Safe to call multiple times - will only initialize once
- Falls back gracefully if initialization fails

**File**: `app/lib/apiInitializer.ts`

**Function**:
```typescript
ensureOutlierInitialized(): Promise<void>
```

**Used In**:
- `/api/dashboard/staff` - Ensures initialization before staff performance queries
- All other outlier-dependent APIs

### Feature 14: Outlier Flag Display (Version 1.10.0)
**Proper is_outlier flag propagation for consistent red styling**

**Enhancements**:
- **TicketListModal**: Now adds `is_outlier: 1` flag when converting outlier tickets
- **Monthly Tickets API**: Added `is_outlier` field to SELECT query and response mapping
- **DailyBarChart**: Added `is_outlier` to Ticket interface

**Files Modified**:
- `app/components/dashboard/TicketListModal.tsx`
- `app/api/dashboard/monthly-tickets/route.ts`
- `app/components/dashboard/DailyBarChart.tsx`

**Fix**: Outliers in "รายละเอียดประจำเดือน" modal now show in red color correctly

### Feature 15: Refresh Functionality (Version 1.11.0)
**Spin animation for dashboard data refresh**

**Enhancements**:
- **Refresh Button**: Added refresh button with spin animation in HeaderFilter
- **Animation**: Spin animation while fetching data, stops when complete
- **State Management**: Tracks refreshing state to prevent duplicate requests
- **User Feedback**: Visual feedback during data refresh

**Files Modified**:
- `app/components/dashboard/HeaderFilter.tsx` - Added refresh button with spin animation
- Main dashboard page - Added handleRefresh function

**Props**: year, month, onRefresh callback

### Feature 16: Monthly Report with PDF Export (Version 1.11.0)
**Print page for monthly report with dynamic data fetching and PDF export**

**Enhancements**:
- **Print Page Route**: New `/print` route for printable monthly reports
- **PDF Export**: Export reports to PDF using jsPDF and html2canvas
- **Progress Indicator**: Shows progress during PDF generation
- **Pie Chart**: Custom pie chart with label rendering for category distribution
- **Data Fetching**: Dynamic data fetching for selected year/month
- **Color Handling**: Proper oklch to hex color conversion for PDF compatibility
- **Scoped Styles**: PDF-specific styles scoped to wrapper only
- **Text Truncation Fix**: Prevents text cutoff in PDF export

**Files Modified**:
- `app/print/page.tsx` - New print page for monthly reports
- `app/lib/pdfExport.ts` - PDF export utility with jsPDF/html2canvas
- `app/components/dashboard/CategoryPieChart.tsx` - Pie chart with custom labels
- `app/components/dashboard/SectionSelectorDropdown.tsx` - Section selection
- `package.json` - Added jspdf and html2canvas dependencies

**Features**:
- Selectable sections for report (overview, charts, staff, outliers)
- LocalStorage persistence for section preferences
- Download PDF button with progress indicator
- Print-optimized layout

### Feature 17: Section Selector Dropdown (Version 1.11.0)
**Component for selecting report sections**

**Component**: `app/components/dashboard/SectionSelectorDropdown.tsx`

**Features**:
- **Multi-Select**: Select multiple sections for the report
- **Sections Available**: Overview, Charts, Staff Performance, Outliers
- **LocalStorage**: Persists user selections across sessions
- **Dropdown UI**: Clean dropdown interface with checkboxes

**Props**:
- selectedSections, onChange

### Feature 18: Report Section Configuration (Version 1.11.0)
**LocalStorage persistence for report section preferences**

**Features**:
- **LocalStorage Key**: `monthly-report-sections`
- **Default Sections**: Overview, Charts, Staff, Outliers
- **Persistence**: User selections saved across browser sessions
- **Initialization**: Loads saved preferences on component mount

**Usage**:
```typescript
const [selectedSections, setSelectedSections] = useState<string[]>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('monthly-report-sections')
    return saved ? JSON.parse(saved) : ['overview', 'charts', 'staff', 'outliers']
  }
  return ['overview', 'charts', 'staff', 'outliers']
})
```

### Feature 19: Enhanced Pie Chart (Version 1.11.0)
**Custom pie chart with label rendering for category distribution**

**Component**: `app/components/dashboard/CategoryPieChart.tsx`

**Features**:
- **Custom Labels**: Label rendering with position calculation
- **Color Palette**: Uses theme colors for category differentiation
- - **Responsive**: Adapts to mobile (250px) and desktop (300px) sizes
- **Legend**: Shows category names and percentages
- **Accessibility**: ARIA labels for screen readers

**Props**:
- data (CategoryData[]), showLegend (default: true)

### Feature 20: Status Filter Enhancement (Version 1.11.0)
**Exclude 'unsent' tickets from queries**

**Enhancements**:
- **Query Filter**: Added `status != 'unsent'` to ticket queries
- **Cleaner Data**: Excludes unsent/unprocessed tickets from statistics
- **Consistent Filtering**: Applied across all ticket query endpoints

**Affected APIs**:
- `/api/dashboard/tickets` - Excludes unsent tickets
- `/api/dashboard/monthly-tickets` - Excludes unsent tickets

### Feature 21: Monthly Report Modal (Version 1.12.0)
**Comprehensive monthly report modal with customization**

**Component**: `app/components/dashboard/MonthlyReportModal.tsx`

**Features**:
- **Modal Rendering**: Uses createPortal to avoid layout issues
- **Report Sections**: Four sections with pie charts and data tables
  - Section 1: Overall Ticket Summary (by Category)
  - Section 2: Software Deep Dive (by Software Sub-category)
  - Section 3: Software Problem Grouping (by Hardware Sub-category)
  - Section 4: POS/RATE Error Causes (by Close Cause)
- **Settings Button**: Opens ReportConfigModal for customization
- **Print Button**: Opens print page for PDF export
- **Focus Trap**: Proper keyboard navigation within modal
- **Backdrop Click**: Close modal when clicking outside
- **Animation**: Smooth entrance/exit animations

**Props**:
- isOpen, onClose, year, month

### Feature 22: Report Configuration Modal (Version 1.12.0)
**Modal for customizing monthly report sections and charts**

**Component**: `app/components/dashboard/ReportConfigModal.tsx`

**Features**:
- **Section Visibility**: Toggle which sections appear in report
- **Multi-Select Section Names**: Choose multiple categories/sub-categories for each section
- **Multi-Select Chart Names**: Customize pie chart titles with multiple selections
- **Select All Checkbox**: Quick selection for all options in a dropdown
- **Dynamic Options**: Fetches dropdown options from database based on year/month
- **Reset Confirmation**: Confirm before resetting all custom names
- **Accessibility**: Proper ARIA labels, keyboard navigation, focus management

**Props**:
- isOpen, onClose, onSave, sections, year, month

### Feature 23: Report Config Utility (Version 1.12.0)
**Utility library for managing custom report names**

**File**: `app/lib/reportConfig.ts`

**Functions**:
- `loadCustomNames()`: Load custom names from localStorage
- `saveCustomNames(names)`: Save custom names to localStorage
- `resetCustomNames()`: Clear all custom names
- `getSectionDisplayName(config)`: Get display name for section header
- `getChartDisplayName(config)`: Get display name for chart
- `mergeCustomNames(sections, customNames)`: Merge custom names into sections
- `extractCustomNames(sections)`: Extract custom names for saving

**LocalStorage Key**: `monthly-report-section-names`

**DEFAULT_CHART_TITLES**:
- section1: 'Category'
- section2: 'Software'
- section3: 'Sub Services'
- section4: 'Causes'

### Feature 24: Data Filtering by Custom Names (Version 1.12.0)
**Filter report data based on selected custom section names**

**How It Works**:
- When custom section names are selected, report API is called with filter parameters
- Section filters map to database fields:
  - section1Filter → category
  - section2Filter → sub_category (Software)
  - section3Filter → sub_category (Hardware)
  - section4Filter → close_cause
- Multiple values are comma-separated in API call
- Server filters data based on selected values

**API**: `/api/dashboard/report` supports:
- `section1Filter`: Comma-separated category names
- `section2Filter`: Comma-separated software sub-categories
- `section3Filter`: Comma-separated hardware sub-categories
- `section4Filter`: Comma-separated close causes

### Feature 25: Report Options API (Version 1.12.0)
**API endpoint for fetching dropdown options**

**Endpoint**: `GET /api/dashboard/report/options`

**Query Params**:
- year (required): Year for data filtering
- month (required): Month for data filtering

**Returns**:
```json
{
  "categories": ["Hardware", "Software", ...],
  "subCategoriesSoftware": ["Installation", "License", ...],
  "subCategoriesHardware": ["Monitor", "Keyboard", ...],
  "closeCauses": ["User Error", "System Bug", ...]
}
```

**Usage**: Populates dropdown options in ReportConfigModal

### Feature 26: createPortal Modal Rendering (Version 1.12.0)
**Proper modal rendering using React Portal**

**How It Works**:
- Uses `ReactDOM.createPortal()` to render modals outside the DOM hierarchy
- Prevents z-index and overflow issues with nested components
- Modals render to a dedicated portal container at document.body level

**Benefits**:
- Avoids layout issues with parent containers
- Proper z-index stacking for nested modals
- CSS isolation from parent components

**Files**:
- All modal components now use portal rendering
- ModalProvider manages portal container

---

## 4. API Endpoints

### 4.1 New Ticket Creation (n8n)
POST {{N8N_WEBHOOK_URL}}
Configure in .env.local as NEXT_PUBLIC_N8N_WEBHOOK_URL

### 4.2 Dashboard APIs

#### GET /api/dashboard/kpi
KPI stats for selected period.
- Query: year (required), month (optional)
- Returns: total, closed, closeRate, avgTime, pending

#### GET /api/dashboard/monthly
Monthly ticket volume for bar chart.
- Query: year (required)
- Returns: 12 months array with month, monthName, total, closed, monthIndex

#### GET /api/dashboard/daily
Daily breakdown for selected month.
- Query: year (required), month (required)
- Returns: daily array with day, total, closed

#### GET /api/dashboard/staff
Staff performance with outlier breakdown.
- Query: year (required), month (optional)
- Returns: staff array, summary
**IMPORTANT**: Shows PENDING (ยังไม่ปิด) not closed. Ranking by totalAssigned. Pending = NULL close_time_minute.

#### GET /api/dashboard/outliers/top3
Top 3 outliers preview.
- Query: year (required), month (optional)
- Returns: top3 array, total_count

#### GET /api/dashboard/outliers/all
All outliers details.
- Query: year (required), month (optional)
- Returns: outliers array, summary

#### GET /api/dashboard/tickets
Filtered tickets for modals.
- Query: year (required), month (optional), filterType (required), staffName (optional), status (optional), search (optional)
- Returns: tickets array
- **New Parameters**:
  - `status=all`: Include all statuses (not just active)
  - `search=<query>`: Search across subject, updated_by, branch, category

#### GET /api/dashboard/ticket/[message_id]
Single ticket detail with full information.
- Query: year (required), month (optional)
- Returns: ticket object with all details including category, sub_category, branch, etc.

#### GET /api/dashboard/monthly-tickets
Available years and months.
- Returns: years array, months array
- **New**: Each ticket now includes `is_outlier` field for proper red styling

#### GET /api/dashboard/report
Monthly report data with optional filters.
- Query: year (required), month (required), section1Filter?, section2Filter?, section3Filter?, section4Filter?
- Returns: Report data with sections filtered by custom names
- **Filters**: Comma-separated values for category, sub-category, close_cause

#### GET /api/dashboard/report/options
Dropdown options for report configuration.
- Query: year (required), month (required)
- Returns: categories, subCategoriesSoftware, subCategoriesHardware, closeCauses

### 4.3 Admin APIs

#### POST /api/admin/recalc-outliers
Manually trigger outlier recalculation.
- Returns: { success: true, recalculated: number, duration_ms: number }

#### GET /api/admin/recalc-outliers
Get current initialization status.
- Returns: { initialized: boolean, lastRecalcDate: string, totalOutliers: number }

---

## 5. Database Schema

### Table: [Dev_Born].[dbo].[ticket]

| Column | Type | Description |
|--------|------|-------------|
| message_id | string | Unique ID |
| updated_by | string | Staff userId (references it_team.userId) |
| assigned_to | string | Staff userId (references it_team.userId) |
| subject | string | Subject |
| status | string | closed, pending, unsent, etc. |
| created_date | datetime | Created |
| assigned_date | datetime | Assigned |
| close_time_minute | int | Minutes to close (NULL if pending) |
| is_outlier | bit | Outlier classification (1=outlier, 0/NULL=normal) |

**it_team Table**:
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| fromUser | NVARCHAR | Display name (e.g., "หลวิชัย") |
| userId | NVARCHAR | Unique ID (e.g., "Ub4c47e7e4f26bc5cee8868372fb6d759") |
| active | CHAR(1) | 'Y' or 'N' |
| email_spiceworks | NVARCHAR | Email address |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |

**Important**:
- Pending tickets: close_time_minute = NULL
- Active filter: status != 'unsent'
- Staff names stored as userId in ticket table
- Display names fetched via INNER JOIN with it_team table
- See docs/migrations/staff-member-id-integration.md for details

---

## 6. Text Normalization

**File**: app/lib/normalizeText.ts
Converts stylized Unicode to ASCII.
Used in: /api/dashboard/staff, /api/tickets

**SQL Cleanup** (2026-03-04): 23 records updated

---

## 7. Component Props

### StatsCards
- total, closed, pending, avgTimeNormal?, avgTimeOutlier?, outlierCount?, outlierThreshold?, onCardClick?
- **New**: onAvgTimeClick handler for opening OutlierExplanationModal

### OutlierExplanationModal
- isOpen, onClose, year

### GlobalSearch
- year, month

### SearchResultsModal
- isOpen, onClose, year, month, searchQuery

### StaffPerformanceTable
- staff?, showOutlierColumns?, onOutlierClick?, onStaffClick?
- **New**: onStatClick handler for clicking outlier count

### DailyBarChart
- data, onStatClick
- **New**: Clickable bars with stat filtering

### HeaderFilter
- year, setYear, month, setMonth, availableYears?, availableMonths?
- **New**: onRefresh handler for data refresh with spin animation

### SectionSelectorDropdown
- selectedSections, onChange
- Multi-select dropdown for report sections with localStorage persistence

### CategoryPieChart
- data, showLegend?
- Custom pie chart with label rendering for category distribution

### TicketListModal
- isOpen, onClose, year, month?, filterType, title, staffName?
- **New**: Adds `is_outlier: 1` flag to converted outlier tickets for red styling

### TicketDetailModal
- isOpen, onClose, messageId
- Shows close_cause and close_reason fields in basic section

### MonthlyReportModal
- isOpen, onClose, year, month
- Comprehensive monthly report with four sections
- Settings button for ReportConfigModal
- Print button for PDF export
- Uses createPortal for proper modal rendering

### ReportConfigModal
- isOpen, onClose, onSave, sections, year, month
- Modal for customizing report sections and chart titles
- Multi-select dropdowns with Select All checkbox
- Fetches dropdown options from database
- Reset confirmation dialog

---

## 8. Thai Labels

| Thai | English | Context |
|------|---------|---------|
| ทั้งปี | All Year | Filter |
| งานทั้งหมด | All | Filter |
| ยังไม่ปิด | Pending | Status |
| ปิดแล้ว | Closed | Status |
| ปิดงาน | Closed By | Column |
| เวลาเฉลี่ย | Avg Time | Column |
| ผลงานทีม | Staff Performance | Section |
| รายงานประจำเดือน | Monthly Report | Feature |
| ส่งออก PDF | Export PDF | Action |
| รีเฟรชข้อมูล | Refresh Data | Action |

---

## 9. Dev Reference

### Add metric:
1. SQL to repository
2. API route in app/api/dashboard/*
3. Type in types/outlier.ts
4. Update component

### Debug outlier:
- repository/OutlierRepository.ts SQL
- Full year CTE baseline
- Threshold: median + 15*mad (MAD = Median Absolute Deviation)
- Pending: diff_minutes = NULL

### Database Connection (Updated 2026-03-09):

**Shared Connection Pool Architecture:**

All API routes use a centralized shared connection pool defined in `app/lib/sql.ts`:

```typescript
import { getConnection } from '@/lib/sql'

export async function GET(request: NextRequest) {
  const pool = await getConnection()
  const result = await pool.request().query(...)
}
```

**Key Implementation Details:**
- **Singleton Pattern**: Single `sharedPool` instance shared across all requests
- **Promise Locking**: `connectingPromise` prevents multiple simultaneous connection attempts
- **Connection Verification**: Checks `pool.connected` before returning the pool
- **Error Tracking**: `connectionError` caches failed connection attempts

**How It Works:**
1. First request triggers `sql.connect(sqlConfig)` and stores the promise
2. Concurrent requests wait for the same promise (prevents race conditions)
3. Once connected, `sharedPool.connected` check returns immediately
4. Promise is kept after connection to indicate completion

**Common Issues:**
- **ENOTOPEN Error**: "Connection not yet open" - occurs when multiple routes create separate pools
  - **Solution**: All routes must use `getConnection()` from `app/lib/sql.ts`
- **Pending=0**: Check NULL close_time_minute
- **Wrong name**: Use normalizeStylizedText()
- **No data**: Check /available-months endpoint
- **Chart stuck**: Check useEffect dependencies

### Auth Migration (2026-03-09):
LIFF integration removed and replaced with placeholder auth:
- LiffProvider → AuthProvider
- useLiff() → useAuth()
- profile → user
- @line/liff package removed
- types/liff.ts removed, replaced with types/auth.ts

### Mobile Responsiveness (2026-03-10):
Full mobile responsiveness implemented across all dashboard components:
- Mobile-first approach using Tailwind CSS responsive utilities
- Table components now have card views for mobile (`md:hidden`)
- Modals scale appropriately: full width on mobile, max-width on desktop
- Charts: 250px height on mobile, 300px on desktop
- Typography scales: `text-xs sm:text-sm`, `text-base sm:text-lg`, etc.
- Documentation in `docs/mobile-responsive.md`

### Outlier Explanation Modal (2026-03-11):
Added OutlierExplanationModal component with:
- ELI5 section explaining outliers in simple terms
- Technical section explaining Median + 15×MAD methodology
- Staff data table showing per-person Median, MAD, Threshold, and Outlier counts
- Triggered by clicking on "Avg Time" card

### Global Search (2026-03-11):
Added GlobalSearch component with:
- Debounced autocomplete search (300ms)
- Top 10 results dropdown
- Full results modal on Enter key
- Searches across subject, updated_by, branch, category

### Stat Click Filtering (2026-03-11):
Added click handlers for stats:
- DailyBarChart: Click bars to filter by All/Pending
- StaffPerformanceTable: Click outlier count to filter outliers
- Modal titles now show filter type (งาน Outlier, งานยังไม่ปิด, งานทั้งหมด)

### Updated API (2026-03-11):
- `/api/dashboard/tickets`: Added `status=all` and `search=<query>` parameters
- `/api/dashboard/ticket/[message_id]`: New endpoint for single ticket details
- `/api/dashboard/staff`: Added personalMedian, personalMAD, personalThreshold to response

### Outlier Storage (2026-03-16):
Persistent outlier classification implemented:
- Added `is_outlier BIT` column to ticket table
- Startup recalculation service in `app/lib/outlierInitialization.ts`
- Batch calculation methods in `repository/OutlierRepository.ts`
- Admin endpoint `POST /api/admin/recalc-outliers` for manual recalculation
- 10-20x query performance improvement (500-1000ms → 50-100ms)
- Schema initialization in `app/lib/sql.ts`
- Documentation in `docs/outlier-storage.md`

### Accessibility & Animations (2026-03-16):
WCAG-compliant accessibility and smooth animations implemented:
- Count-up animations with `useCountUp` hook using `requestAnimationFrame`
- Keyboard navigation support (Enter/Space) for all interactive cards
- ARIA labels for screen readers with Thai language support
- Focus-visible styling with proper ring offsets
- Reduced motion support respecting user preferences
- Entrance animations with staggered delays
- Press feedback with micro-interactions
- Custom easing curves (expo, quart, quint) for natural motion
- `InteractiveCard` component for reusable accessible patterns

### Ticket Detail Enhancement (2026-03-16):
Added close cause and reason display in TicketDetailModal:
- Shows "ปัญหา/อาการ" (close_cause) field
- Shows "การแก้ไขปัญหา" (close_reason) field
- Both display "-" when empty

### Lazy API Initializer (2026-03-16):
Implemented lazy initialization for outlier detection:
- `app/lib/apiInitializer.ts` with `ensureOutlierInitialized()` function
- Only initializes once, safe to call multiple times
- Falls back gracefully if initialization fails
- Used in staff API and other outlier-dependent endpoints

### Outlier Flag Display (2026-03-16):
Fixed is_outlier flag propagation for consistent styling:
- TicketListModal now adds `is_outlier: 1` to converted tickets
- Monthly tickets API includes `is_outlier` in response
- DailyBarChart Ticket interface includes `is_outlier`
- Fixes outliers in "รายละเอียดประจำเดือน" modal to show red correctly

### Refresh Functionality (2026-03-18):
Added refresh functionality with spin animation:
- Refresh button in HeaderFilter with spin animation
- Visual feedback during data refresh
- State management to prevent duplicate requests
- `app/components/dashboard/HeaderFilter.tsx` modified

### Monthly Report with PDF Export (2026-03-18):
Implemented monthly report print page with PDF export:
- New `/print` route for printable monthly reports
- PDF export using jsPDF and html2canvas libraries
- Progress indicator during PDF generation
- Custom pie chart (CategoryPieChart) with label rendering
- SectionSelectorDropdown for selecting report sections
- LocalStorage persistence for section preferences
- oklch to hex color conversion for PDF compatibility
- Scoped styles to prevent page bugs
- Files: `app/print/page.tsx`, `app/lib/pdfExport.ts`, `app/components/dashboard/CategoryPieChart.tsx`

### Section Selector Dropdown (2026-03-18):
Added component for selecting report sections:
- `app/components/dashboard/SectionSelectorDropdown.tsx`
- Multi-select with checkboxes
- Sections: Overview, Charts, Staff, Outliers
- LocalStorage persistence

### Report Section Configuration (2026-03-18):
Implemented localStorage persistence for report sections:
- Key: `monthly-report-sections`
- Default: All sections enabled
- Loads saved preferences on mount

### Status Filter Enhancement (2026-03-18):
Enhanced ticket queries to exclude 'unsent' status:
- Added `status != 'unsent'` filter to queries
- Cleaner statistics by excluding unprocessed tickets
- Applied across `/api/dashboard/tickets` and `/api/dashboard/monthly-tickets`

### Enhanced Pie Chart (2026-03-18):
Custom pie chart with label rendering:
- `app/components/dashboard/CategoryPieChart.tsx`
- Custom label rendering with position calculation
- Theme color palette for categories
- Responsive: 250px mobile, 300px desktop
- Legend with percentages
- Accessibility: ARIA labels

### Monthly Report Modal (2026-03-19):
Comprehensive monthly report modal with customization:
- `app/components/dashboard/MonthlyReportModal.tsx`
- Four report sections with pie charts and data tables
- Settings button for ReportConfigModal
- Print button for PDF export
- Focus trap and backdrop click handling
- Smooth entrance/exit animations
- Uses createPortal for proper modal rendering

### Report Configuration Modal (2026-03-19):
Modal for customizing monthly report sections and charts:
- `app/components/dashboard/ReportConfigModal.tsx`
- Section visibility toggles
- Multi-select dropdowns for section and chart names
- Select All checkbox for quick selection
- Dynamic dropdown options fetched from database
- Reset confirmation dialog
- Accessibility: ARIA labels, keyboard navigation

### Report Config Utility (2026-03-19):
Utility library for managing custom report names:
- `app/lib/reportConfig.ts`
- LocalStorage persistence for custom names
- Functions: loadCustomNames, saveCustomNames, resetCustomNames
- Display name helpers: getSectionDisplayName, getChartDisplayName
- Merge and extract utilities for custom names

### Data Filtering by Custom Names (2026-03-19):
Filter report data based on selected custom section names:
- Custom names map to database fields (category, sub_category, close_cause)
- Multiple values sent as comma-separated in API call
- `/api/dashboard/report` accepts section filter parameters
- Server filters data based on selected values

### Report Options API (2026-03-19):
API endpoint for fetching dropdown options:
- `/api/dashboard/report/options`
- Returns: categories, subCategoriesSoftware, subCategoriesHardware, closeCauses
- Filters by year/month for relevant data
- Populates dropdown options in ReportConfigModal

### createPortal Modal Rendering (2026-03-19):
Proper modal rendering using React Portal:
- All modals now use ReactDOM.createPortal()
- Renders modals outside DOM hierarchy at document.body level
- Prevents z-index and overflow issues with nested components
- CSS isolation from parent containers

---

## 10. Env Variables

SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD
NEXT_PUBLIC_N8N_WEBHOOK_URL
