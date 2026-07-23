import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TemplatesWorkspace from '@/components/dashboard/settings/templates/TemplatesWorkspace'
import { cookies } from 'next/headers'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'

export default async function TemplatesSettingsPage() {
  const supabase = await createClient()

  // Verify auth and org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const active =
    memberships?.find((m) => m.organization_id === cookieOrgId) ??
    memberships?.[0]

  if (!active) redirect('/dashboard')

  if (active.role !== 'Admin') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-app-fg mb-2">Access Denied</h2>
        <p className="text-app-muted">Only organization administrators can manage document templates.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <TemplatesWorkspace 
        organizationId={active.organization_id} 
      />
    </div>
  )
}
