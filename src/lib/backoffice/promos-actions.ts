'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getStaffSession } from '@/lib/backoffice/auth'
import { revalidatePath } from 'next/cache'
import { createStripeCoupon, createPaystackDiscount } from '@/lib/payments/promos'

export async function getPromotions() {
  const staff = await getStaffSession()
  if (!staff) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('promotions')
    .select(`
      *,
      promotion_organizations(organizations(id, name)),
      creator:created_by(email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch promotions', error)
    return []
  }

  return data
}

type CreatePromoParams = {
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  duration: 'once' | 'repeating' | 'forever'
  duration_in_months?: number
  max_uses?: number
  organization_ids?: string[]
}

export async function createPromotion(params: CreatePromoParams) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can create promotions.' }
  }

  const supabase = createAdminClient()

  // 1. Call Payment Gateways
  let stripeCouponId = null
  let paystackCouponId = null
  
  try {
    const stripeRes = await createStripeCoupon(params)
    stripeCouponId = stripeRes.id
    
    const paystackRes = await createPaystackDiscount(params)
    paystackCouponId = paystackRes.id
  } catch (error: any) {
    console.error('Gateway Error:', error)
    return { success: false, error: `Payment Gateway Error: ${error.message}` }
  }

  // 2. Insert into Database
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      code: params.code.toUpperCase(),
      discount_type: params.discount_type,
      discount_value: params.discount_value,
      duration: params.duration,
      duration_in_months: params.duration_in_months,
      max_uses: params.max_uses,
      stripe_coupon_id: stripeCouponId,
      paystack_coupon_id: paystackCouponId,
      created_by: staff.id
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  if (params.organization_ids && params.organization_ids.length > 0) {
    const orgLinks = params.organization_ids.map(orgId => ({
      promotion_id: data.id,
      organization_id: orgId
    }))
    await supabase.from('promotion_organizations').insert(orgLinks)
  }

  revalidatePath('/backoffice/promos')
  return { success: true, data }
}

export async function togglePromotion(id: string, isActive: boolean) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can toggle promotions.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promotions')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  // NOTE: Depending on requirements, we might want to also disable the coupon in Stripe/Paystack.
  // For now, we rely on the internal database flag for our checkout flow.

  revalidatePath('/backoffice/promos')
  return { success: true }
}

export async function editPromotion(id: string, params: Partial<CreatePromoParams>) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can edit promotions.' }
  }

  const supabase = createAdminClient()

  // 1. Update Promo Table
  const updateData: any = {}
  if (params.code) updateData.code = params.code.toUpperCase()
  if (params.discount_type) updateData.discount_type = params.discount_type
  if (params.discount_value !== undefined) updateData.discount_value = params.discount_value
  if (params.duration) updateData.duration = params.duration
  if (params.duration_in_months !== undefined) updateData.duration_in_months = params.duration_in_months
  if (params.max_uses !== undefined) updateData.max_uses = params.max_uses
  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('promotions')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  // 2. Update Junction Table if organization_ids are provided
  if (params.organization_ids !== undefined) {
    // Delete existing
    await supabase.from('promotion_organizations').delete().eq('promotion_id', id)
    
    // Insert new
    if (params.organization_ids.length > 0) {
      const orgLinks = params.organization_ids.map(orgId => ({
        promotion_id: id,
        organization_id: orgId
      }))
      await supabase.from('promotion_organizations').insert(orgLinks)
    }
  }

  revalidatePath('/backoffice/promos')
  return { success: true }
}

export async function deletePromotion(id: string) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can delete promotions.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/backoffice/promos')
  return { success: true }
}

export async function searchOrganizations(query: string) {
  const staff = await getStaffSession()
  if (!staff) return []

  const supabase = createAdminClient()
  
  let dbQuery = supabase
    .from('organizations')
    .select('id, name')
    .limit(10)

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Failed to search organizations', error)
    return []
  }

  return data
}
