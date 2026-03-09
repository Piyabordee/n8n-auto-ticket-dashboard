export interface Ticket {
  message_id: string
  subject: string
  status: 'pending' | 'assigned' | 'closed' | 'unsent'
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

export interface TicketsResponse {
  kpi: {
    total: number
    closed: number
  }
  tickets: Ticket[]
}