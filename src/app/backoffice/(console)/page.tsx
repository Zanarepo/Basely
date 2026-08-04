import { requireSuperadmin, getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { PromoteStaffModal } from '@/components/backoffice/PromoteStaffModal'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BackofficeDashboard() {
  // Only superadmins and senior support can view financial metrics
  const staff = await getStaffSession()
  const isSuper = staff?.role === 'superadmin'

  const supabase = createAdminClient()

  // 0. If Account Manager, fetch their assigned orgs
  let assignedOrgIds: string[] | null = null
  if (staff?.role === 'account_manager') {
    const { data: assignments } = await supabase
      .from('account_assignments')
      .select('organization_id')
      .eq('staff_id', staff.id)
    assignedOrgIds = assignments?.map(a => a.organization_id) || []
  }

  // 1. Fetch Subscription Stats
  let subQuery = supabase.from('organization_subscriptions').select('organization_id, tier_id, status, seat_count')
  if (assignedOrgIds !== null) {
    if (assignedOrgIds.length === 0) {
      subQuery = subQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
    } else {
      subQuery = subQuery.in('organization_id', assignedOrgIds)
    }
  }
  
  const { data: subs } = await subQuery
  
  const totalOrgs = subs?.length || 0
  const freeOrgs = subs?.filter(s => s.tier_id === 'free').length || 0
  const premiumOrgs = subs?.filter(s => s.tier_id === 'premium').length || 0
  const enterpriseOrgs = subs?.filter(s => s.tier_id === 'enterprise').length || 0
  const trialingOrgs = subs?.filter(s => s.status === 'trialing').length || 0
  const expiredOrgs = subs?.filter(s => s.status === 'expired').length || 0

  // 2. Calculate rough MRR and ARR (assuming Premium=25, Enterprise=65 as base)
  let estimatedMrr = 0
  subs?.forEach(s => {
    if (s.status === 'active' || s.status === 'trialing') { // include trialing in potential MRR for now, or just active
      if (s.tier_id === 'premium') estimatedMrr += (s.seat_count * 25)
      if (s.tier_id === 'enterprise') estimatedMrr += (s.seat_count * 65)
    }
  })
  const estimatedArr = estimatedMrr * 12
  
  // Calculate Churn Rate (Canceled + Expired / Total)
  const canceledOrgs = subs?.filter(s => s.status === 'canceled').length || 0
  const churnRate = totalOrgs > 0 ? ((expiredOrgs + canceledOrgs) / totalOrgs) * 100 : 0

  // 3. Fetch Total Users
  let usersQuery = supabase.from('organization_members').select('*', { count: 'exact', head: true })
  if (assignedOrgIds !== null) {
    if (assignedOrgIds.length === 0) {
      usersQuery = usersQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000')
    } else {
      usersQuery = usersQuery.in('organization_id', assignedOrgIds)
    }
  }
  const { count: userCount } = await usersQuery
  
  const activeUsage = userCount ? Math.floor(userCount * 0.68) : 0 // Mock active usage

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-app-fg tracking-tight">{staff?.role === 'account_manager' ? 'My Portfolio Metrics' : 'Platform Metrics'}</h1>
          <p className="text-sm text-app-muted mt-1">{staff?.role === 'account_manager' ? 'Aggregated usage and billing for your assigned tenants.' : 'Cross-tenant aggregation of usage and billing.'}</p>
        </div>
        {isSuper && staff && (
          <PromoteStaffModal staffRole={staff.role} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Active Users */}
        <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Total Users</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-app-fg">{userCount || 0}</span>
          </div>
        </div>

        {/* Active Usage */}
        <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Active Usage</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-app-fg">{activeUsage}</span>
            <span className="text-xs text-app-subtle font-medium mb-1">DAU (Est)</span>
          </div>
        </div>



        {/* Estimated MRR / ARR */}
        <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Platform Revenue</p>
          <div className="flex flex-col gap-1 mt-1">
            {isSuper ? (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${estimatedMrr.toLocaleString()}</span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-bold uppercase mb-1">MRR</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-emerald-600/80 dark:text-emerald-400/80">${estimatedArr.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 font-bold uppercase mb-1">ARR</span>
                </div>
              </>
            ) : (
              <span className="text-2xl font-black text-app-muted blur-[6px] select-none">$XXX,XXX</span>
            )}
          </div>
          {!isSuper && <p className="text-[10px] text-app-subtle mt-1">Superadmin only</p>}
        </div>

        {/* Expired / Churn Signals */}
        <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2">Churn Rate</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-red-600 dark:text-red-400">{churnRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-app-subtle mt-1">{expiredOrgs + canceledOrgs} expired/canceled plans</p>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm">
        <h3 className="text-sm font-bold text-app-fg mb-6 uppercase tracking-wider">Tier Distribution</h3>
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm font-medium text-app-muted">Free Starter</span>
            </div>
            <span className="text-sm font-bold text-app-fg">{freeOrgs}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-app-muted">Premium</span>
            </div>
            <span className="text-sm font-bold text-app-fg">{premiumOrgs}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm font-medium text-app-muted">Enterprise</span>
            </div>
            <span className="text-sm font-bold text-app-fg">{enterpriseOrgs}</span>
          </div>
          
          <div className="flex items-center justify-between border-t border-app-border/50 pt-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm font-medium text-app-muted">Currently Trialing</span>
            </div>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{trialingOrgs}</span>
          </div>

        </div>
      </div>
    </div>
  )
}
