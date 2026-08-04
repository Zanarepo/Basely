'use client'

import React, { useState, useEffect } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { calculatePppPrice, formatCurrency, RegionalPricing } from '@/lib/pricing/ppp-engine'
import { createCheckoutSessionAction } from '@/lib/organizations/subscription-actions'

interface BillingDashboardProps {
  organizationId: string
  onPlanChanged?: () => void
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  organizationId,
  onPlanChanged,
}) => {
  const { tier, isTrialing, isExpired, daysRemaining, updating, switchPlan } = useWorkspaceTier(organizationId)
  const [isHovered, setIsHovered] = useState(false)
  const [isAutoRenew, setIsAutoRenew] = useState(true)
  const [countryCode, setCountryCode] = useState('US')
  const [isLoadingPricing, setIsLoadingPricing] = useState(true)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<TierId | null>(null)

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

  // Standard USD prices
  const basePrices: Record<TierId, number> = {
    free: 0,
    premium: 25,
    enterprise: 65
  }

  useEffect(() => {
    // Detect geo location for PPP pricing
    fetch('/api/location')
      .then(res => res.json())
      .then(data => {
        if (data.countryCode) {
          setCountryCode(data.countryCode)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingPricing(false))
  }, [])

  const handleCheckout = async (targetTier: TierId) => {
    setIsCheckoutLoading(targetTier)
    if (targetTier === 'free') {
      await switchPlan('free', true)
      setIsCheckoutLoading(null)
      if (onPlanChanged) onPlanChanged()
      return
    }

    const priceInfo = calculatePppPrice(basePrices[targetTier], countryCode)
    
    // Create Paystack checkout session
    const res = await createCheckoutSessionAction(
      organizationId,
      targetTier,
      priceInfo.finalAmount,
      priceInfo.currency,
      isAutoRenew
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

  const tiers: { id: TierId; name: string; badge: string; color: string }[] = [
    { id: 'free', name: 'Free Starter', badge: 'Basic 1 Proj', color: 'from-gray-600 to-slate-700' },
    { id: 'premium', name: 'Premium', badge: 'Unlimited + Starter + Biz', color: 'from-blue-600 to-indigo-600' },
    { id: 'enterprise', name: 'Enterprise', badge: 'Full Gov & ERP', color: 'from-purple-600 to-fuchsia-600' },
  ]

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-app-bg p-6 max-w-4xl mx-auto shadow-sm"
    >

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            💳
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Billing & Subscription</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your workspace subscription and view localized pricing.
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-gray-50 dark:bg-black/40 p-2 rounded-xl border border-gray-200 dark:border-white/10">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Current Plan:</span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
              isTrialing
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                : tier === 'enterprise'
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                : tier === 'premium'
                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tier} {isTrialing ? `(Trial: ${daysRemaining}d left)` : (isExpired && tier !== 'free') ? '(Expired)' : ''}
          </span>
        </div>
      </div>

      {/* Billing Options Toggle */}
      <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 rounded-xl p-4 mb-6 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Billing Frequency</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Choose how you'd like to pay for your subscription.</p>
        </div>
        <div className="flex bg-gray-200/50 dark:bg-black/50 p-1 rounded-lg border border-gray-200 dark:border-white/10">
          <button 
            style={{ cursor: 'pointer' }}
            onClick={() => handleSetAutoRenew(true)}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${isAutoRenew ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Auto-Renew Monthly
          </button>
          <button 
            style={{ cursor: 'pointer' }}
            onClick={() => handleSetAutoRenew(false)}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${!isAutoRenew ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Manual 1-Month
          </button>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-white/10 my-4 relative z-10" />

      {/* Interactive controls: hover-revealed action buttons */}
      <div className="space-y-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => {
            const isSelected = tier === t.id && (!isExpired || t.id === 'free')
            
            // Calculate localized price
            const priceInfo = calculatePppPrice(basePrices[t.id], countryCode)
            
            return (
              <div
                key={t.id}
                className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? 'bg-white dark:bg-gray-800 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <strong className="text-base text-gray-900 dark:text-white font-extrabold">{t.name}</strong>
                    {isSelected && <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">✓ Active</span>}
                  </div>
                  
                  {/* Pricing Display */}
                  <div className="mb-3">
                    {t.id === 'free' ? (
                      <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(0, priceInfo.currency)}<span className="text-xs text-gray-500 dark:text-gray-400 font-normal">/seat</span></span>
                    ) : isLoadingPricing ? (
                      <span className="text-sm text-gray-400 animate-pulse">Calculating local price...</span>
                    ) : (
                      <div>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(priceInfo.finalAmount, priceInfo.currency)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mb-1">/seat</span>
                        </div>
                        {priceInfo.discountPercentage > 0 && (
                          <div className="mt-1">
                            <span className="inline-block bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                              {priceInfo.discountPercentage}% Regional Discount applied!
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">{t.badge}</span>
                </div>

                {/* Hover-revealed button */}
                <button
                  disabled={updating || isSelected || isCheckoutLoading !== null}
                  onClick={() => handleCheckout(t.id)}
                  style={{ cursor: isSelected ? 'default' : 'pointer' }}
                  className={`mt-6 w-full py-2.5 px-4 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                    isHovered || isSelected || isCheckoutLoading === t.id
                      ? 'opacity-100'
                      : 'opacity-100 sm:opacity-0'
                  } ${
                    isSelected
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-200 dark:border-white/5'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  }`}
                >
                  {isCheckoutLoading === t.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : updating ? (
                    'Processing...'
                  ) : isSelected ? (
                    'Current Plan'
                  ) : t.id === 'free' ? (
                    'Downgrade to Free'
                  ) : (
                    `Checkout ${t.id.toUpperCase()}`
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Map the old component name to the new one so we don't break existing imports right away
export const ManualPlanSwitcher = BillingDashboard
export const SubscriptionTester = BillingDashboard
