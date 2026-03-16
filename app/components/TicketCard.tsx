'use client'

import ClickableSubject from './dashboard/ClickableSubject'
import { formatDateTimeThai } from '@/lib/formatTime'

interface Ticket {
  message_id: string
  subject: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

interface TicketCardProps {
  ticket: Ticket
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'รอดำเนินการ' },
  assigned: { bg: 'bg-info-100', text: 'text-info-700', label: 'มอบหมายแล้ว' },
  closed: { bg: 'bg-success-100', text: 'text-success-700', label: 'เสร็จสิ้น' },
  unsent: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'ยกเลิก' },
}

export function TicketCard({ ticket }: TicketCardProps) {
  const statusStyle = statusStyles[ticket.status] || statusStyles.pending

  return (
    <div className="card p-4 border-l-4 border-l-info overflow-hidden">
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="font-semibold text-neutral-900 flex-1 min-w-0">
          <ClickableSubject
            subject={ticket.subject || '(ไม่ระบุหัวข้อ)'}
            messageId={ticket.message_id}
          />
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>
      <div className="space-y-1 text-sm text-neutral-600">
        <div className="flex items-center gap-2 text-wrap-safe">
          <CategoryIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{ticket.category} - {ticket.sub_category}</span>
        </div>
        <div className="flex items-center gap-2 text-wrap-safe">
          <BranchIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{ticket.branch_name}</span>
        </div>
        <div className="flex items-center gap-2 text-wrap-safe">
          <DateIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{formatDateTimeThai(ticket.created_date)}</span>
        </div>
      </div>
    </div>
  )
}

// SVG icon components to replace emojis
function CategoryIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  )
}

function BranchIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  )
}

function DateIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
