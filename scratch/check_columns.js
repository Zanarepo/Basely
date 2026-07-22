const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkColumns() {
  const { data, error } = await supabase.from('projects').select('*').limit(1)
  if (error) {
    console.error('Error fetching projects:', error)
  } else {
    console.log('Project columns:', Object.keys(data[0] || {}))
  }
}

checkColumns()
