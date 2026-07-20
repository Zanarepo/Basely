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

  if (error) {
    console.error('Failed to load document template:', error)
    return null
  }
  return data
}

export async function getGeneratedDocument(projectId: string, documentType: string, isSnapshot = false): Promise<GeneratedDocument | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', isSnapshot)
    .maybeSingle()

  if (error) {
    console.error('Failed to load generated document:', error)
    return null
  }
  return data
}

export async function saveGeneratedDocument(
  projectId: string,
  documentType: string,
  freeTextContent: Record<string, string>,
  isSnapshot = false
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Upsert the document
  const { error } = await supabase
    .from('generated_documents')
    .upsert(
      {
        project_id: projectId,
        document_type: documentType,
        free_text_content: freeTextContent,
        is_snapshot: isSnapshot,
        generated_at: now,
        updated_at: now,
      },
      { onConflict: 'project_id, document_type, is_snapshot' }
    )

  if (error) {
    return { ok: false, error: error.message }
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

  // First check if it exists, if not, we can't just update generated_at easily without upserting.
  // Actually, upserting with an empty free_text_content if it doesn't exist is fine.
  
  const { data: existing } = await supabase
    .from('generated_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', isSnapshot)
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
        is_snapshot: isSnapshot,
        generated_at: now,
      })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}
