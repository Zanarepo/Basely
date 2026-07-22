import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const isSimulated = searchParams.get('simulate_idp') === 'true'
  const orgId = searchParams.get('org_id')
  const email = searchParams.get('email')

  if (!isSimulated || !orgId || !email) {
    return NextResponse.redirect(`${origin}/login?error=Invalid+SSO+callback+parameters`)
  }

  // 1. In a real scenario, we would parse the SAML XML or OAuth token here,
  // verify the signature using sso_configurations.certificate, and extract attributes.
  // We simulate a successful IdP authentication for this email.

  const supabase = await createClient()

  // 2. Verify SSO status via RPC (which has SECURITY DEFINER to bypass RLS for unauthenticated callbacks)
  const { data } = await (supabase.rpc as any)('check_sso_status', { p_email: email }).maybeSingle()
  const status = data as { enforced?: boolean } | null

  if (!status || !status.enforced) {
    return NextResponse.redirect(`${origin}/login?error=SSO+configuration+not+found+or+not+enforced`)
  }

  // 3. Authenticate the user in Supabase.
  // Since we don't have the user's password, and we are acting as the IdP broker,
  // we could use supabase.auth.admin to generate a link or custom token.
  // However, Supabase Auth natively requires a magic link or password if not using its built-in enterprise SAML.
  // For the sake of this prototype, if the user doesn't have an active session, 
  // we will assume the IdP is trusted and use a secure server-side session workaround,
  // or use OTP / Magic Link seamlessly behind the scenes.
  
  // To avoid bypassing Supabase's secure auth system in a production app without Enterprise SSO,
  // a common pattern is to generate a magic link via admin API and immediately consume it,
  // or use a service role client to issue a custom JWT.
  
  // In our sprint scope, we'll try to find the user.
  // We'll use a mocked "IdP successful" redirect to a special dashboard route or handle it securely.
  
  // *PROTOTYPE WORKAROUND*: In a real app, this would use `@supabase/supabase-js` `admin.generateLink`
  // and we'd redirect to that link to securely log them in. 
  // Let's implement that exact pattern using the service role key if available, 
  // but since we are standard `createClient` (anon/user), we can't do admin actions here easily
  // without the service_role key.
  
  // Let's redirect them to a special handler or just tell them it's simulated.
  // Actually, we can use the `supabase.auth.signInWithOtp({ email })` as a fallback, but that sends an email.
  
  // Since this is a prototype of the FLOW, we will redirect back to login with a special success message
  // and in a real environment, Supabase's native enterprise SSO would handle the `/auth/v1/sso/saml/acs` callback directly.
  // The PRD says "integrating with the existing Supabase Auth session pattern".
  
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('Your organization uses Single Sign-On (SSO). Please sign in using your SSO provider.')}`
  )
}
