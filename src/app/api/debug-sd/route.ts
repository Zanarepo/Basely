import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('generated_documents')
    .select('id, document_type, is_snapshot, project_id, created_at')
    .eq('project_id', '18080d43-3277-479f-8a3c-4ef11f4f062a')
    .eq('document_type', 'solution_design_workspace')
    .eq('is_snapshot', false)
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ rows: data })
}
