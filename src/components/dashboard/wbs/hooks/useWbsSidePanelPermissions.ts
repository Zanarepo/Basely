import type { WbsElement } from '@/lib/wbs/constants'

type UseWbsSidePanelPermissionsProps = {
  element: WbsElement | null
  hasEditAccess: boolean
  callerRole?: string
  callerUserId?: string
  allowTeamScheduleEdits?: boolean
}

export function useWbsSidePanelPermissions({
  element,
  hasEditAccess,
  callerRole,
  callerUserId,
  allowTeamScheduleEdits = false,
}: UseWbsSidePanelPermissionsProps) {
  const isTeamMember = callerRole === 'Team Member'
  const isResponsible =
    element?.raciAssignments?.some(
      (a) => a.roleType === 'Responsible' && a.stakeholder?.linked_user_id === callerUserId
    ) ?? false
  const isAccountable =
    element?.raciAssignments?.some(
      (a) => a.roleType === 'Accountable' && a.stakeholder?.linked_user_id === callerUserId
    ) ?? false

  const effectiveEditAccess = hasEditAccess && (!isTeamMember || isResponsible)
  const canEditSchedule =
    hasEditAccess && !!(effectiveEditAccess || (allowTeamScheduleEdits && isResponsible))
  const canCheckDeliverables = hasEditAccess && (effectiveEditAccess || isResponsible)
  const canCheckCriteria = hasEditAccess && (effectiveEditAccess || isAccountable)

  return {
    isTeamMember,
    isResponsible,
    isAccountable,
    effectiveEditAccess,
    canEditSchedule,
    canCheckDeliverables,
    canCheckCriteria,
  }
}
