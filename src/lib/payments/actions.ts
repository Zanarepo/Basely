'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getPrioritizedGateways } from './index'
import { calculatePppPrice } from '../pricing/ppp-engine'

export async function createCheckoutSessionAction(
  organizationId: string,
  targetTier: 'free' | 'premium' | 'enterprise',
  autoRenew: boolean,
  countryCode: string
) {
  try {
    const supabase = createAdminClient()
    
    // In a real app we'd fetch the user's email, for this action we assume the caller is admin
    // We'll mock it for the transaction if not available, but Paystack requires an email.
    // Let's get the org owner's email
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, profiles(email)')
      .eq('organization_id', organizationId)
      .eq('role', 'Owner')
      .limit(1)

    let customerEmail = 'admin@example.com'
    if (members && members[0] && members[0].profiles && members[0].profiles[0]) {
      customerEmail = members[0].profiles[0].email
    }

    const basePrices: Record<string, number> = {
      premium: 25,
      enterprise: 65
    }

    const priceInfo = calculatePppPrice(basePrices[targetTier], countryCode)

    // Get active gateway based on geo/environment
    const gateways = getPrioritizedGateways(countryCode)

    for (const gateway of gateways) {
      try {
        const result = await gateway.initializeTransaction({
          organizationId,
          tierId: targetTier,
          amount: priceInfo.finalAmount,
          currency: priceInfo.currency,
          autoRenew,
          customerEmail
        })

        if (result.ok && result.url) {
          return { ok: true, url: result.url }
        }
        
        console.warn('Gateway initialized failed, falling back to next...', result.error)
      } catch (err) {
        console.warn('Gateway threw error, falling back to next...', err)
      }
    }

    return { ok: false, error: 'All payment gateways are currently unavailable. Please try again later.' }
  } catch (error: any) {
    console.error('Checkout error:', error)
    return { ok: false, error: error.message }
  }
}
