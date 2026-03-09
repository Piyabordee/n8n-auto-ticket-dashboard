'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { TicketForm } from '@/components/TicketForm'

export default function CreateTicketPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
      <TicketForm />
    </div>
  )
}