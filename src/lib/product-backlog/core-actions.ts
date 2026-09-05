'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logGovernanceEvent } from '@/lib/governance/actions'

export async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function getBacklogItems(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_backlog_items')
    .select('*')
    .eq('project_id', projectId)
    .order('rice_score', { ascending: false })
  
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function upsertBacklogItem(payload: {
  id?: string
  project_id: string
  organization_id: string
  title: string
  description?: string
  reach?: number
  impact?: number
  confidence?: number
  effort?: number
  moscow_status?: string | null
  kano_category?: string | null
}) {
  const { supabase } = await getAuthenticatedClient()
  const { data, error } = await supabase
    .from('product_backlog_items')
    .upsert({
      id: payload.id,
      project_id: payload.project_id,
      organization_id: payload.organization_id,
      title: payload.title,
      description: payload.description,
      reach: payload.reach ?? 1,
      impact: payload.impact ?? 1,
      confidence: payload.confidence ?? 100,
      effort: payload.effort ?? 1,
      moscow_status: payload.moscow_status,
      kano_category: payload.kano_category,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
    
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function deleteBacklogItem(id: string) {
  const { supabase } = await getAuthenticatedClient()
  const { error } = await supabase.from('product_backlog_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
