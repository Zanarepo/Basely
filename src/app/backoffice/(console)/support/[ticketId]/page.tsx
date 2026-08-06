import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TicketThreadClient } from '../../../../../components/support/TicketThreadClient'
import { BackofficeTicketActions } from '../../../../../components/support/BackofficeTicketActions'

export default async function BackofficeTicketPage(props: { params: Promise<{ ticketId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check Staff Role for Authorization
  const { data: staff } = await adminClient
    .from('internal_staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!staff) return <div>Unauthorized</div>

  // Fetch ticket
  const { data: ticket, error: ticketErr } = await adminClient
    .from('support_tickets')
    .select('*, organizations(name), projects(name)')
    .eq('id', params.ticketId)
    .single()

  if (ticketErr || !ticket) return notFound()

  // Verify access for Account Managers
  if (staff.role === 'account_manager') {
    const { data: assignment } = await adminClient
      .from('account_assignments')
      .select('id')
      .eq('organization_id', ticket.organization_id)
      .eq('staff_id', staff.id)
      .single()
    if (!assignment) {
      return (
        <div className="p-8 text-center bg-app-card border border-app-border rounded-2xl max-w-lg mx-auto my-12">
          <h2 className="text-lg font-black text-red-500 mb-2">Access Restricted</h2>
          <p className="text-sm font-semibold text-app-muted">You are logged in as an Account Manager, but you are not assigned to manage this organization ({ticket.organizations?.name}). Please assign yourself in the Accounts console to access this ticket.</p>
        </div>
      )
    }
  }

  // Fetch messages
  const { data: messages } = await adminClient
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', params.ticketId)
    .order('created_at', { ascending: true })

  // Decorate messages for staff view
  const formattedMessages = messages?.map((m: any) => ({
    ...m,
    sender: {
      full_name: m.sender_id === user.id ? 'You' : 'Tenant User',
    }
  })).filter((m: any, index: number) => {
    // If the very first message is literally identical to the ticket description, don't show it as a reply
    if (index === 0 && m.message === ticket.description) return false
    return true
  })

  const customerHeaderName = `${ticket.organizations?.name || 'Organization'}${ticket.projects?.name ? ` (${ticket.projects.name})` : ''}`

  return (
    <div className="space-y-6">
      <Link href="/backoffice/support" className="inline-flex items-center text-sm font-bold text-app-muted hover:text-app-fg transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Inbox
      </Link>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden flex flex-col md:flex-row h-[800px]">
        {/* Left Side: Thread */}
        <div className="flex-1 border-r border-app-border flex flex-col min-w-0 overflow-hidden">
          <div className="p-4 border-b border-app-border bg-app-surface shrink-0">
            <div>
              <h1 className="text-xl font-black text-app-fg">{ticket.subject}</h1>
              <p className="text-sm font-bold text-app-muted mt-1">{customerHeaderName}</p>
            </div>
            {ticket.description && (
              <div className="mt-4 p-4 bg-app-card border border-app-border rounded-xl">
                <div className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-1">Issue Description</div>
                <div className="text-sm text-app-fg whitespace-pre-wrap font-medium">{ticket.description}</div>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
             <TicketThreadClient 
              ticketId={ticket.id}
              messages={formattedMessages || []}
              currentUserId={user.id}
              isClosed={ticket.status === 'closed' || ticket.status === 'resolved'}
              viewType="admin"
              isStaffReply={true}
              customerHeaderName={customerHeaderName}
            />
          </div>
        </div>

        {/* Right Side: Meta / Actions */}
        <div className="w-full md:w-80 bg-app-surface p-6 flex flex-col gap-6">
          <div>
            <div className="text-xs font-black text-app-muted uppercase mb-2">Status</div>
            <BackofficeTicketActions ticketId={ticket.id} initialStatus={ticket.status} />
          </div>

          <div>
            <div className="text-xs font-black text-app-muted uppercase mb-2">Priority</div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
              ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
              'bg-app-surface-solid border border-app-border text-app-fg'
            }`}>
              {ticket.priority.toUpperCase()}
            </span>
          </div>

          <div>
            <div className="text-xs font-black text-app-muted uppercase mb-1">Created</div>
            <div className="text-sm font-semibold text-app-fg">{new Date(ticket.created_at).toLocaleString()}</div>
          </div>
          
          <div>
            <div className="text-xs font-black text-app-muted uppercase mb-1">SLA Alert</div>
            {ticket.sla_breach_alerted ? (
              <div className="text-sm font-bold text-red-500">Breached</div>
            ) : (
              <div className="text-sm font-semibold text-emerald-500">Good</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
