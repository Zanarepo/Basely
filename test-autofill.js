const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: wbs, error: wbsErr } = await supabase
    .from('wbs_elements')
    .select('*, raci_assignments(*, stakeholder:stakeholders(*))')
    .eq('project_id', 'ff0cf0ec-072e-42fc-bcd2-efd1ed2fbcb3')
    .eq('is_work_package', true)
    .order('sort_order', { ascending: true });

  console.log('WBS Error:', wbsErr);
  
  const { data: raci, error: raciErr } = await supabase
    .from('raci_assignments')
    .select('*, stakeholder:stakeholders(*), wbs_element:wbs_elements(*)')
    .eq('project_id', 'ff0cf0ec-072e-42fc-bcd2-efd1ed2fbcb3');
    
  console.log('RACI Error:', raciErr);
}

test();
