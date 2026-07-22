const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkColumns() {
  const { data } = await supabase.from('baseline_activity_snapshots').select('*').limit(1)
  console.log('Baseline Activity Snapshot columns:', Object.keys(data?.[0] || {}))
}

checkColumns()
