# Clickable Subject - Ticket Detail Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every subject in the dashboard clickable to show a modal with all 26 fields from the ticket table.

**Architecture:** Create new TicketDetailModal component with ClickableSubject wrapper, add API endpoint for single ticket fetch, integrate into all components that display subjects.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, mssql (SQL Server), shadcn/ui

---

## Task 1: Create API Endpoint for Single Ticket

**Files:**
- Create: `app/api/dashboard/ticket/[message_id]/route.ts`

**Step 1: Write the API route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/sql'

export async function GET(
  request: NextRequest,
  { params }: { params: { message_id: string } }
) {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('message_id', params.message_id)
      .query(`
        SELECT
          id, message_id, status, assigned_to, assigned_date,
          intent, category, sub_category, branch_name, branch_company,
          subject, clean_text, raw_text, email_body, chatname,
          fromuser, userid, groupid, created_date, created_by,
          updated_date, updated_by, close_cause, close_reason, close_time_minute
        FROM Dev_Born.dbo.ticket
        WHERE message_id = @message_id
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ ticket: null }, { status: 404 })
    }

    return NextResponse.json({ ticket: result.recordset[0] })
  } catch (error) {
    console.error('Error fetching ticket detail:', error)
    return NextResponse.json(
      { ticket: null, error: 'Failed to fetch ticket detail' },
      { status: 500 }
    )
  }
}
```

**Step 2: Test the API endpoint manually**

Run: Start dev server `npm run dev`
Test: `curl http://localhost:3000/api/dashboard/ticket/601550865744265234`
Expected: JSON response with ticket data or 404

**Step 3: Commit**

```bash
git add app/api/dashboard/ticket/[message_id]/route.ts
git commit -m "feat: add API endpoint for single ticket detail by message_id

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create TicketDetailModal Component

**Files:**
- Create: `app/components/dashboard/TicketDetailModal.tsx`
- Create: `types/ticket.ts` (update if needed)

**Step 1: Add/Update TypeScript types**

First, check if `types/ticket.ts` exists and add/update:

```typescript
// types/ticket.ts
export interface TicketDetail {
  // Basic fields (always shown)
  message_id: string
  subject: string
  status: string
  assigned_to: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
  close_time_minute: number | null

  // All 26 fields (shown when expanded)
  id?: number
  assigned_date?: string
  intent?: string
  branch_company?: string
  clean_text?: string
  raw_text?: string
  email_body?: string
  chatname?: string
  fromuser?: string
  userid?: string
  groupid?: string
  created_by?: string
  updated_date?: string
  updated_by?: string
  close_cause?: string
  close_reason?: string
}

export interface TicketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  messageId: string
}
```

**Step 2: Create TicketDetailModal component**

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { TicketDetail } from '@/types/ticket'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  unsent: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  assigned: 'มอบหมายแล้ว',
  closed: 'เสร็จสิ้น',
  unsent: 'ยกเลิก'
}

export default function TicketDetailModal({
  isOpen,
  onClose,
  messageId
}: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!isOpen || !messageId) return

    const fetchTicket = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dashboard/ticket/${messageId}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch ticket')
        }

        setTicket(data.ticket)
      } catch (err) {
        console.error('Error fetching ticket:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [isOpen, messageId])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">รายละเอียดงานทั้งหมด</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && ticket && (
            <div className="space-y-6">
              {/* Basic Section - Always Visible */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>📋</span> {ticket.subject || '(ไม่ระบุหัวข้อ)'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>📊</span>
                    <span className="font-medium">สถานะ:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || statusColors.pending}`}>
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span className="font-medium">ผู้รับงาน:</span>
                    <span>{ticket.assigned_to || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>📂</span>
                    <span className="font-medium">หมวดหมู่:</span>
                    <span>{ticket.category} - {ticket.sub_category}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span className="font-medium">สาขา:</span>
                    <span>{ticket.branch_name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span className="font-medium">สร้างเมื่อ:</span>
                    <span>{formatDate(ticket.created_date)}</span>
                  </div>

                  {ticket.close_time_minute && (
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span className="font-medium">ใช้เวลา:</span>
                      <span>{ticket.close_time_minute} นาที</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Section - Collapsible */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  {expanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {expanded ? 'ซ่อน' : 'ดูเพิ่มเติม (26 ฟิลด์ทั้งหมด)'}
                </button>

                {expanded && (
                  <div className="mt-4 space-y-4 text-sm">
                    {/* Basic Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🔸 ข้อมูลพื้นฐาน</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">ID:</span> {ticket.id || '-'}</div>
                        <div><span className="font-medium">Message ID:</span> {ticket.message_id}</div>
                        <div><span className="font-medium">Intent:</span> {ticket.intent || '-'}</div>
                        <div><span className="font-medium">Branch Company:</span> {ticket.branch_company || '-'}</div>
                      </div>
                    </div>

                    {/* Reporter Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🔸 ข้อมูลการแจ้ง</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">From User:</span> {ticket.fromuser || '-'}</div>
                        <div><span className="font-medium">User ID:</span> {ticket.userid || '-'}</div>
                        <div><span className="font-medium">Chat Name:</span> {ticket.chatname || '-'}</div>
                        <div><span className="font-medium">Created By:</span> {ticket.created_by || '-'}</div>
                        <div><span className="font-medium">Updated By:</span> {ticket.updated_by || '-'}</div>
                      </div>
                    </div>

                    {/* Text Fields */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold">🔸 รายละเอียดข้อความ</h4>

                      {ticket.clean_text && (
                        <div>
                          <div className="font-medium mb-1">clean_text:</div>
                          <div className="bg-white p-2 rounded text-gray-700 whitespace-pre-wrap">{ticket.clean_text}</div>
                        </div>
                      )}

                      {ticket.raw_text && (
                        <div>
                          <div className="font-medium mb-1">raw_text:</div>
                          <div className="bg-white p-2 rounded text-gray-700 whitespace-pre-wrap">{ticket.raw_text}</div>
                        </div>
                      )}

                      {ticket.email_body && (
                        <div>
                          <div className="font-medium mb-1">email_body:</div>
                          <div className="bg-white p-2 rounded text-gray-700 whitespace-pre-wrap">{ticket.email_body}</div>
                        </div>
                      )}
                    </div>

                    {/* System Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🔸 ข้อมูลกลุ่มและระบบ</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">Group ID:</span> {ticket.groupid || '-'}</div>
                        <div><span className="font-medium">Assigned Date:</span> {formatDate(ticket.assigned_date)}</div>
                        <div><span className="font-medium">Updated Date:</span> {formatDate(ticket.updated_date)}</div>
                      </div>
                    </div>

                    {/* Close Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🔸 ข้อมูลการปิดงาน</h4>
                      <div className="space-y-1">
                        <div><span className="font-medium">Close Cause:</span> {ticket.close_cause || '-'}</div>
                        <div><span className="font-medium">Close Reason:</span> {ticket.close_reason || '-'}</div>
                        <div><span className="font-medium">Close Time Minute:</span> {ticket.close_time_minute || '-'} นาที</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add types/ticket.ts app/components/dashboard/TicketDetailModal.tsx
git commit -m "feat: add TicketDetailModal component with collapse/expand

Displays all 26 fields from ticket table with collapsible sections.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create ClickableSubject Wrapper Component

**Files:**
- Create: `app/components/dashboard/ClickableSubject.tsx`

**Step 1: Create ClickableSubject component**

```typescript
'use client'

import { useState } from 'react'

interface ClickableSubjectProps {
  subject: string
  messageId: string
  className?: string
}

export default function ClickableSubject({
  subject,
  messageId,
  className = ''
}: ClickableSubjectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`text-blue-600 hover:text-blue-800 underline cursor-pointer text-left ${className}`}
        title="คลิกเพื่อดูรายละเอียดทั้งหมด"
      >
        {subject || '(ไม่ระบุหัวข้อ)'}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Dynamically import to avoid SSR issues */}
          <TicketDetailModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            messageId={messageId}
          />
        </div>
      )}
    </>
  )
}

// Dynamic import for TicketDetailModal
function TicketDetailModal(props: any) {
  // This will be replaced with actual component
  return null
}
```

**Step 2: Update to use dynamic import**

Replace the placeholder at the bottom with:

```typescript
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid circular dependency
const TicketDetailModal = dynamic(
  () => import('./TicketDetailModal').then(mod => ({ default: mod.default })),
  { ssr: false }
)

interface ClickableSubjectProps {
  subject: string
  messageId: string
  className?: string
}

export default function ClickableSubject({
  subject,
  messageId,
  className = ''
}: ClickableSubjectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`text-blue-600 hover:text-blue-800 underline cursor-pointer text-left ${className}`}
        title="คลิกเพื่อดูรายละเอียดทั้งหมด"
      >
        {subject || '(ไม่ระบุหัวข้อ)'}
      </button>

      <TicketDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        messageId={messageId}
      />
    </>
  )
}
```

**Step 3: Commit**

```bash
git add app/components/dashboard/ClickableSubject.tsx
git commit -m "feat: add ClickableSubject wrapper component

Provides clickable subject with blue underline styling.
Opens TicketDetailModal on click.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update StaffPerformanceTable

**Files:**
- Modify: `app/components/dashboard/StaffPerformanceTable.tsx`

**Step 1: Read current file to understand structure**

Read the file to find where subject is displayed.

**Step 2: Replace subject with ClickableSubject**

Find the subject rendering (likely in a table cell) and replace with:

```typescript
import ClickableSubject from './ClickableSubject'

// In the table row rendering:
<td className="px-4 py-3">
  <ClickableSubject
    subject={staff.subject || '-'}
    messageId={staff.message_id}
  />
</td>
```

**Step 3: Test manually**

Run: `npm run dev`
Navigate to dashboard, click on any subject in StaffPerformanceTable
Expected: TicketDetailModal opens with ticket details

**Step 4: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat: make subjects clickable in StaffPerformanceTable

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update TopOutliersList

**Files:**
- Modify: `app/components/dashboard/TopOutliersList.tsx`

**Step 1: Read current file**

Find where subject is displayed.

**Step 2: Replace subject with ClickableSubject**

```typescript
import ClickableSubject from './ClickableSubject'

// Replace subject display with:
<ClickableSubject
  subject={outlier.subject}
  messageId={outlier.message_id}
/>
```

**Step 3: Test**

Click on subject in TopOutliersList, verify modal opens

**Step 4: Commit**

```bash
git add app/components/dashboard/TopOutliersList.tsx
git commit -m "feat: make subjects clickable in TopOutliersList

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Update MonthlyTicketList

**Files:**
- Modify: `app/components/dashboard/MonthlyTicketList.tsx`

**Step 1: Read current file**

Find subject display location.

**Step 2: Add ClickableSubject**

```typescript
import ClickableSubject from './ClickableSubject'

// In ticket row:
<ClickableSubject
  subject={ticket.subject}
  messageId={ticket.message_id}
/>
```

**Step 3: Test**

**Step 4: Commit**

```bash
git add app/components/dashboard/MonthlyTicketList.tsx
git commit -m "feat: make subjects clickable in MonthlyTicketList

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update OutlierTable

**Files:**
- Modify: `app/components/dashboard/OutlierTable.tsx`

**Step 1: Add ClickableSubject import and usage**

**Step 2: Test**

**Step 3: Commit**

```bash
git add app/components/dashboard/OutlierTable.tsx
git commit -m "feat: make subjects clickable in OutlierTable

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Update TicketList (if exists)

**Files:**
- Modify: `app/components/TicketList.tsx`

**Step 1: Check if file exists and update**

**Step 2: Test**

**Step 3: Commit**

```bash
git add app/components/TicketList.tsx
git commit -m "feat: make subjects clickable in TicketList

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Update TicketCard (if exists)

**Files:**
- Modify: `app/components/TicketCard.tsx`

**Step 1: Add ClickableSubject to card**

The subject is likely in an h3 tag, replace with:

```typescript
import ClickableSubject from './dashboard/ClickableSubject'

// Replace:
<h3 className="font-semibold text-gray-900 flex-1">{ticket.subject || '(ไม่ระบุหัวข้อ)'}</h3>

// With:
<div className="font-semibold text-gray-900 flex-1">
  <ClickableSubject
    subject={ticket.subject || '(ไม่ระบุหัวข้อ)'}
    messageId={ticket.message_id}
  />
</div>
```

**Step 2: Test**

**Step 3: Commit**

```bash
git add app/components/TicketCard.tsx
git commit -m "feat: make subjects clickable in TicketCard

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Final Testing and Documentation

**Step 1: Full manual testing**

1. Open dashboard
2. Click subject in StaffPerformanceTable → modal opens
3. Inside modal, click "ดูเพิ่มเติม" → all fields shown
4. Click "ซ่อน" → collapse back
5. Close modal, try clicking subject in TopOutliersList
6. Test all components that were updated

**Step 2: Verify modal stacking**

1. Click on stats card → TicketListModal opens
2. Click on subject inside → TicketDetailModal should open on top
3. Close TicketDetailModal → TicketListModal still open
4. Close TicketListModal

**Step 3: Check responsive design**

Test on mobile viewport to ensure modal is usable

**Step 4: Final commit if any adjustments needed**

```bash
git add .
git commit -m "chore: final adjustments for clickable subject feature

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Testing Checklist

- [ ] API returns correct data for valid message_id
- [ ] API returns 404 for invalid message_id
- [ ] Subject is clickable in all components
- [ ] Modal opens with correct ticket data
- [ ] Basic section shows key information
- [ ] Expand/collapse works correctly
- [ ] All 26 fields displayed when expanded
- [ ] Modal closes on X button click
- [ ] Loading state shows during fetch
- [ ] Error state shows for failed requests
- [ ] Modal stacking works (modal on top of modal)
- [ ] Responsive design works on mobile

---

## Reference Docs

- Design doc: `docs/plans/2026-03-09-clickable-subject-ticket-detail-design.md`
- Project context: `AGENTS.md`
- Existing modal pattern: `app/components/dashboard/TicketListModal.tsx`
- SQL connection: `app/lib/sql.ts`
