const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkSchemas() {
  const [activitiesRes, risksRes, evmRes] = await Promise.all([
    supabase.from('activities').select('*').limit(1),
    supabase.from('risks').select('*').limit(1),
    supabase.from('evm_snapshots').select('*').limit(1)
  ])

  console.log('Activity columns:', Object.keys(activitiesRes.data?.[0] || {}))
  console.log('Risk columns:', Object.keys(risksRes.data?.[0] || {}))
  console.log('EVM Snapshot columns:', Object.keys(evmRes.data?.[0] || {}))
}

checkSchemas()
