export type DocumentSectionDef = {
  key: string
  title: string
  type: 'data_bound' | 'free_text'
  source?: string
  placeholder?: string
}

export type DocumentTemplate = {
  id: string
  name?: string
  document_type: string
  section_definitions: DocumentSectionDef[]
  created_at: string
  is_custom?: boolean
}

export type GeneratedDocument = {
  id: string
  project_id: string
  document_type: string
  custom_template_id?: string
  free_text_content: Record<string, string>
  is_snapshot: boolean
  frozen_data?: any
  period_end?: string
  generated_at: string
  created_at: string
  updated_at: string
}
