'use client'

import { useState, useEffect } from 'react'
import type { TicketDetail, TicketDetailModalProps } from '@/types/ticket'

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">รายละเอียดงานทั้งหมด</h2>
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
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>📋</span> <span className="truncate">{ticket.subject || '(ไม่ระบุหัวข้อ)'}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
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
                    <span>💬</span>
                    <span className="font-medium">กลุ่ม:</span>
                    <span>{ticket.chatname || 'ไม่ระบุ'}</span>
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
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">🔸 ข้อมูลพื้นฐาน</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div><span className="font-medium">ID:</span> {ticket.id || '-'}</div>
                        <div><span className="font-medium">Message ID:</span> {ticket.message_id}</div>
                        <div><span className="font-medium">Intent:</span> {ticket.intent || '-'}</div>
                        <div><span className="font-medium">Branch Company:</span> {ticket.branch_company || '-'}</div>
                      </div>
                    </div>

                    {/* Reporter Info */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">🔸 ข้อมูลการแจ้ง</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div><span className="font-medium">From User:</span> {ticket.fromuser || '-'}</div>
                        <div><span className="font-medium">User ID:</span> {ticket.userid || '-'}</div>
                        <div><span className="font-medium">Chat Name:</span> {ticket.chatname || 'ไม่ระบุ'}</div>
                        <div><span className="font-medium">Created By:</span> {ticket.created_by || '-'}</div>
                        <div><span className="font-medium">Updated By:</span> {ticket.updated_by || '-'}</div>
                      </div>
                    </div>

                    {/* Text Fields */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-sm">🔸 รายละเอียดข้อความ</h4>

                      {ticket.clean_text && (
                        <div>
                          <div className="font-medium mb-1 text-xs sm:text-sm">clean_text:</div>
                          <div className="bg-white p-2 rounded text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{ticket.clean_text}</div>
                        </div>
                      )}

                      {ticket.raw_text && (
                        <div>
                          <div className="font-medium mb-1 text-xs sm:text-sm">raw_text:</div>
                          <div className="bg-white p-2 rounded text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{ticket.raw_text}</div>
                        </div>
                      )}

                      {ticket.email_body && (
                        <div>
                          <div className="font-medium mb-1 text-xs sm:text-sm">email_body:</div>
                          <div className="bg-white p-2 rounded text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{ticket.email_body}</div>
                        </div>
                      )}
                    </div>

                    {/* System Info */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">🔸 ข้อมูลกลุ่มและระบบ</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div><span className="font-medium">Group ID:</span> {ticket.groupid || '-'}</div>
                        <div><span className="font-medium">Assigned Date:</span> {formatDate(ticket.assigned_date)}</div>
                        <div><span className="font-medium">Updated Date:</span> {formatDate(ticket.updated_date)}</div>
                      </div>
                    </div>

                    {/* Close Info */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">🔸 ข้อมูลการปิดงาน</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
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
