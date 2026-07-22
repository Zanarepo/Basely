const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkColumns() {
  const { data, error } = await supabase.from('baselines').select('*').limit(1)
  if (error) {
    console.error('Error fetching baselines:', error)
  } else {
    console.log('Baselines columns:', Object.keys(data?.[0] || {}))
  }
}

checkColumns()
