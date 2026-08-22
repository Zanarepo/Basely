import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: elem } = await supabase.from('wbs_elements').select('id, project_id, is_work_package').limit(1).single()
  console.log('Testing on element:', elem)
  
  if(elem) {
    const res = await fetch('http://localhost:3000/api/test-quality-gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: elem.id, projectId: elem.project_id })
    })
  }
}
test()
