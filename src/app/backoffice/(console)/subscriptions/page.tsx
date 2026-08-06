import { getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { SubscriptionsClient, SubscriptionTenant } from '@/components/backoffice/SubscriptionsClient'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsDirectory() {
  const staff = await getStaffSession()
  if (!staff) return null

  const supabase = createAdminClient()

  // 1. Fetch orgs
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .order('created_at', { ascending: false })

  // 2. Fetch subs
  const { data: subs } = await supabase
    .from('organization_subscriptions')
    .select('organization_id, tier_id, status, current_period_end')

  // 3. Fetch owners
  const { data: owners } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      profiles!organization_members_user_id_fkey (
        email,
        full_name
      )
    `)
    .eq('role', 'Admin')

  // 4. Merge
  const initialData: SubscriptionTenant[] = (orgs || []).map(org => {
    const sub = subs?.find(s => s.organization_id === org.id)
    const ownerData = owners?.find(o => o.organization_id === org.id)

    // profiles might be an array if relation is one-to-many, but it's one-to-one via user_id
    // Cast it to any to handle both cases safely
    const profile = ownerData?.profiles as any
    const ownerEmail = Array.isArray(profile) ? profile[0]?.email : profile?.email
    const ownerName = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name

    return {
      id: org.id,
      name: org.name,
      owner_email: ownerEmail || 'No Owner',
      owner_name: ownerName || 'N/A',
      tier: sub?.tier_id || 'free',
      status: sub?.status || 'expired',
      period_end: sub?.current_period_end || null
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-app-fg tracking-tight">Subscriptions & Payments</h1>
          <p className="text-sm text-app-muted mt-1">Track billing, countdowns, and payment history.</p>
        </div>
      </div>

      <SubscriptionsClient initialData={initialData} />
    </div>
  )
}
