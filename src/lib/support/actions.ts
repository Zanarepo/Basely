'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// Tenant-facing Action: Create Ticket
export async function createTicketAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const subject = formData.get('subject') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent'
  const organizationId = formData.get('organizationId') as string
  const projectId = formData.get('projectId') as string | null

  if (!subject || !description || !organizationId) {
    throw new Error('Missing required fields')
  }

  // 1. Verify user is in org
  const { data: member, error: memberErr } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (memberErr || !member) throw new Error('Not a member of this organization')

  // 2. Create ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .insert({
      organization_id: organizationId,
      project_id: projectId || null,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open'
    })
    .select('id')
    .single()

  if (ticketErr) throw new Error(ticketErr.message)

  // 3. Insert initial message
  const { error: msgErr } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message: description
    })

  if (msgErr) throw new Error(msgErr.message)

  revalidatePath('/dashboard/support')
  return { success: true, ticketId: ticket.id }
}

// Universal Action: Add a Message to a Ticket Thread
export async function addTicketMessageAction(ticketId: string, message: string, isStaffReply: boolean = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  let clientToUse = supabase
  let senderName = 'Tenant Customer'
  let senderRole = 'Customer'

  // If replying as staff, verify against internal_staff with adminClient to prevent RLS blocks
  if (isStaffReply) {
    const { data: staff } = await adminClient
      .from('internal_staff')
      .select('id, email, role')
      .eq('auth_user_id', user.id)
      .single()
    if (!staff) throw new Error('Unauthorized: Only verified staff can send staff replies')
    clientToUse = adminClient

    // Format role cleanly for customer display
    if (staff.role === 'account_manager') senderRole = 'Account Manager'
    else if (staff.role === 'superadmin') senderRole = 'Super Admin'
    else senderRole = 'Support Admin'

    const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', user.id).single()
    senderName = profile?.full_name || staff.email.split('@')[0]
  } else {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    senderName = profile?.full_name || user.email?.split('@')[0] || 'Tenant Customer'
    senderRole = 'Customer'
  }

  // Insert message using appropriate authorized client with sender details
  const { error } = await clientToUse
    .from('support_ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message,
      is_staff_reply: isStaffReply,
      sender_name: senderName,
      sender_role: senderRole
    })

  if (error) {
    // Graceful fallback if database column hasn't been migrated yet
    if (error.message.includes('is_staff_reply') || error.message.includes('sender_name') || error.message.includes('column')) {
      const { error: fallbackErr } = await clientToUse
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          message
        })
      if (fallbackErr) throw new Error(fallbackErr.message)
    } else {
      throw new Error(error.message)
    }
  }

  // Update ticket status to "in_progress" if it was open, or "waiting_on_customer" if staff replied
  // We can do this based on user role, but for simplicity we'll just revalidate and let staff manually update status for now.
  
  revalidatePath(`/dashboard/support/${ticketId}`)
  revalidatePath(`/backoffice/support/${ticketId}`)
  revalidatePath(`/backoffice/support`)
  
  return { success: true }
}

// Backoffice Action: Update Ticket Status
export async function updateTicketStatusAction(ticketId: string, status: string) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // 1. Verify Staff using adminClient to prevent RLS restriction errors on internal_staff
  const { data: staff } = await adminClient
    .from('internal_staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!staff) throw new Error('Unauthorized: You must be an admin or account manager to update ticket status')

  // 2. Update status using adminClient so staff and account managers can freely update tickets without RLS issues
  const { error } = await adminClient
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/backoffice/support/${ticketId}`)
  revalidatePath(`/backoffice/support`)
  revalidatePath(`/dashboard/support/${ticketId}`)
  return { success: true }
}

// Global Widget Action: Load support conversations for chat head
export async function getWidgetConversationsAction(mode: 'admin' | 'tenant', filters?: { status?: string, priority?: string }) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, tickets: [] }

  let query = adminClient
    .from('support_tickets')
    .select('*, organizations(name), projects(name)')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  if (mode === 'admin') {
    const { data: staff } = await adminClient
      .from('internal_staff')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!staff) return { user, tickets: [] }

    if (staff.role === 'account_manager') {
      const { data: assignments } = await adminClient
        .from('account_assignments')
        .select('organization_id')
        .eq('staff_id', staff.id)
      const orgIds = assignments?.map(a => a.organization_id) || []
      query = query.in('organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'])
    }
  } else {
    // Tenant view: Get user's active organizations
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
    const orgIds = memberships?.map(m => m.organization_id) || []
    query = query.in('organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data: tickets } = await query
  if (!tickets || tickets.length === 0) return { user, tickets: [] }

  // Fetch the latest message for each ticket to preview in the drawer
  const ticketIds = tickets.map(t => t.id)
  const { data: latestMsgs } = await adminClient
    .from('support_ticket_messages')
    .select('*')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false })

  const ticketsWithPreview = tickets.map(t => {
    const ticketMsgs = latestMsgs?.filter(m => m.ticket_id === t.id) || []
    const latest = ticketMsgs[0] || { message: t.description, created_at: t.created_at, sender_name: 'System', is_staff_reply: false, sender_id: null }
    return {
      ...t,
      latestMessage: latest,
      messageCount: ticketMsgs.length
    }
  })

  return { user, tickets: ticketsWithPreview }
}

// Global Widget Action: Load messages for a single ticket inside chat head
export async function getWidgetMessagesAction(ticketId: string, viewType: 'admin' | 'tenant') {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: ticket } = await adminClient
    .from('support_tickets')
    .select('description')
    .eq('id', ticketId)
    .single()

  const { data: messages } = await adminClient
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (!messages) return []

  return messages.map((m: any) => ({
    ...m,
    sender: {
      full_name: m.sender_id === user?.id ? 'You' : (m.sender_name || (viewType === 'tenant' ? 'Support Team' : 'Tenant Customer'))
    }
  })).filter((m: any, index: number) => {
    if (index === 0 && ticket && m.message === ticket.description) return false
    return true
  })
}

