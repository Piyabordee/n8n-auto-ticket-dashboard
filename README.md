# IT Helpdesk Dashboard & LIFF Application

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern enterprise IT helpdesk system built with Next.js 14, featuring a comprehensive KPI dashboard with statistical outlier detection and LINE Front-end Framework (LIFF) integration for mobile ticket submission.

**Live Demo**: https://n8n-auto-ticket-dashboard.vercel.app/

**Built with 99% Vibe Code (AI-assisted development)** - This project demonstrates the power of AI-assisted software development.

## Features

### Dashboard (/)
- Real-time KPI Cards: Track total tickets, closed tickets, pending items, close rates, and average resolution time
- Statistical Outlier Detection: Per-person Mean + 2SD methodology
- Interactive Visualizations: Monthly and daily bar charts with drill-down capabilities
- Staff Performance Rankings: Comprehensive team performance metrics with outlier breakdown
- Filtering: Year and month-based data filtering for trend analysis

### Ticket Creation (/create)
- Mobile-optimized ticket submission via LINE app
- Category and sub-category selection with dynamic options
- Branch selection with hierarchical data
- Image attachment with Base64 encoding
- Real-time form validation

### Technical Highlights
- Per-Person Outlier Detection: Each staff member has their own statistical threshold
- Text Normalization: Handles stylized Unicode text (Thai characters) with ASCII conversion
- Connection Pooling: Optimized SQL Server connection management for concurrent requests
- Responsive Design: Mobile-first UI using Tailwind CSS and shadcn/ui components

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Charts | Recharts |
| LINE SDK | @line/liff |
| Database | Microsoft SQL Server via mssql |
| Integration | n8n workflow automation |
| Deployment | Vercel |

## Prerequisites

- Node.js 18+
- Microsoft SQL Server
- LINE Developers Account (for LIFF app)
- n8n instance (for ticket workflow)

## Quick Start

```bash
git clone <repository-url>
cd n8n-auto-ticket-dashboard
npm install
```

Create .env.local with your credentials, then run:

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
n8n-auto-ticket-dashboard/
├── app/
│   ├── api/dashboard/      # API routes
│   ├── components/         # React components
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── repository/            # Database access layer
└── public/                # Static assets
```

## API Endpoints

| Endpoint | Method | Query Params | Description |
|----------|--------|--------------|-------------|
| /api/dashboard/kpi | GET | year, month? | KPI statistics |
| /api/dashboard/monthly | GET | year | Monthly volume |
| /api/dashboard/daily | GET | year, month | Daily breakdown |
| /api/dashboard/staff | GET | year, month? | Staff rankings |
| /api/dashboard/outliers/top3 | GET | year, month? | Top 3 outliers |
| /api/dashboard/outliers/all | GET | year, month? | All outliers |
| /api/dashboard/tickets | GET | year, month?, filterType, staffName? | Filtered list |

## Database Schema

### [Dev_Born].[dbo].[ticket]

| Column | Type | Description |
|--------|------|-------------|
| message_id | varchar(50) | Unique ID |
| assigned_to | nvarchar(255) | Staff name |
| subject | nvarchar(max) | Subject |
| status | varchar(50) | closed, pending, unsent |
| created_date | datetime | Created at |
| assigned_date | datetime | Assigned at |
| close_time_minute | int | Minutes to close (NULL if pending) |

## Outlier Detection

**Per-Person Mean + 2SD Method:**
- Baseline from full year data
- Threshold: personal_mean + (2 × personal_stddev)
- Requires min 2 tickets per person for SD calculation

## Development

### Key Patterns

- **Singleton Repository**: Shared connection pool
- **Text Normalization**: Unicode to ASCII conversion
- **Concurrent-Safe**: Connection locking prevents race conditions

### Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start dev server |
| npm run build | Build for production |
| npm start | Start production server |
| npm run lint | Run ESLint |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_LIFF_ID | Yes | LIFF app ID |
| NEXT_PUBLIC_N8N_WEBHOOK_URL | Yes | n8n webhook URL |
| SQL_SERVER | Yes | SQL Server host |
| SQL_DATABASE | Yes | Database name |
| SQL_USER | Yes | SQL username |
| SQL_PASSWORD | Yes | SQL password |

## License

MIT License

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

Built with Next.js and LINE LIFF  
Developed with 99% AI assistance via Vibe Code
