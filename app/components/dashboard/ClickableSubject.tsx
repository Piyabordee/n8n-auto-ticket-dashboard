'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid circular dependency and SSR issues
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
