import { NextResponse } from 'next/server'
import { generateGoogleAuthUrl } from '@/lib/integrations/calendar-logic'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  // Ensure user is logged in before initiating OAuth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  // Generate the OAuth URL
  const url = generateGoogleAuthUrl(projectId || undefined)

  // Redirect the user to Google
  return NextResponse.redirect(url)
}
