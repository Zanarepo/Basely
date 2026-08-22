import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: elem } = await supabase.from('wbs_elements').select('id, project_id, is_work_package').eq('is_work_package', true).limit(1).single()
  console.log('Testing on element:', elem)
  
  if(elem) {
    // Delete any signoffs
    await supabase.from('wbs_quality_signoffs').delete().eq('wbs_element_id', elem.id)
    
    // Make sure standards exist
    const { data: qmp } = await supabase.from('quality_management_plans').select('id').eq('project_id', elem.project_id).maybeSingle()
    if(qmp) {
      const { data: stds } = await supabase.from('quality_standards').select('*').eq('plan_id', qmp.id)
      console.log('Standards:', stds)
    }

    const res = await fetch('http://localhost:3000/api/test-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: elem.id, projectId: elem.project_id, updates: { status: 'Complete' } })
    })
  }
}
test()
