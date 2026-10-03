import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'
import { CheckSquare } from 'lucide-react'
import { ApprovalsWorkspace } from '@/components/dashboard/approvals/ApprovalsWorkspace'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { FeatureGateScreen } from '@/components/dashboard/billing'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 1️⃣ Find the organization the current user belongs to
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization_id, organizations(name, owner_id), profiles!organization_members_user_id_fkey(full_name, email)')
    .eq('user_id', user.id)

  const cookieStore = await cookies()
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const active =
    memberships?.find((m) => m.organization_id === cookieOrgId) ??
    memberships?.[0]

  const rawOrg = active?.organizations
  const orgObj = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg
  const organization =
    orgObj && typeof orgObj === 'object' && 'name' in orgObj
      ? (orgObj as { name: string; owner_id: string })
      : null
  
  const orgName = organization?.name ?? 'Your workspace'
  const isOwner = organization?.owner_id === user.id
  const isAdmin = active?.role === 'Admin' || isOwner
  const canApprove = isAdmin || active?.role === 'PM' || active?.role === 'Sponsor'

  if (!active) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full text-center">
        <p className="text-app-muted">You do not belong to any active workspace.</p>
      </div>
    )
  }

  // Gate: Approvals requires Enterprise tier (governance.approval_workflows)
  const subscription = await getOrganizationSubscription(active.organization_id)
  if (subscription.tierId !== 'enterprise') {
    return (
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <FeatureGateScreen
          featureName="Approval Workflows"
          requiredTier="enterprise"
          description="Formal approval and sign-off workflows for change requests, budget overruns, and scope changes. Available on the Enterprise plan."
          canUpgrade={isAdmin}
        />
      </div>
    )
  }

  // Fetch all members in this org to map user IDs to names
  const { data: allMembers } = await supabase
    .from('organization_members')
    .select('user_id, profiles!organization_members_user_id_fkey(full_name, email)')
    .eq('organization_id', active.organization_id)

  const memberMap = new Map<string, { name: string, email: string }>()
  if (allMembers) {
    allMembers.forEach(m => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      memberMap.set(m.user_id, {
        name: profile?.full_name?.trim() || profile?.email || 'Unknown User',
        email: profile?.email || ''
      })
    })
  }

  // 2️⃣ Fetch requests
  const query = supabase
    .from('approval_requests')
    .select(`
      *,
      approval_policies!inner(action_type, organization_id)
    `)
    .eq('approval_policies.organization_id', active.organization_id)
    .order('created_at', { ascending: false })

  if (!canApprove) {
    query.eq('requested_by_user_id', user.id)
  }

  const { data: requests } = await query

  // 3️⃣ Fetch missing profiles for users not in organization_members
  const missingUserIds = new Set<string>()
  ;(requests || []).forEach((req: any) => {
    if (req.requested_by_user_id && !memberMap.has(req.requested_by_user_id)) {
      missingUserIds.add(req.requested_by_user_id)
    }
    if (req.decided_by_user_id && !memberMap.has(req.decided_by_user_id)) {
      missingUserIds.add(req.decided_by_user_id)
    }
  })

  if (missingUserIds.size > 0) {
    const { data: missingProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(missingUserIds))

    if (missingProfiles) {
      missingProfiles.forEach(p => {
        memberMap.set(p.id, {
          name: p.full_name?.trim() || p.email || 'Unknown User',
          email: p.email || ''
        })
      })
    }
  }

  // 4️⃣ Fetch project names
  const projectIds = new Set<string>()
  ;(requests || []).forEach((req: any) => {
    const pid = req.payload?.baseline?.project_id || req.payload?.project_id
    if (pid) projectIds.add(pid)
  })

  const projectMap = new Map<string, string>()
  if (projectIds.size > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', Array.from(projectIds))
    
    if (projects) {
      projects.forEach(p => projectMap.set(p.id, p.name))
    }
  }

  const mappedRequests = (requests || []).map((req: any) => {
    const requester = memberMap.get(req.requested_by_user_id)
    const decider = req.decided_by_user_id ? memberMap.get(req.decided_by_user_id) : null
    const pid = req.payload?.baseline?.project_id || req.payload?.project_id
    return {
      ...req,
      action_type: req.approval_policies?.action_type,
      requester_name: requester?.name || 'Unknown User',
      requester_email: requester?.email || '',
      decider_name: decider?.name || null,
      project_name: pid ? projectMap.get(pid) : undefined,
    }
  })

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 shrink-0">
        <div className="p-2.5 rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 shadow-sm">
          <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-app-fg">Approvals</h1>
          <p className="text-xs sm:text-sm text-app-muted">{orgName}</p>
        </div>
      </div>

      <ApprovalsWorkspace 
        organizationId={active.organization_id} 
        requests={mappedRequests} 
        canApprove={canApprove}
        currentUserId={user.id}
      />
    </div>
  )
}
