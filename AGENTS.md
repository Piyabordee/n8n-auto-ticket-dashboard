# IT Helpdesk Dashboard - Project Context

> **Version**: 1.8.0
> **Purpose**: Web application for submitting and tracking IT Helpdesk tickets, including image attachments and Team KPI Dashboard.
> **Integration**: Next.js + n8n Webhook + Microsoft SQL Server
> **Last Updated**: 2026-03-11 - Outlier Explanation Modal, Global Search, Stat Click Filtering

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
- OutlierTicket: message_id, assigned_to, subject, diff_minutes, created_date, assigned_date, deviation_score
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

### Feature 6: Text Normalization
Utility to normalize stylized Unicode text to regular ASCII.

**File**: app/lib/normalizeText.ts

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
- **Search Scope**: Searches across subject, assigned_to, branch, and category
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
  - `search=<query>`: Search across subject, assigned_to, branch, category

#### GET /api/dashboard/ticket/[message_id]
Single ticket detail with full information.
- Query: year (required), month (optional)
- Returns: ticket object with all details including category, sub_category, branch, etc.

#### GET /api/dashboard/monthly-tickets
Available years and months.
- Returns: years array, months array

---

## 5. Database Schema

### Table: [Dev_Born].[dbo].[ticket]

| Column | Type | Description |
|--------|------|-------------|
| message_id | string | Unique ID |
| assigned_to | string | Staff name (may be stylized) |
| subject | string | Subject |
| status | string | closed, pending, unsent, etc. |
| created_date | datetime | Created |
| assigned_date | datetime | Assigned |
| close_time_minute | int | Minutes to close (NULL if pending) |

**Important**:
- Pending tickets: close_time_minute = NULL
- Active filter: status != 'unsent'
- Use normalizeStylizedText() for names

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

### TicketListModal
- isOpen, onClose, year, month?, filterType, title, staffName?

---

## 8. Thai Labels

| Thai | English | Context |
|------|---------|---------|
| ทั้งปี | All Year | Filter |
| งานทั้งหมด | All | Filter |
| ยังไม่ปิด | Pending | Status |
| ปิดแล้ว | Closed | Status |
| รับงาน | Assigned | Column |
| เวลาเฉลี่ย | Avg Time | Column |
| ผลงานทีม | Staff Performance | Section |

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
- Searches across subject, assigned_to, branch, category

### Stat Click Filtering (2026-03-11):
Added click handlers for stats:
- DailyBarChart: Click bars to filter by All/Pending
- StaffPerformanceTable: Click outlier count to filter outliers
- Modal titles now show filter type (งาน Outlier, งานยังไม่ปิด, งานทั้งหมด)

### Updated API (2026-03-11):
- `/api/dashboard/tickets`: Added `status=all` and `search=<query>` parameters
- `/api/dashboard/ticket/[message_id]`: New endpoint for single ticket details
- `/api/dashboard/staff`: Added personalMedian, personalMAD, personalThreshold to response

---

## 10. Env Variables

SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD
NEXT_PUBLIC_N8N_WEBHOOK_URL
