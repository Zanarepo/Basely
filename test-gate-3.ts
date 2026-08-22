import { updateWbsElement } from './src/lib/wbs/core-actions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function test() {
  const { data: elem } = await supabase.from('wbs_elements').select('*').eq('is_work_package', true).limit(1).single();
  if (!elem) { console.log('No work package'); return; }
  
  // ensure no signoff
  await supabase.from('wbs_quality_signoffs').delete().eq('wbs_element_id', elem.id);

  console.log('Testing auto-save payload:');
  const res1 = await updateWbsElement(elem.id, elem.project_id, { status: 'Complete' });
  console.log('Auto-save result:', res1);

  console.log('Testing manual save payload:');
  const res2 = await updateWbsElement(elem.id, elem.project_id, { status: 'Complete', name: elem.name, isWorkPackage: true });
  console.log('Manual save result:', res2);
}
test();
