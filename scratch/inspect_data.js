const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function inspectData() {
  const [actTypesRes, risksRes] = await Promise.all([
    supabase.from('activities').select('type').limit(100),
    supabase.from('risks').select('*').limit(2)
  ])

  const types = new Set(actTypesRes.data?.map(a => a.type) || [])
  console.log('Unique Activity Types:', Array.from(types))
  console.log('Sample Risks:', risksRes.data)
}

inspectData()
