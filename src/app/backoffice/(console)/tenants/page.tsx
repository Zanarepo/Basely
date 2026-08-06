import { getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { TenantSearchInput } from '@/components/backoffice/TenantSearchInput'
import { TenantFilters } from '@/components/backoffice/TenantFilters'
import { getChurnRiskScores } from '@/lib/backoffice/analytics'
import { TenantsTableClient } from '@/components/backoffice/TenantsTableClient'

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

  // Fetch Churn Risk Scores
  const orgIdsToFetch = organizations?.map(o => o.id) || []
  const churnScores = await getChurnRiskScores(orgIdsToFetch)

  let merged = organizations?.map(org => {
    const sub = subscriptions?.find(s => s.organization_id === org.id)
    const churn = churnScores.find(c => c.organization_id === org.id)
    return {
      ...org,
      tier: sub?.tier_id || 'free',
      status: sub?.status || 'active',
      seats: sub?.seat_count || 1,
      churnScore: churn?.score || 0
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

      <TenantsTableClient tenants={merged as any} />
    </div>
  )
}
