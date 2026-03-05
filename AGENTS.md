# IT Helpdesk LIFF App - Project Context

> **Version**: 1.4.0
> **Purpose**: Frontend web application using LINE Front-end Framework (LIFF) for submitting and tracking IT Helpdesk tickets, including image attachments and Team KPI Dashboard.
> **Integration**: LIFF SDK + Next.js + n8n Webhook + Microsoft SQL Server

---

## 1. Tech Stack
* **Framework**: Next.js 14 App Router
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui (for fast, clean enterprise UI)
* **Charts**: Recharts
* **LINE SDK**: @line/liff
* **Database Client**: mssql (SQL Server)

---

## 2. System Architecture
1. **Frontend (Next.js)**: Runs inside LINE App via LIFF. Handles UI/UX, authenticates user via liff.init(), gets userId and displayName, and converts image uploads to Base64.
2. **API Routes (Next.js)**: Dashboard queries SQL Server directly via /api/* endpoints using mssql package.
3. **API/Middleware (n8n)**: Frontend sends POST request to existing n8n webhook (Auto_Ticket_1.7) for ticket creation.
4. **Database**: Microsoft SQL Server [Dev_Born].[dbo].[ticket].

---

## 3. Core Features

### Feature 1: LIFF Initialization Provider
A global context that initializes LIFF and stores user profile data globally. Supports mock data for local development.

**File**: app/LiffProvider.tsx

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
**Statistical outlier detection using Per-Person Mean + 2SD method**

**Methodology**:
- Each staff member has their own threshold: personal_average + (2 × personal_stddev)
- Baseline from FULL YEAR data
- Month filter affects display only, NOT baseline calculation
- Requires at least 2 tickets per person for SD calculation

**Key Types**: types/outlier.ts
- OutlierTicket: message_id, assigned_to, subject, diff_minutes, created_date, assigned_date, deviation_score
- StaffStats: rank, name, totalAssigned, totalClosed, totalPending, avgTimeAll, avgTimeNormal, avgTimeOutlier, outlierCount

**Repository**: repository/OutlierRepository.ts

### Feature 5: Text Normalization
Utility to normalize stylized Unicode text to regular ASCII.

**File**: app/lib/normalizeText.ts

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
- Query: year (required), month (optional), filterType (required), staffName (optional)
- Returns: tickets array

#### GET /api/dashboard/available-months
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

### StaffPerformanceTable
- staff?, showOutlierColumns?, onOutlierClick?, onStaffClick?

### HeaderFilter
- year, setYear, month, setMonth, availableYears?, availableMonths?

### StatsCards
- total, closed, pending, avgTimeNormal?, avgTimeOutlier?, outlierCount?, outlierThreshold?, onCardClick?

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
- Threshold: mean + 2*sd
- Pending: diff_minutes = NULL

### Issues:
- Pending=0: Check NULL close_time_minute
- Wrong name: normalizeStylizedText()
- No data: /available-months
- Chart stuck: useEffect deps

---

## 10. Env Variables

SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD
NEXT_PUBLIC_N8N_WEBHOOK_URL
NEXT_PUBLIC_LIFF_ID