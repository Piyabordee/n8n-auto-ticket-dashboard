# Global Ticket Search Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global search input above the stats cards that allows users to search across all tickets by subject, assigned_to, category, sub_category, branch_name, and message_id.

**Architecture:**
- Create a new `GlobalSearch` component with search input and debounced API calls
- Extend the existing `/api/dashboard/tickets` endpoint to support a `search` query parameter
- Add SQL `LIKE` query to filter tickets matching the search term
- Display search results in a dropdown/autocomplete style or modal
- Mobile-first responsive design

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, mssql (SQL Server)

---

## File Structure

```
app/
├── components/
│   └── dashboard/
│       ├── GlobalSearch.tsx          # NEW - Search input with debounced search
│       └── SearchResults.tsx         # NEW - Search results dropdown component
├── api/
│   └── dashboard/
│       └── tickets/
│           └── route.ts              # MODIFY - Add search parameter support
└── page.tsx                          # MODIFY - Add GlobalSearch component
```

---

## Chunk 1: Backend API Enhancement

### Task 1: Add Search Parameter to Tickets API

**Files:**
- Modify: `app/api/dashboard/tickets/route.ts:29-36`

- [ ] **Step 1: Read the current API route to understand query parameters**

```bash
# The route currently accepts: year, month, status, staff, day
# We need to add: search (optional string)
```

- [ ] **Step 2: Add search parameter extraction**

Add after line 35 (after `const day = searchParams.get('day')`):

```typescript
const search = searchParams.get('search')?.trim() || ''
```

- [ ] **Step 3: Add SQL LIKE filter for search**

Add after the day filter section (after line 132):

```typescript
// Add search filter - searches across multiple fields
if (search) {
  // Search in subject, assigned_to, category, sub_category, branch_name, message_id
  query += ` AND (
    subject LIKE @search OR
    assigned_to LIKE @search OR
    category LIKE @search OR
    sub_category LIKE @search OR
    branch_name LIKE @search OR
    message_id LIKE @search
  )`
  requestQuery.input('search', sql.NVarChar, `%${search}%`)
}
```

- [ ] **Step 4: Test the API endpoint manually**

```bash
# Test search without filters
curl "http://localhost:3000/api/dashboard/tickets?year=2026&search=test"

# Test search with year/month filter
curl "http://localhost:3000/api/dashboard/tickets?year=2026&month=3&search=printer"

# Expected: JSON response with filtered tickets array
```

- [ ] **Step 5: Commit**

```bash
git add app/api/dashboard/tickets/route.ts
git commit -m "feat: add search parameter to tickets API endpoint"
```

---

## Chunk 2: GlobalSearch Component

### Task 2: Create GlobalSearch Component

**Files:**
- Create: `app/components/dashboard/GlobalSearch.tsx`

- [ ] **Step 1: Write the GlobalSearch component**

```typescript
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface GlobalSearchProps {
  year: number
  month: number | null
}

interface SearchResult {
  message_id: string
  subject: string
  assigned_to: string
  status: string
  created_date: string | null
}

export default function GlobalSearch({ year, month }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Debounced search function
  const debounceRef = useRef<NodeJS.Timeout>()

  const searchTickets = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const monthParam = month ? `&month=${month}` : ''
      const response = await fetch(
        `/api/dashboard/tickets?year=${year}${monthParam}&status=all&search=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()
      // Show top 10 results for dropdown
      setResults((data.tickets || []).slice(0, 10))
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [year, month])

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout for debounced search (300ms)
    debounceRef.current = setTimeout(() => {
      searchTickets(value)
    }, 300)
  }

  // Handle search on Enter key - show all results in modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      setShowResults(false)
      // Navigate to a search results page or open modal with all results
      router.push(`/?year=${year}${month ? `&month=${month}` : ''}&search=${encodeURIComponent(query)}`)
    }
  }

  // Handle result click
  const handleResultClick = (ticketId: string) => {
    setShowResults(false)
    setQuery('')
    // Could open ticket detail modal or navigate to ticket detail
    router.push(`/?year=${year}${month ? `&month=${month}` : ''}&ticketId=${ticketId}`)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Clear search
  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="ค้นหางาน... (หัวข้อ, พนักงาน, สาขา, ประเภท)"
          className="w-full pl-9 sm:pl-11 pr-8 sm:pr-10 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-gray-600">
              พบ {results.length} ผลลัพธ์ <span className="text-gray-400">(กด Enter เพื่อดูทั้งหมด)</span>
            </p>
          </div>
          {results.map((ticket) => (
            <button
              key={ticket.message_id}
              onClick={() => handleResultClick(ticket.message_id)}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {ticket.subject}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-600">{ticket.assigned_to}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {ticket.created_date ? new Date(ticket.created_date).toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                  }) : '-'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && query && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-4">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-1">🔍</div>
            <p className="text-sm">ไม่พบผลลัพธ์สำหรับ "{query}"</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/dashboard/GlobalSearch.tsx
git commit -m "feat: add GlobalSearch component with debounced search"
```

---

## Chunk 3: Integrate Search into Main Page

### Task 3: Add GlobalSearch to Dashboard Page

**Files:**
- Modify: `app/page.tsx:303-317`

- [ ] **Step 1: Import GlobalSearch component**

Add after line 11 (after TicketListModal import):

```typescript
import GlobalSearch from './components/dashboard/GlobalSearch'
```

- [ ] **Step 2: Add GlobalSearch component above StatsCards**

Replace the StatsCards section (lines 306-317) with:

```typescript
{/* Global Search */}
<div className="mb-4">
  <GlobalSearch year={year} month={month} />
</div>

{/* Stats Cards */}
<StatsCards
  total={stats.total}
  closed={stats.closed}
  closeRate={stats.closeRate}
  avgTime={stats.avgTime}
  pending={stats.pending}
  avgTimeNormal={outlierSummary?.avgTimeNormal}
  avgTimeOutlier={outlierSummary?.avgTimeOutlier}
  outlierCount={outlierSummary?.totalOutliers}
  outlierThreshold={outlierSummary?.outlierThreshold}
  onCardClick={handleStatCardClick}
/>
```

- [ ] **Step 3: Test the search functionality**

```bash
# Start the dev server
npm run dev

# Manual test:
# 1. Navigate to http://localhost:3000
# 2. Type in the search box
# 3. Verify dropdown shows results
# 4. Verify debouncing works (wait 300ms after typing stops)
# 5. Test on mobile viewport
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate GlobalSearch into dashboard page"
```

---

## Chunk 4: All Search Results Modal (Optional Enhancement)

### Task 4: Create SearchResultsModal for Full Results

**Files:**
- Create: `app/components/dashboard/SearchResultsModal.tsx`

- [ ] **Step 1: Create SearchResultsModal component**

```typescript
'use client'

import { useEffect, useState } from 'react'
import MonthlyTicketList from './MonthlyTicketList'

interface Ticket {
  message_id: string
  subject: string
  assigned_to: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string | null
  assigned_date: string | null
  close_time_minute: number | null
}

interface SearchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  year: number
  month: number | null
  searchQuery: string
}

export default function SearchResultsModal({
  isOpen,
  onClose,
  year,
  month,
  searchQuery
}: SearchResultsModalProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !searchQuery.trim()) return

    const fetchResults = async () => {
      setLoading(true)
      try {
        const monthParam = month ? `&month=${month}` : ''
        const response = await fetch(
          `/api/dashboard/tickets?year=${year}${monthParam}&status=all&search=${encodeURIComponent(searchQuery)}`
        )
        const data = await response.json()
        setTickets(data.tickets || [])
      } catch (error) {
        console.error('Search results error:', error)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [isOpen, year, month, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">
              ผลการค้นหา: "{searchQuery}"
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              พบ {tickets.length} ผลลัพธ์
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <MonthlyTicketList tickets={tickets} loading={loading} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update GlobalSearch to use modal**

Update the `handleKeyDown` function in GlobalSearch.tsx to open the modal instead of navigation.

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/SearchResultsModal.tsx
git commit -m "feat: add SearchResultsModal for full search results"
```

---

## Chunk 5: Responsive Design Polish

### Task 5: Ensure Mobile Responsiveness

**Files:**
- Modify: `app/components/dashboard/GlobalSearch.tsx`

- [ ] **Step 1: Verify mobile styles are correct**

The component already includes responsive classes:
- `text-xs sm:text-sm` for font sizes
- `py-2 sm:py-2.5` for padding
- `pl-9 sm:pl-11` for left padding
- Mobile-first approach with `sm:` breakpoints

- [ ] **Step 2: Test on different screen sizes**

```bash
# DevTools responsive mode:
# - Mobile (375px): Verify single column, touch-friendly
# - Tablet (768px): Verify layout
# - Desktop (1280px): Verify full width
```

- [ ] **Step 3: Commit**

```bash
git add app/components/dashboard/GlobalSearch.tsx
git commit -m "style: ensure mobile responsiveness for GlobalSearch"
```

---

## Chunk 6: Testing and Documentation

### Task 6: Write Tests and Update Documentation

**Files:**
- Create: `__tests__/components/dashboard/GlobalSearch.test.tsx`
- Modify: `docs/mobile-responsive.md` (if needed)

- [ ] **Step 1: Write unit tests**

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalSearch from '@/app/components/dashboard/GlobalSearch'

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ tickets: [] })
  })
) as jest.Mock

describe('GlobalSearch', () => {
  it('renders search input', () => {
    render(<GlobalSearch year={2026} month={null} />)
    expect(screen.getByPlaceholderText(/ค้นหางาน/)).toBeInTheDocument()
  })

  it('debounces search input', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch year={2026} month={null} />)

    const input = screen.getByPlaceholderText(/ค้นหางาน/)
    await user.type(input, 'test')

    // Should not call fetch immediately
    expect(global.fetch).not.toHaveBeenCalled()

    // Should call fetch after debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 500 })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test -- GlobalSearch.test.tsx
```

- [ ] **Step 3: Update documentation**

Add to `docs/mobile-responsive.md`:

```markdown
## Global Search Component

The GlobalSearch component provides a real-time search input for filtering tickets.

**Props:**
- `year: number` - Current filter year
- `month: number | null` - Current filter month (optional)

**Features:**
- Debounced search (300ms) to reduce API calls
- Dropdown shows top 10 results
- Press Enter to view all results in modal
- Mobile-responsive design
- Click outside to close dropdown

**Search Fields:**
- subject
- assigned_to
- category
- sub_category
- branch_name
- message_id
```

- [ ] **Step 4: Commit**

```bash
git add __tests__/components/dashboard/GlobalSearch.test.tsx docs/mobile-responsive.md
git commit -m "test: add GlobalSearch tests and documentation"
```

---

## Summary

After completing all chunks:
1. Backend API supports search via `?search=` query parameter
2. GlobalSearch component provides real-time search with debouncing
3. Search results shown in dropdown (top 10) or modal (all results)
4. Mobile-responsive design
5. Tests and documentation in place

**API Endpoints:**
- `GET /api/dashboard/tickets?year=2026&search=keyword` - Search tickets

**Components:**
- `GlobalSearch` - Search input with dropdown results
- `SearchResultsModal` - Full search results modal (optional)
