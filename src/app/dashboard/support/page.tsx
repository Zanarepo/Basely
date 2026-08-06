import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { SupportDashboardClient } from '../../../components/support/SupportDashboardClient'

export default async function SupportDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value

  // Get user's orgs
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)

  const activeOrgId = cookieOrgId && memberships?.find(m => m.organization_id === cookieOrgId)
    ? cookieOrgId
    : memberships?.[0]?.organization_id

  if (!activeOrgId) return <div>No active organization found.</div>

  // Fetch tickets
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, projects(name)')
    .eq('organization_id', activeOrgId)
    .order('created_at', { ascending: false })

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('organization_id', activeOrgId)
    .order('name')

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-app-fg tracking-tight">Support Tickets</h1>
          <p className="text-app-muted mt-2">Create and track your support requests.</p>
        </div>
      </div>
      
      <SupportDashboardClient initialTickets={tickets || []} organizationId={activeOrgId} projects={projects || []} />
    </div>
  )
}
