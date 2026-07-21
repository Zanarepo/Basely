import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { updateActivityScheduling } from '@/lib/schedule/actions/activities'
import type { WbsElement } from '@/lib/wbs/constants'

interface UseWbsSubmitProps {
  element: WbsElement | null
  hasEditAccess: boolean
  onSave: (id: string, updates: Partial<WbsElement>) => Promise<boolean>
  onClose: () => void
  setScheduleError: (err: string | null) => void
  elementState: any
  schedulingState: any
}

export function useWbsSubmit({
  element,
  hasEditAccess,
  onSave,
  onClose,
  setScheduleError,
  elementState,
  schedulingState
}: UseWbsSubmitProps) {
  const [saving, setSaving] = useState(false)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasEditAccess || !element) return

    setSaving(true)
    setScheduleError(null)

    try {
      const wbsSuccess = await onSave(element.id, {
        name: elementState.name.trim(),
        description: elementState.description.trim() || null,
        deliverables: elementState.deliverables.trim() || null,
        deliverablesData: elementState.deliverablesData,
        acceptanceCriteria: elementState.acceptanceCriteria.trim() || null,
        acceptanceCriteriaData: elementState.acceptanceCriteriaData,
        status: elementState.status,
        isWorkPackage: elementState.isWorkPackage,
      })

      if (!wbsSuccess) {
        setSaving(false)
        return
      }

      if (elementState.isWorkPackage) {
        let activeActId = schedulingState.activityId
        const supabase = createClient()
        
        if (!activeActId) {
          const { data: newAct } = await supabase
            .from('activities')
            .select('id')
            .eq('wbs_element_id', element.id)
            .maybeSingle()
          if (newAct) activeActId = newAct.id
        }

        if (activeActId) {
          const constraintType = schedulingState.autoSchedule ? 'ASAP' : 'Start No Earlier Than'
          const constraintDate = schedulingState.autoSchedule ? null : (schedulingState.startDate || null)

          const schedRes = await updateActivityScheduling(element.projectId, activeActId, {
            duration: schedulingState.duration,
            constraintType,
            constraintDate,
            predecessors: schedulingState.predecessors,
          })

          if (!schedRes.ok) {
            setScheduleError(schedRes.error)
            setSaving(false)
            return
          }
        }
      }

      setSaving(false)
      onClose()
    } catch (err: any) {
      console.error(err)
      setScheduleError(err.message)
      setSaving(false)
    }
  }

  return { saving, handleFormSubmit }
}
