const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- Checking product_requirements_docs ---');
  const { data: prds, error: prdError } = await supabase
    .from('product_requirements_docs')
    .select('*');
  
  if (prdError) {
    console.error('PRD Error:', prdError);
  } else {
    console.log(`Found ${prds.length} rows in product_requirements_docs:`);
    console.log(prds);
  }

  console.log('--- Checking generated_documents for PRD ---');
  const { data: docs, error: docError } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('document_type', 'product_requirements_document');
  
  if (docError) {
    console.error('Doc Error:', docError);
  } else {
    console.log(`Found ${docs.length} rows in generated_documents for PRD:`);
    console.log(docs);
  }
}

test();
