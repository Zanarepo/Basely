const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function checkProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Projects:', data)
  }
}

checkProjects()
