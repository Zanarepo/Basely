import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TicketThreadClient } from '../../../../components/support/TicketThreadClient'

export default async function TicketPage(props: { params: Promise<{ ticketId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .select('*, organizations(name)')
    .eq('id', params.ticketId)
    .single()

  if (ticketErr || !ticket) return notFound()

  // Fetch messages
  const { data: messagesRaw } = await supabase
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', params.ticketId)
    .order('created_at', { ascending: true })

  const messages = messagesRaw?.filter((m: any, index: number) => {
    if (index === 0 && m.message === ticket.description) return false
    return true
  }).map((m: any) => ({
    ...m,
    sender: {
      full_name: m.sender_id === user.id ? 'You' : 'Support Team'
    }
  }))

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/dashboard/support" className="inline-flex items-center text-sm font-bold text-app-muted hover:text-app-fg transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Support
      </Link>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden flex flex-col h-[800px]">
        <div className="p-6 border-b border-app-border bg-app-surface shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-black text-app-fg">{ticket.subject}</h1>
              <p className="text-sm text-app-muted mt-1">Ticket #{ticket.id.split('-')[0]}</p>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                'bg-app-surface-solid border border-app-border text-app-muted'
              }`}>
                {ticket.priority.toUpperCase()}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                ticket.status === 'resolved' || ticket.status === 'closed'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {ticket.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
          {ticket.description && (
            <div className="mt-6 p-4 bg-app-card border border-app-border rounded-xl">
              <div className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-1">Issue Description</div>
              <div className="text-sm text-app-fg whitespace-pre-wrap font-medium">{ticket.description}</div>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          <TicketThreadClient 
            ticketId={ticket.id}
            messages={messages || []}
            currentUserId={user.id}
            isClosed={ticket.status === 'closed' || ticket.status === 'resolved'}
            viewType="tenant"
            isStaffReply={false}
          />
        </div>
      </div>
    </div>
  )
}
