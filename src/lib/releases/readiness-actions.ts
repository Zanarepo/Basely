'use server'

import { createClient } from '@/utils/supabase/server'
import type { ReleaseReadinessItem } from './types'
import { revalidatePath } from 'next/cache'

export async function addReadinessItem(
  releaseId: string,
  category: string,
  itemText: string
): Promise<{ ok: boolean; error?: string; item?: ReleaseReadinessItem }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('release_readiness_items')
    .insert({
      release_id: releaseId,
      category: category.trim(),
      item_text: itemText.trim(),
      is_checked: false
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }
  return {
    ok: true,
    item: {
      id: data.id,
      releaseId: data.release_id,
      category: data.category,
      itemText: data.item_text,
      isChecked: data.is_checked,
      checkedByUserId: data.checked_by_user_id,
      checkedAt: data.checked_at,
      createdAt: data.created_at
    }
  }
}

export async function toggleReadinessItem(
  id: string,
  releaseId: string,
  isChecked: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || null

  const updateData = isChecked
    ? { is_checked: true, checked_by_user_id: userId, checked_at: new Date().toISOString() }
    : { is_checked: false, checked_by_user_id: null, checked_at: null }

  const { error } = await supabase
    .from('release_readiness_items')
    .update(updateData)
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteReadinessItem(
  id: string,
  releaseId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_readiness_items')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function loadDefaultReadinessItems(
  releaseId: string,
  organizationId: string
): Promise<{ ok: boolean; error?: string; items?: ReleaseReadinessItem[] }> {
  const supabase = await createClient()
  
  const { data: templates, error: tmplErr } = await supabase
    .from('org_release_readiness_templates')
    .select('*')
    .eq('organization_id', organizationId)

  if (tmplErr) return { ok: false, error: tmplErr.message }
  
  if (!templates || templates.length === 0) {
    // If no templates exist, insert system defaults
    const defaults = [
      { category: 'Product', item_text: 'Feature documentation is complete and published' },
      { category: 'Product', item_text: 'Release notes drafted and approved' },
      { category: 'Engineering', item_text: 'All related PRs are merged to mainline' },
      { category: 'Engineering', item_text: 'Database migrations reviewed and tested' },
      { category: 'QA', item_text: 'All automated regression tests pass' },
      { category: 'QA', item_text: 'Manual acceptance testing completed and signed off' },
      { category: 'DevOps', item_text: 'Infrastructure capacity scaled and ready' },
      { category: 'DevOps', item_text: 'Monitoring and alerts configured' }
    ]
    
    const itemsToInsert = defaults.map(d => ({
      release_id: releaseId,
      category: d.category,
      item_text: d.item_text,
      is_checked: false
    }))
    
    const { data: inserted, error: insErr } = await supabase
      .from('release_readiness_items')
      .insert(itemsToInsert)
      .select('*')

    if (insErr) return { ok: false, error: insErr.message }

    const items = (inserted || []).map(r_item => ({
      id: r_item.id,
      releaseId: r_item.release_id,
      category: r_item.category,
      itemText: r_item.item_text,
      isChecked: r_item.is_checked,
      checkedByUserId: r_item.checked_by_user_id,
      checkedAt: r_item.checked_at,
      createdAt: r_item.created_at
    }))

    return { ok: true, items }
  } else {
    const itemsToInsert = templates.map(t => ({
      release_id: releaseId,
      category: t.category,
      item_text: t.item_text,
      is_checked: false
    }))
    
    const { data: inserted, error: insErr } = await supabase
      .from('release_readiness_items')
      .insert(itemsToInsert)
      .select('*')

    if (insErr) return { ok: false, error: insErr.message }

    const items = (inserted || []).map(r_item => ({
      id: r_item.id,
      releaseId: r_item.release_id,
      category: r_item.category,
      itemText: r_item.item_text,
      isChecked: r_item.is_checked,
      checkedByUserId: r_item.checked_by_user_id,
      checkedAt: r_item.checked_at,
      createdAt: r_item.created_at
    }))

    return { ok: true, items }
  }
}
