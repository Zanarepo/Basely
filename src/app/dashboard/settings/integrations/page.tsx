import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { FeatureGateScreen } from '@/components/dashboard/billing'
import { ErpIntegrationContainer } from '@/components/dashboard/settings/integrations/ErpIntegrationContainer'

export default async function ErpIntegrationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization_id, organizations(owner_id)')
    .eq('user_id', user.id)

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const active =
    memberships?.find((m) => m.organization_id === cookieOrgId) ??
    memberships?.[0]

  if (!active) redirect('/dashboard')

  const rawOrg = active.organizations
  const orgObj = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg
  const isOwner = orgObj && typeof orgObj === 'object' && 'owner_id' in orgObj
    ? (orgObj as { owner_id: string }).owner_id === user.id
    : false
  const isAdmin = active.role === 'Admin' || isOwner

  // Role check — only Admins/Owners
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-app-fg mb-2">Access Denied</h2>
        <p className="text-app-muted">Only workspace administrators can manage ERP integrations.</p>
      </div>
    )
  }

  // Tier check — Enterprise only (integrations.erp_connector)
  const subscription = await getOrganizationSubscription(active.organization_id)
  if (subscription.tierId !== 'enterprise') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <FeatureGateScreen
          featureName="ERP Connectors"
          requiredTier="enterprise"
          description="Connect QuickBooks, NetSuite, SAP, and Xero ledgers for live financial data sync across all your projects. Available on the Enterprise plan."
          canUpgrade={true}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <ErpIntegrationContainer />
    </div>
  )
}
