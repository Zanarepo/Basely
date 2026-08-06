'use client'

import { useState, useTransition } from 'react'
import { updateTicketStatusAction } from '@/lib/support/actions'

interface Props {
  ticketId: string
  initialStatus: string
}

export function BackofficeTicketActions({ ticketId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    
    startTransition(async () => {
      try {
        await updateTicketStatusAction(ticketId, newStatus)
      } catch (err: any) {
        alert(err.message)
        setStatus(initialStatus) // revert
      }
    })
  }

  return (
    <select 
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`w-full appearance-none bg-app-surface-solid border border-app-border rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:border-app-accent transition-colors cursor-pointer disabled:opacity-50 ${
        status === 'resolved' || status === 'closed' ? 'text-emerald-500' :
        status === 'waiting_on_customer' ? 'text-blue-500' :
        'text-amber-500'
      }`}
    >
      <option value="open">Open</option>
      <option value="in_progress">In Progress</option>
      <option value="waiting_on_customer">Waiting on Customer</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
    </select>
  )
}
