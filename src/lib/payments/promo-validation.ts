'use server'

import { createAdminClient } from '@/utils/supabase/admin'

export type PromoValidationResult = {
  valid: boolean
  message?: string
  promo?: any
}

export async function validatePromoCode(code: string, organizationId: string): Promise<PromoValidationResult> {
  if (!code) return { valid: false, message: 'No code provided.' }

  const supabase = createAdminClient()

  const { data: promo, error } = await supabase
    .from('promotions')
    .select(`
      *,
      promotion_organizations(organization_id)
    `)
    .eq('code', code.toUpperCase())
    .single()

  if (error || !promo) {
    return { valid: false, message: 'Invalid promo code.' }
  }

  if (!promo.is_active) {
    return { valid: false, message: 'This promo code is no longer active.' }
  }

  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    return { valid: false, message: 'This promo code has expired.' }
  }

  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return { valid: false, message: 'This promo code has reached its usage limit.' }
  }

  // Check organization specific restrictions
  const orgLinks = promo.promotion_organizations || []
  if (orgLinks.length > 0) {
    const isAllowed = orgLinks.some((link: any) => link.organization_id === organizationId)
    if (!isAllowed) {
      return { valid: false, message: 'This promo code is not valid for your organization.' }
    }
  }

  return { valid: true, promo }
}

export async function getActivePromos(organizationId: string) {
  const supabase = createAdminClient()

  // Fetch promos that are active, not expired, under max uses.
  // We need to fetch ALL active promos and their org links, then filter in JS, OR use a complex PostgREST query.
  // For simplicity and considering promos table is small, we'll fetch active promos and their orgs.
  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      promotion_organizations(organization_id)
    `)
    .eq('is_active', true)

  if (error || !data) return []

  const now = new Date()
  
  // Filter out expired, fully used promos, AND promos restricted to other orgs
  return data.filter(promo => {
    if (promo.valid_until && new Date(promo.valid_until) < now) return false
    if (promo.max_uses && promo.current_uses >= promo.max_uses) return false
    
    const orgLinks = promo.promotion_organizations || []
    if (orgLinks.length > 0) {
      const isAllowed = orgLinks.some((link: any) => link.organization_id === organizationId)
      if (!isAllowed) return false
    }
    
    return true
  })
}

export async function applyPromoUsage(promoId: string) {
  const supabase = createAdminClient()
  // Atomically increment using an RPC or standard update.
  // For simplicity since Supabase JS doesn't have native atomic increments easily without RPC, 
  // we can just fetch and increment (or rely on a trigger). We will do a basic fetch and update for now.
  const { data: promo } = await supabase.from('promotions').select('current_uses').eq('id', promoId).single()
  
  if (promo) {
    await supabase
      .from('promotions')
      .update({ current_uses: (promo.current_uses || 0) + 1 })
      .eq('id', promoId)
  }
}
