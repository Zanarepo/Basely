import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { FeatureGateScreen } from '@/components/dashboard/billing'
import { ApiKeysPanel } from '@/components/dashboard/settings/developers/ApiKeysPanel'
import { WebhooksPanel } from '@/components/dashboard/settings/developers/WebhooksPanel'

export default async function DevelopersSettingsPage() {
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
        <p className="text-app-muted">Only workspace administrators can manage API keys and webhooks.</p>
      </div>
    )
  }

  // Tier check — Enterprise only (integrations.api_webhooks)
  const subscription = await getOrganizationSubscription(active.organization_id)
  if (subscription.tierId !== 'enterprise') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <FeatureGateScreen
          featureName="REST API & Webhooks"
          requiredTier="enterprise"
          description="Generate API keys and configure outbound webhooks to integrate with external tools and automation pipelines. Available on the Enterprise plan."
          canUpgrade={true}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      <div>
        <h1 className="text-2xl font-bold text-app-fg tracking-tight">Developers & Integrations</h1>
        <p className="text-app-muted mt-2 max-w-2xl">
          Manage API keys and Webhooks to integrate your organization's data with external tools and ERP systems. 
          Need help? <a href="/dashboard/settings/developers/api-docs" className="text-indigo-500 hover:underline">View the API Documentation &rarr;</a>
        </p>
      </div>

      <div className="space-y-6">
        <ApiKeysPanel />
        <WebhooksPanel />
      </div>
    </div>
  )
}
