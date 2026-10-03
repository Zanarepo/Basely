import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('generated_documents')
    .select('id, document_type, name, is_snapshot, created_at')
    .in('document_type', ['budget_baseline', 'schedule_document'])

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Docs found:', JSON.stringify(data, null, 2))
  }
}

main()
