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
