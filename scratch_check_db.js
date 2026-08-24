require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function checkDb() {
  const { data, error } = await supabase
    .from('generated_documents')
    .select('id, project_id, document_type, is_stale, stale_reason')
    .in('document_type', ['product_strategy_document', 'charter'])
    .order('updated_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Latest Strategy/Charter Docs:', data);
  }
}

checkDb();
