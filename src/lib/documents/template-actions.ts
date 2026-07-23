'use server'

import { createClient } from '@/utils/supabase/server'
import { DocumentSectionDef, DocumentTemplate } from './actions'

export type CustomDocumentTemplate = {
  id: string
  organization_id: string
  document_type: string
  name: string
  description: string | null
  section_definitions: DocumentSectionDef[]
  created_at: string
  updated_at: string
}

export async function getCustomTemplates(organizationId: string, documentType?: string): Promise<CustomDocumentTemplate[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('custom_document_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (documentType) {
    query = query.eq('document_type', documentType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to load custom templates:', error)
    return []
  }

  return data as CustomDocumentTemplate[]
}

export async function getCustomTemplateById(templateId: string): Promise<CustomDocumentTemplate | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_document_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    console.error('Failed to load custom template:', error)
    return null
  }
  return data as CustomDocumentTemplate
}

export async function saveCustomTemplate(template: Partial<CustomDocumentTemplate>): Promise<{ ok: boolean; data?: any; error?: string }> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const payload = {
    organization_id: template.organization_id,
    document_type: template.document_type,
    name: template.name,
    description: template.description || null,
    section_definitions: template.section_definitions,
    updated_at: now
  }

  let result
  if (template.id) {
    result = await supabase
      .from('custom_document_templates')
      .update(payload)
      .eq('id', template.id)
      .select()
      .single()
  } else {
    result = await supabase
      .from('custom_document_templates')
      .insert({ ...payload, created_at: now })
      .select()
      .single()
  }

  if (result.error) {
    console.error('Failed to save custom template:', result.error)
    return { ok: false, error: result.error.message }
  }

  return { ok: true, data: result.data }
}

export async function deleteCustomTemplate(templateId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Check if it's being used by any generated documents
  const { count, error: checkError } = await supabase
    .from('generated_documents')
    .select('*', { count: 'exact', head: true })
    .eq('custom_template_id', templateId)
    
  if (checkError) {
    console.error('Failed to check template usage:', checkError)
    return { ok: false, error: 'Failed to verify template usage.' }
  }
  
  if (count && count > 0) {
    return { ok: false, error: `Cannot delete template: It is currently being used by ${count} generated document(s).` }
  }
  
  const { error } = await supabase
    .from('custom_document_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    console.error('Failed to delete custom template:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
