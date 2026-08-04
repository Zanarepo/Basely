import { getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { TenantSearchInput } from '@/components/backoffice/TenantSearchInput'
import { TenantFilters } from '@/components/backoffice/TenantFilters'

export const dynamic = 'force-dynamic'

export default async function TenantDirectory(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const staff = await getStaffSession() // verify auth
  if (!staff) {
    return null // or redirect
  }
  
  const searchParams = await props.searchParams
  const q = typeof searchParams?.q === 'string' ? searchParams.q.toLowerCase() : ''
  const tierFilter = typeof searchParams?.tier === 'string' ? searchParams.tier : ''
  const statusFilter = typeof searchParams?.status === 'string' ? searchParams.status : ''

  const supabase = createAdminClient()
  
  let assignedOrgIds: string[] | null = null
  if (staff.role === 'account_manager') {
    const { data: assignments } = await supabase
      .from('account_assignments')
      .select('organization_id')
      .eq('staff_id', staff.id)
      
    assignedOrgIds = assignments?.map(a => a.organization_id) || []
  }

  // We fetch organizations joined with their subscriptions
  // Due to Supabase types we can query the view or just query orgs and subs and merge in code.
  // Querying orgs first, then subs.
  let orgQuery = supabase.from('organizations').select('id, name, created_at').order('created_at', { ascending: false })
  
  if (assignedOrgIds !== null) {
    if (assignedOrgIds.length === 0) {
      // no assignments, force empty
      orgQuery = orgQuery.eq('id', '00000000-0000-0000-0000-000000000000') // impossible uuid
    } else {
      orgQuery = orgQuery.in('id', assignedOrgIds)
    }
  }

  if (q) {
    orgQuery = orgQuery.ilike('name', `%${q}%`)
  }

  const { data: organizations } = await orgQuery
  const { data: subscriptions } = await supabase.from('organization_subscriptions').select('organization_id, tier_id, status, seat_count')

  let merged = organizations?.map(org => {
    const sub = subscriptions?.find(s => s.organization_id === org.id)
    return {
      ...org,
      tier: sub?.tier_id || 'free',
      status: sub?.status || 'active',
      seats: sub?.seat_count || 1
    }
  }) || []

  // Apply filters
  if (q) {
    merged = merged.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
  }
  if (tierFilter) {
    merged = merged.filter(t => t.tier === tierFilter)
  }
  if (statusFilter) {
    merged = merged.filter(t => t.status === statusFilter)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-app-fg tracking-tight">Tenant Directory</h1>
          <p className="text-sm text-app-muted mt-1">Search and manage all organizations on the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <TenantSearchInput defaultValue={q} />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-app-card rounded-2xl border border-app-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-surface border-b border-app-border">
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Organization Name</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider">Seats</th>
                <th className="px-6 py-4 text-xs font-black text-app-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {merged.map((tenant) => (
                <tr key={tenant.id} className="group hover:bg-app-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-app-muted-surface flex items-center justify-center font-bold text-app-fg text-xs uppercase border border-app-border">
                        {tenant.name.substring(0,2)}
                      </div>
                      <div>
                        <div className="font-bold text-app-fg text-sm">{tenant.name}</div>
                        <div className="text-xs text-app-muted font-mono">{tenant.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      tenant.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                      tenant.tier === 'premium' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-app-bg text-app-muted border border-app-border'
                    }`}>
                      {tenant.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        tenant.status === 'active' ? 'bg-emerald-500' :
                        tenant.status === 'trialing' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-xs font-semibold text-app-fg capitalize">{tenant.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-app-fg">{tenant.seats}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Action button appears only on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                      <Link 
                        href={`/backoffice/tenants/${tenant.id}`}
                        className="px-3 py-1.5 bg-app-surface-solid border border-app-border text-app-fg hover:bg-app-hover text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                        style={{ cursor: 'pointer' }}
                      >
                        <span>View Detail</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              
              {merged.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-app-muted">
                    No organizations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
