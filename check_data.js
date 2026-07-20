const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkData() {
  const { data: evm } = await supabase.from('evm_snapshots').select('*')
  console.log('EVM Snapshots:', evm)
  
  const { data: acts } = await supabase.from('activities').select('id, project_id, name, baseline_finish, actual_finish, percent_complete')
  console.log('Activities:', acts?.slice(0, 3))
  
  const { data: risks } = await supabase.from('risks').select('id, project_id, title, status, created_at')
  console.log('Risks:', risks)
}

checkData()
