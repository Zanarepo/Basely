const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  const projectId = 'ff0cf0ec-072e-42fc-bcd2-efd1ed2fbcb3';
  const orgId = 'ddf2ee1b-d938-42dc-aaa6-586b18494212';

  console.log('--- Simulating PRD Metadata Upsert ---');
  // Existing row ID: '4e0d9c88-ed0f-41ff-9ce1-e57edb5e5f81'
  const payload = {
    id: '4e0d9c88-ed0f-41ff-9ce1-e57edb5e5f81',
    organization_id: orgId,
    project_id: projectId,
    target_persona_id: '0ade1217-44b5-4d79-b853-b488b80c9f92',
    primary_okr_id: 'b02d38d1-cda7-4d63-a20a-de61ed4c726c',
    figma_url: 'http://localhost:3000/test',
    prd_status: 'in_review',
    updated_at: new Date().toISOString()
  };

  const { data: upsertData, error: upsertErr } = await supabase
    .from('product_requirements_docs')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  console.log('Upsert PRD Metadata result:', { data: upsertData, error: upsertErr });

  console.log('--- Simulating PRD Document Free Text Save ---');
  const freeText = {
    __prd_template_variant: 'b2b_enterprise',
    problem_tier_segment: 'Test problem statement enterprise',
    business_product_metrics: 'Test metrics content'
  };

  const { data: docData, error: docErr } = await supabase
    .from('generated_documents')
    .update({
      free_text_content: freeText,
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId)
    .eq('document_type', 'product_requirements_document')
    .eq('is_snapshot', false)
    .select();

  console.log('Update Document result:', { data: docData, error: docErr });
}

testSave();
