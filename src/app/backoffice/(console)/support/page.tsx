import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SupportInboxFilters } from '@/components/support/SupportInboxFilters'
import { Pagination } from '@/components/support/Pagination'
import { SlaPolicyGuide } from '@/components/support/SlaPolicyGuide'

export default async function BackofficeSupportInbox(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get staff role
  const { data: staff } = await adminClient
    .from('internal_staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!staff) return <div>Unauthorized</div>

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const pageSize = 15
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const status = typeof searchParams.status === 'string' ? searchParams.status : null
  const priority = typeof searchParams.priority === 'string' ? searchParams.priority : null

  // Fetch tickets based on role
  let query = adminClient
    .from('support_tickets')
    .select('*, organizations!inner(name), projects(name)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (priority && priority !== 'all') query = query.eq('priority', priority)

  if (staff.role === 'account_manager') {
    const { data: assignments } = await adminClient
      .from('account_assignments')
      .select('organization_id')
      .eq('staff_id', staff.id)
    const orgIds = assignments?.map(a => a.organization_id) || []
    query = query.in('organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data: tickets, error, count } = await query
  const totalPages = count ? Math.ceil(count / pageSize) : 0

  if (error) {
    return <div>Error loading tickets: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-app-fg">Support Inbox</h1>
          <SupportInboxFilters />
        </div>
        <div>
          <SlaPolicyGuide />
        </div>
      </div>

      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-app-surface border-b border-app-border">
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Ticket</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Organization</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase">Last Updated</th>
              <th className="px-6 py-4 text-xs font-black text-app-muted uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {tickets?.map((t: any) => (
              <tr key={t.id} className="hover:bg-app-hover group">
                <td className="px-6 py-4">
                  <div className="font-bold text-app-fg text-sm">{t.subject}</div>
                  <div className={`text-xs mt-1 font-bold ${
                    t.priority === 'urgent' ? 'text-red-500' :
                    t.priority === 'high' ? 'text-orange-500' :
                    'text-app-muted'
                  }`}>
                    {t.priority.toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-app-fg">{t.organizations?.name}</div>
                  {t.projects?.name && (
                    <div className="text-xs font-medium text-app-muted mt-0.5 max-w-[200px] truncate" title={t.projects.name}>
                      {t.projects.name}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    t.status === 'resolved' || t.status === 'closed'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : t.status === 'waiting_on_customer'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                  {t.sla_breach_alerted && (
                    <span className="ml-2 text-xs font-bold text-red-500">SLA Breach</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-app-muted">
                  {new Date(t.updated_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/backoffice/support/${t.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-app-accent hover:text-app-accent-hover opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View Thread <ArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {!tickets || tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-app-muted">
                  Inbox is zero! 🎉 No open tickets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <Pagination totalPages={totalPages} currentPage={page} />
      </div>
    </div>
  )
}
