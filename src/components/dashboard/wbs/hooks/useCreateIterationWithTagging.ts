'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Iteration } from '@/lib/releases/types'

export function useCreateIterationWithTagging(projectId: string) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createIterationWithTagging = async (
    name: string,
    sequenceNumber: number,
    startDate: string,
    endDate: string,
    labelOverride?: 'sprint' | 'phase' | null,
    selectedWbsIds: string[] = []
  ): Promise<{ ok: boolean; error?: string; iteration?: Iteration }> => {
    setCreating(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Insert new iteration
      const { data: newIter, error: insertErr } = await supabase
        .from('iterations')
        .insert({
          project_id: projectId,
          name,
          sequence_number: sequenceNumber,
          start_date: startDate,
          end_date: endDate,
          label_override: labelOverride || null,
        })
        .select('*')
        .single()

      if (insertErr) {
        setCreating(false)
        setError(insertErr.message)
        return { ok: false, error: insertErr.message }
      }

      // 2. Batch update selected WBS elements
      if (selectedWbsIds && selectedWbsIds.length > 0) {
        const { error: wbsErr } = await supabase
          .from('wbs_elements')
          .update({ iteration_id: newIter.id })
          .in('id', selectedWbsIds)

        if (wbsErr) {
          console.warn('WBS tagging warning:', wbsErr)
        }

        // 3. Batch update associated activities
        try {
          await supabase
            .from('activities')
            .update({ iteration_id: newIter.id })
            .in('wbs_element_id', selectedWbsIds)
        } catch (actErr) {
          console.warn('Activities tagging warning:', actErr)
        }
      }

      const createdIteration: Iteration = {
        id: newIter.id,
        projectId: newIter.project_id,
        name: newIter.name,
        sequenceNumber: newIter.sequence_number,
        startDate: newIter.start_date,
        endDate: newIter.end_date,
        labelOverride: newIter.label_override || null,
        createdAt: newIter.created_at,
        updatedAt: newIter.updated_at,
      }

      setCreating(false)
      return { ok: true, iteration: createdIteration }
    } catch (err: any) {
      setCreating(false)
      const msg = err.message || 'Failed to create iteration'
      setError(msg)
      return { ok: false, error: msg }
    }
  }

  return {
    creating,
    error,
    createIterationWithTagging,
  }
}
