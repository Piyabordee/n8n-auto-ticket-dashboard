# IT Helpdesk LIFF App - Project Context

> **Version**: 1.3.0
> **Purpose**: Frontend web application using LINE Front-end Framework (LIFF) for submitting and tracking IT Helpdesk tickets, including image attachments and Team KPI Dashboard.
> **Integration**: LIFF SDK + Next.js + n8n Webhook + Microsoft SQL Server

## 1. Tech Stack
* **Framework**: Next.js App Router
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui (for fast, clean enterprise UI)
* **Charts**: Recharts
* **LINE SDK**: @line/liff
* **Database Client**: mssql (SQL Server)

## 2. System Architecture
1. **Frontend (Next.js)**: Runs inside LINE App via LIFF. Handles UI/UX, authenticates user via `liff.init()`, gets `userId` and `displayName`, and converts image uploads to Base64.
2. **API Routes (Next.js)**: Dashboard queries SQL Server directly via `/api/tickets` endpoint using mssql package.
3. **API/Middleware (n8n)**: Frontend sends POST request to existing n8n webhook (Auto_Ticket_1.7) for ticket creation.
4. **Database**: Microsoft SQL Server `[Dev_Born].[dbo].[ticket]`.

## 3. Core Features Built
* **Feature 1: LIFF Initialization Provider**: A global context that initializes LIFF and stores user profile data globally. Supports mock data for local development.
* **Feature 2: Dashboard Page (/)**: Shows KPI Cards (Total, Closed, Close Rate, Avg Time) and a list of user's recent tickets with auto-sync every 24 hours.
* **Feature 3: Create Ticket Form (/create)**: A form capturing Category, Sub-category, Branch, Problem details, and an Image Upload field with preview capability.
* **Feature 4: Team KPI Dashboard**: Dashboard showing team performance metrics, monthly bar chart, and staff rankings.
* **Feature 5: Text Normalization**: Utility to normalize stylized Unicode text (e.g., `🆃🅾🅲🅺🆃🅰🅲🅺` → `TOCKTACK`).

## 4. Integration Endpoints
* **Target Webhook (n8n)**: `POST {{N8N_WEBHOOK_URL}}`
  - Configure in `.env.local` as `NEXT_PUBLIC_N8N_WEBHOOK_URL`
* **Expected JSON Payload for New Ticket**:
```json
{
  "source": "liff_app",
  "userId": "string (from liff.getProfile)",
  "displayName": "string (from liff.getProfile)",
  "intent": "SR or INC",
  "category": "string",
  "sub_category": "string",
  "branch_name": "string",
  "subject": "string",
  "problem_detail": "string",
  "image_base64": "string (optional) - Base64 encoded string of the uploaded image"
}
```

## 5. Team KPI Dashboard API Endpoints
* **GET `/api/dashboard/kpi`**: KPI stats (total, closed, closeRate, avgTime, pending)
  - Query params: `year`, `month` (optional)
* **GET `/api/dashboard/monthly`**: Monthly ticket volume for bar chart
  - Query params: `year`
  - Returns: 12 months with total/closed counts
* **GET `/api/dashboard/staff`**: Staff performance rankings
  - Query params: `year`, `month` (optional)
  - Returns: rank, name, totalAssigned, totalClosed, avgTime
* **GET `/api/dashboard/daily`**: Daily breakdown for selected month
  - Query params: `year`, `month`
  - Returns: daily data array with day, total, closed

## 6. Text Normalization Utility
**File**: `app/lib/normalizeText.ts`

Converts stylized Unicode characters to regular ASCII:
- Enclosed Alphanumerics: `🆃🅾🅲🅺🆃🅰🅲🅺` → `TOCKTACK`
- Fullwidth characters: `ＡＢｃ` → `abc`
- Used in: `/api/dashboard/staff`, `/api/tickets`

**SQL Data Cleanup** (2026-03-04):
- Updated 23 records in `[Dev_Born].[dbo].[ticket]` from `🆃🅾🅲🅺🆃🅰🅲🅺` to `TOCKTACK`
- CSV file `data.csv` also normalized with backup at `data.csv.backup`