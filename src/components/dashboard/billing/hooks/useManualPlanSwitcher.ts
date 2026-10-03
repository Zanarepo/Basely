import { useState, useEffect } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { calculatePppPrice, RegionalPricing } from '@/lib/pricing/ppp-engine'
import { createCheckoutSessionAction } from '@/lib/organizations/subscription-actions'
import { validatePromoCode, type PromoValidationResult } from '@/lib/payments/promo-validation'

export interface UseManualPlanSwitcherProps {
  organizationId: string
  onPlanChanged?: () => void
}

export function useManualPlanSwitcher({
  organizationId,
  onPlanChanged,
}: UseManualPlanSwitcherProps) {
  const { tier, isTrialing, isExpired, daysRemaining, updating, switchPlan } = useWorkspaceTier(organizationId)
  
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isAutoRenew, setIsAutoRenew] = useState(true)
  const [countryCode, setCountryCode] = useState('US')
  const [isLoadingPricing, setIsLoadingPricing] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<TierId | null>(null)
  
  // Dynamic DB state
  const [basePrices, setBasePrices] = useState<Record<TierId, number>>({ free: 0, premium: 49, enterprise: 199 })
  const [dynamicRegion, setDynamicRegion] = useState<RegionalPricing | undefined>(undefined)
  
  // Promo State
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null)
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false)

  useEffect(() => {
    // Restore billing cycle preference
    const saved = localStorage.getItem('zanarepo_billing_cycle')
    if (saved !== null) setIsAutoRenew(saved === 'true')

    // Handle bfcache (back button from checkout)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsCheckoutLoading(null)
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const handleSetAutoRenew = (value: boolean) => {
    setIsAutoRenew(value)
    localStorage.setItem('zanarepo_billing_cycle', value ? 'auto' : 'manual')
  }

  useEffect(() => {
    // Detect geo location for PPP pricing and fetch dynamic tiers/discounts
    const initPricing = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        
        // Fetch subscription tiers (flat rate)
        const { data: tiersData } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('billing_model', 'flat_rate')
        
        if (tiersData && tiersData.length > 0) {
          const newPrices = { free: 0, premium: 49, enterprise: 199 }
          tiersData.forEach(t => {
            if (t.id === 'free') newPrices.free = Number(t.price_per_seat) || 0
            if (t.id === 'premium') newPrices.premium = Number(t.price_per_seat) || 49
            if (t.id === 'enterprise') newPrices.enterprise = Number(t.price_per_seat) || 199
          })
          setBasePrices(newPrices as Record<TierId, number>)
        }

        // Fetch location
        const res = await fetch('/api/location')
        const locData = await res.json()
        const code = locData.countryCode || 'US'
        setCountryCode(code)

        // Fetch regional discount config for this country
        const { data: regionData } = await supabase
          .from('regional_discounts')
          .select('*')
          .eq('country_code', code)
          .single()
        
        if (regionData) {
          setDynamicRegion({
            countryCode: regionData.country_code,
            currency: regionData.currency as any,
            discountMultiplier: Number(regionData.discount_multiplier),
            exchangeRateToUsd: Number(regionData.exchange_rate_to_usd)
          })
        }
      } catch (err) {
        console.error('Error fetching pricing data:', err)
      } finally {
        setIsLoadingPricing(false)
      }
    }
    
    initPricing()
  }, [])

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setIsVerifyingPromo(true)
    const result = await validatePromoCode(promoInput.trim(), organizationId)
    setAppliedPromo(result)
    setIsVerifyingPromo(false)
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoInput('')
  }

  const handleCheckout = async (targetTier: TierId) => {
    setIsCheckoutLoading(targetTier)
    if (targetTier === 'free') {
      await switchPlan('free', true)
      setIsCheckoutLoading(null)
      if (onPlanChanged) onPlanChanged()
      return
    }

    const priceInfo = calculatePppPrice(basePrices[targetTier], countryCode, dynamicRegion)
    
    // Create Paystack checkout session
    const res = await createCheckoutSessionAction(
      organizationId,
      targetTier,
      priceInfo.finalAmount,
      priceInfo.currency,
      isAutoRenew,
      appliedPromo?.valid && appliedPromo.promo ? appliedPromo.promo.code : undefined
    )
    
    if (res.ok && res.url) {
      // Redirect to Paystack secure checkout
      window.location.href = res.url
      // Fallback timeout in case pageshow doesn't catch it
      setTimeout(() => setIsCheckoutLoading(null), 1000)
    } else {
      alert(`Checkout Failed: ${res.error || 'Unknown error'}`)
      setIsCheckoutLoading(null)
    }
  }

  return {
    tier,
    isTrialing,
    isExpired,
    daysRemaining,
    updating,
    isOpen,
    setIsOpen,
    isHovered,
    setIsHovered,
    isAutoRenew,
    handleSetAutoRenew,
    countryCode,
    isLoadingPricing,
    isCheckoutLoading,
    basePrices,
    dynamicRegion,
    promoInput,
    setPromoInput,
    appliedPromo,
    isVerifyingPromo,
    handleApplyPromo,
    handleRemovePromo,
    handleCheckout,
  }
}
