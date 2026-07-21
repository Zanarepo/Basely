'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type DocumentSectionDef = {
  key: string
  title: string
  type: 'data_bound' | 'free_text'
  source?: string
}

export type DocumentTemplate = {
  id: string
  document_type: string
  section_definitions: DocumentSectionDef[]
  created_at: string
}

export type GeneratedDocument = {
  id: string
  project_id: string
  document_type: string
  free_text_content: Record<string, string>
  is_snapshot: boolean
  frozen_data?: any
  period_end?: string
  generated_at: string
  created_at: string
  updated_at: string
}

export async function getDocumentTemplate(documentType: string): Promise<DocumentTemplate | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('document_type', documentType)
    .single()

  if (documentType === 'charter') {
    return {
      id: data?.id || 'charter-template',
      document_type: 'charter',
      created_at: data?.created_at || new Date().toISOString(),
      section_definitions: [
        { key: 'executive_summary', title: 'Executive Summary', type: 'free_text' },
        { key: 'business_case', title: 'Business Case & Justification', type: 'free_text' },
        { key: 'objectives', title: 'Project Objectives', type: 'free_text' },
        { key: 'scope_statement', title: 'Scope Statement', type: 'free_text' },
        { key: 'wbs_dictionary', title: 'Key Deliverables & Work Packages', type: 'free_text' },
        { key: 'success_criteria', title: 'Success Criteria', type: 'free_text' },
        { key: 'assumptions', title: 'Assumptions', type: 'free_text' },
        { key: 'constraints', title: 'Constraints', type: 'free_text' },
        { key: 'risks', title: 'High-Level Risks', type: 'free_text' },
        { key: 'milestones', title: 'Milestones & Key Dates', type: 'free_text' },
        { key: 'organization', title: 'Project Organization & RACI', type: 'free_text' },
        { key: 'approval', title: 'Sign-Off & Approval', type: 'free_text' }
      ]
    }
  }

  if (error) {
    console.error('Failed to load document template:', error)
    return null
  }
  return data
}

export async function getGeneratedDocument(projectId: string, documentType: string, isSnapshot = false, snapshotId?: string): Promise<GeneratedDocument | null> {
  const supabase = await createClient()
  let query = supabase
    .from('generated_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', isSnapshot)

  if (isSnapshot && snapshotId) {
    query = query.eq('id', snapshotId)
  } else if (isSnapshot) {
    // If asking for a snapshot but no ID provided, maybe order by latest
    query = query.order('generated_at', { ascending: false }).limit(1)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Failed to load generated document:', error)
    return null
  }
  return data
}

export async function getReportSnapshots(projectId: string, documentType: string): Promise<GeneratedDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('generated_documents')
    .select('id, period_end, generated_at')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', true)
    .order('period_end', { ascending: false })

  if (error) return []
  return data as GeneratedDocument[]
}

export async function saveGeneratedDocument(
  projectId: string,
  documentType: string,
  freeTextContent: Record<string, string>,
  isSnapshot = false,
  frozenData?: any,
  periodEnd?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  if (isSnapshot) {
    // Snapshots are always inserts now
    const { error } = await supabase
      .from('generated_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        free_text_content: freeTextContent,
        is_snapshot: true,
        frozen_data: frozenData || {},
        period_end: periodEnd,
        generated_at: now,
        updated_at: now,
      })

    if (error) return { ok: false, error: error.message }
  } else {
    // Drafts are upserted using the partial unique index or manually
    // To be safe with the partial index, we can just do an update or insert
    const { data: existing } = await supabase
      .from('generated_documents')
      .select('id')
      .eq('project_id', projectId)
      .eq('document_type', documentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('generated_documents')
        .update({
          free_text_content: freeTextContent,
          updated_at: now,
        })
        .eq('id', existing.id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          free_text_content: freeTextContent,
          is_snapshot: false,
          generated_at: now,
          updated_at: now,
        })
      if (error) return { ok: false, error: error.message }
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function regenerateDocument(
  projectId: string,
  documentType: string,
  isSnapshot = false
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  if (isSnapshot) {
    return { ok: false, error: 'Cannot regenerate a snapshot directly this way' }
  }
  
  const { data: existing } = await supabase
    .from('generated_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', false)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('generated_documents')
      .update({ generated_at: now, updated_at: now })
      .eq('id', existing.id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('generated_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        free_text_content: {},
        is_snapshot: false,
        generated_at: now,
      })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
