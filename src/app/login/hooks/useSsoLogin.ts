import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function useSsoLogin() {
  const [isCheckingSso, setIsCheckingSso] = useState(false)
  const router = useRouter()

  const checkAndRedirectSso = async (email: string) => {
    setIsCheckingSso(true)
    try {
      const supabase = createClient()
      
      // Call the RPC to check SSO status
      const { data, error } = await (supabase.rpc as any)(
        'check_sso_status',
        { p_email: email }
      ).maybeSingle()

      if (error) {
        console.error('SSO Check Error:', error)
        // If error, return false so the UI falls back to password input
        return { isSsoEnforced: false, orgId: null }
      }

      const ssoData = data as {
        enforced?: boolean
        organization_id?: string
        is_break_glass?: boolean
        idp_url?: string
      } | null

      const isSsoEnforced = ssoData?.enforced === true
      const orgId = ssoData?.organization_id ?? null
      const isBreakGlass = ssoData?.is_break_glass === true
      const idpUrl = ssoData?.idp_url ?? null

      return { isSsoEnforced, orgId, isBreakGlass, idpUrl }
    } catch (err) {
      console.error('Unexpected error checking SSO:', err)
      return { isSsoEnforced: false, orgId: null, isBreakGlass: false, idpUrl: null }
    } finally {
      setIsCheckingSso(false)
    }
  }

  const initiateSsoFlow = async (orgId: string, email: string, idpUrl?: string | null) => {
    try {
      if (!idpUrl) {
        return { error: 'Identity Provider URL is missing in SSO configuration.' }
      }
      
      // Store state in localStorage to verify upon callback
      localStorage.setItem('sso_pending_org_id', orgId)
      localStorage.setItem('sso_pending_email', email)
      
      // Redirect to our local callback simulator to demonstrate the flow
      window.location.href = `/auth/sso/callback?simulate_idp=true&org_id=${orgId}&email=${encodeURIComponent(email)}`
      return { error: null }
    } catch (err) {
      console.error(err)
      return { error: 'Failed to initiate SSO login.' }
    }
  }

  return {
    isCheckingSso,
    checkAndRedirectSso,
    initiateSsoFlow
  }
}
